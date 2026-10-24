import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, computeLifecycle } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Compliance Hub (hulu): dokumen kepatuhan anggota PPIU/PIHK/BPW —
 * SIUJK, COP, PTA, SKAI, asuransi, rencana kerja. Status kedaluwarsa dihitung
 * otomatis: EXPIRED | EXPIRING (≤90 hari) | VALID.
 * GET  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR, EDITOR]: semua dokumen (?memberId= filter).
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: tambah dokumen.
 */

const KINDS = ["SIUJK", "COP", "PTA", "SKAI", "ASURANSI", "RENCANA_KERJA", "NPWP", "AKTA"];

const memberSelect = {
  select: { id: true, name: true, type: true, city: true, licenseNo: true, status: true },
};

function withLifecycle(doc: { expiresAt: Date | string | null }) {
  const { lifecycle, daysLeft } = computeLifecycle(doc.expiresAt);
  return { ...doc, lifecycle, daysLeft };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // Mode ringkas publik (untuk #/bisnis): agregat per anggota — tanpa detail dokumen.
  if (sp.get("mode") === "summary") {
    try {
      const docs = await db.complianceDoc.findMany({
        include: { member: { select: { id: true, name: true, type: true, city: true, status: true } } },
      });
      const byMember = new Map<string, {
        memberId: string; name: string; type: string; city: string;
        total: number; valid: number; expiring: number; expired: number; verified: number; score: number;
      }>();
      for (const d of docs) {
        const key = d.memberId;
        if (!byMember.has(key)) {
          byMember.set(key, {
            memberId: key,
            name: d.member?.name ?? "—",
            type: d.member?.type ?? "",
            city: d.member?.city ?? "",
            total: 0, valid: 0, expiring: 0, expired: 0, verified: 0, score: 0,
          });
        }
        const row = byMember.get(key)!;
        row.total += 1;
        const { lifecycle } = computeLifecycle(d.expiresAt);
        if (lifecycle === "VALID") row.valid += 1;
        else if (lifecycle === "EXPIRING") row.expiring += 1;
        else row.expired += 1;
        if (d.verified) row.verified += 1;
      }
      const members = [...byMember.values()]
        .map((m) => ({
          ...m,
          // Skor: bobot valid penuh, expiring setengah, kali verifikasi (min 0-1).
          score: m.total
            ? Math.round(((m.valid + m.expiring * 0.5) / m.total) * (m.verified / m.total > 0 ? 1 : 0.8) * 100)
            : 0,
        }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      const totals = {
        docs: docs.length,
        valid: members.reduce((a, m) => a + m.valid, 0),
        expiring: members.reduce((a, m) => a + m.expiring, 0),
        expired: members.reduce((a, m) => a + m.expired, 0),
        members: members.length,
      };
      return ok({ members, totals });
    } catch {
      return fail("Gagal memuat ringkasan kepatuhan.", 500);
    }
  }

  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR", "EDITOR"]);
  if (denied) return denied;
  try {
    const memberId = sp.get("memberId");
    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;

    const rows = await db.complianceDoc.findMany({
      where,
      include: { member: memberSelect },
      orderBy: [{ verified: "asc" }, { expiresAt: "asc" }, { createdAt: "desc" }],
    });
    return ok(rows.map(withLifecycle));
  } catch {
    return fail("Gagal memuat dokumen kepatuhan.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const memberId = String(body.memberId || "");
    if (!memberId) return fail("Anggota pemilik dokumen wajib dipilih.");
    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) return fail("Anggota tidak ditemukan.", 404);

    const kind = KINDS.includes(String(body.kind)) ? String(body.kind) : "SIUJK";
    const issuedAt = body.issuedAt ? new Date(String(body.issuedAt)) : null;
    const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;
    if (issuedAt && Number.isNaN(issuedAt.getTime())) return fail("Tanggal terbit tidak valid.");
    if (expiresAt && Number.isNaN(expiresAt.getTime())) return fail("Tanggal kedaluwarsa tidak valid.");

    const doc = await db.complianceDoc.create({
      data: {
        memberId,
        kind,
        docNo: String(body.docNo || ""),
        issuedBy: String(body.issuedBy || ""),
        issuedAt,
        expiresAt,
        fileUrl: body.fileUrl ? String(body.fileUrl) : null,
        verified: Boolean(body.verified),
        note: body.note ? String(body.note) : null,
      },
      include: { member: memberSelect },
    });

    void logAudit(req, { action: "CREATE", entity: "ComplianceDoc", entityId: doc.id, detail: `${member.name} — ${kind}` });
    return ok(withLifecycle(doc), 201);
  } catch {
    return fail("Gagal menambah dokumen kepatuhan.", 500);
  }
}
