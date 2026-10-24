import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Direktori layanan darurat Tanah Suci (proses): KJRI, KKI, rumah sakit,
 * polisi (999), ambulans (997). Publik di #/darurat.
 * GET  publik: semua titik; filter ?category= &city= &country= &q=
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: tambah titik darurat.
 */

const CATEGORIES = ["HOSPITAL", "CLINIC", "EMBASSY", "CONSULATE", "CONSUL_HAJJ", "KKI", "POLICE", "EMERGENCY"];

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category");
    const city = sp.get("city");
    const country = sp.get("country");
    const q = sp.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (city) where.city = { contains: city };
    if (country) where.country = country;
    if (q) {
      where.OR = [{ name: { contains: q } }, { city: { contains: q } }, { address: { contains: q } }];
    }

    const rows = await db.sosPoint.findMany({
      where,
      orderBy: [{ featured: "desc" }, { category: "asc" }, { city: "asc" }, { name: "asc" }],
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat direktori darurat.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const name = String(body.name || "").trim();
    if (name.length < 3) return fail("Nama titik darurat minimal 3 karakter.");
    const phone = String(body.phone || "").trim();
    if (!phone) return fail("Nomor telepon wajib diisi.");

    const point = await db.sosPoint.create({
      data: {
        name,
        category: CATEGORIES.includes(String(body.category)) ? String(body.category) : "HOSPITAL",
        city: String(body.city || ""),
        country: String(body.country || "SA").toUpperCase().slice(0, 2),
        address: String(body.address || ""),
        phone,
        phone2: body.phone2 ? String(body.phone2) : null,
        hours: String(body.hours || "24 jam"),
        note: body.note ? String(body.note) : null,
        featured: Boolean(body.featured),
      },
    });

    void logAudit(req, { action: "CREATE", entity: "SosPoint", entityId: point.id, detail: point.name });
    return ok(point, 201);
  } catch {
    return fail("Gagal menambah titik darurat.", 500);
  }
}
