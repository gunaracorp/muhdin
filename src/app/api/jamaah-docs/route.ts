import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, computeLifecycle } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Brankas Dokumen Jamaah (proses): paspor/visa/vaksin/tiket/asuransi
 * menempel pada kartu jamaah. Peringatan kedaluwarsa otomatis (EXPIRING ≤90 hari).
 * GET  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: semua dokumen (?cardNo= filter).
 * GET  publik ?cardNo=XXX: ringkasan dokumen milik kartu (tanpa docNo/fileUrl) — mode brankas jamaah.
 * POST publik (rateLimit 6/menit/IP): ajukan dokumen baru → PENDING; kartu harus ACTIVE.
 */

const KINDS = ["PASPOR", "VISA", "VAKSIN", "TIKET", "ASURANSI", "LAINNYA"];

function withLifecycle(doc: { expiryDate: Date | string | null }) {
  const { lifecycle, daysLeft } = computeLifecycle(doc.expiryDate);
  return { ...doc, lifecycle, daysLeft };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const cardNo = sp.get("cardNo")?.trim();

    // Mode publik: ringkasan brankas untuk pemilik kartu.
    if (sp.get("mode") === "public") {
      if (!cardNo) return fail("Nomor kartu wajib diisi.");
      const card = await db.pilgrimCard.findUnique({
        where: { cardNo },
        select: { id: true, cardNo: true, fullName: true, groupName: true, status: true },
      });
      if (!card) return fail("Kartu tidak ditemukan. Periksa kembali nomor kartu Anda.", 404);

      const docs = await db.jamaahDoc.findMany({
        where: { pilgrimCardId: card.id },
        orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
      });
      // Ringkasan aman: tanpa docNo penuh & fileUrl.
      const safe = docs.map((d) => {
        const { lifecycle, daysLeft } = computeLifecycle(d.expiryDate);
        const masked = d.docNo ? `${d.docNo.slice(0, 3)}••••${d.docNo.slice(-2)}` : "";
        return {
          id: d.id,
          kind: d.kind,
          docNoMasked: masked,
          issueDate: d.issueDate,
          expiryDate: d.expiryDate,
          verifyStatus: d.verifyStatus,
          note: d.note,
          lifecycle,
          daysLeft,
        };
      });
      return ok({ card, docs: safe });
    }

    const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
    if (denied) return denied;

    const where: Record<string, unknown> = {};
    if (cardNo) where.card = { is: { cardNo: cardNo } };
    const q = sp.get("q")?.trim();
    if (q) where.OR = [{ docNo: { contains: q } }, { card: { is: { fullName: { contains: q } } } }];

    const rows = await db.jamaahDoc.findMany({
      where,
      include: { card: { select: { id: true, cardNo: true, fullName: true, groupName: true, status: true } } },
      orderBy: [{ verifyStatus: "asc" }, { createdAt: "desc" }],
    });
    return ok(rows.map(withLifecycle));
  } catch {
    return fail("Gagal memuat brankas dokumen.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(req, "jamaah-docs", 6, 60_000)) {
      return fail("Terlalu banyak pengajuan. Coba lagi beberapa menit lagi.", 429);
    }
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const cardNo = String(body.cardNo || "").trim().toUpperCase();
    if (!cardNo) return fail("Nomor kartu jamaah wajib diisi.");
    const card = await db.pilgrimCard.findUnique({ where: { cardNo } });
    if (!card) return fail("Kartu jamaah tidak ditemukan. Periksa nomor kartu Anda.", 404);
    if (card.status !== "ACTIVE") return fail("Kartu tidak aktif — hubungi panitia MUHDIN.", 403);

    const kind = KINDS.includes(String(body.kind)) ? String(body.kind) : "PASPOR";
    const issueDate = body.issueDate ? new Date(String(body.issueDate)) : null;
    const expiryDate = body.expiryDate ? new Date(String(body.expiryDate)) : null;
    if (issueDate && Number.isNaN(issueDate.getTime())) return fail("Tanggal terbit tidak valid.");
    if (expiryDate && Number.isNaN(expiryDate.getTime())) return fail("Tanggal kedaluwarsa tidak valid.");

    const doc = await db.jamaahDoc.create({
      data: {
        pilgrimCardId: card.id,
        kind,
        docNo: String(body.docNo || ""),
        issueDate,
        expiryDate,
        fileUrl: body.fileUrl ? String(body.fileUrl) : null,
        note: body.note ? String(body.note) : null,
        verifyStatus: "PENDING",
      },
    });

    void logAudit(req, { action: "CREATE", entity: "JamaahDoc", entityId: doc.id, detail: `${cardNo} — ${kind} (diajukan pemilik)` });
    return ok(withLifecycle(doc), 201);
  } catch {
    return fail("Gagal mengajukan dokumen.", 500);
  }
}
