import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";
import { logAudit } from "@/lib/audit"; // Task 18

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") || undefined;
    const status = sp.get("status") || undefined;
    const q = sp.get("q") || undefined;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status === "all") {
      // admin: all statuses
    } else if (status) {
      where.status = status;
    } else {
      where.status = "TERVERIFIKASI";
    }
    if (q) where.OR = [{ name: { contains: q } }, { city: { contains: q } }, { licenseNo: { contains: q } }];

    const members = await db.member.findMany({
      where,
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "Member",
      rows: members,
      locale,
      keyOf: (m) => m.id,
      fields: ["description"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat anggota.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body.name || !body.licenseNo) return fail("Nama dan nomor izin wajib diisi.");
    const member = await db.member.create({
      data: {
        name: String(body.name),
        type: String(body.type || "PPIU"),
        city: String(body.city || ""),
        province: String(body.province || ""),
        licenseNo: String(body.licenseNo),
        phone: body.phone ? String(body.phone) : null,
        email: body.email ? String(body.email) : null,
        website: body.website ? String(body.website) : null,
        description: body.description ? String(body.description) : null,
        rating: parseFloat(body.rating) || 4.5,
        status: String(body.status || "TERVERIFIKASI"),
        memberSince: parseInt(body.memberSince, 10) || new Date().getFullYear(),
      },
    });
    // Task 18 — jejak audit pembuatan anggota.
    void logAudit(req, { action: "CREATE", entity: "Member", entityId: member.id, detail: member.name });
    return ok(member, 201);
  } catch {
    return fail("Gagal menambah anggota.", 500);
  }
}
