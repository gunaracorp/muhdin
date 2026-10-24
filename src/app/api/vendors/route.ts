import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Jaringan Vendor ekosistem (hulu): hotel, transport, katering, handler
 * Saudi, aviasi, TPA, pembiayaan. Tampil publik di #/bisnis.
 * GET  publik: vendor ACTIVE; ?status=all butuh sesi admin. Filter ?category= &country= &q=
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: daftarkan vendor baru.
 */

const CATEGORIES = ["HOTEL_MAKKAH", "HOTEL_MADINAH", "TRANSPORT", "CATERING", "HANDLER", "AVIATION", "TPA", "FINANCE"];

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const statusParam = sp.get("status");
    let statusFilter: string | undefined = "ACTIVE";
    if (statusParam === "all") {
      const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "VERIFIKATOR"]);
      if (denied) return denied;
      statusFilter = undefined;
    }

    const category = sp.get("category");
    const country = sp.get("country");
    const q = sp.get("q")?.trim();

    const where: Record<string, unknown> = { status: statusFilter };
    if (category) where.category = category;
    if (country) where.country = country;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { city: { contains: q } },
        { services: { contains: q } },
        { contact: { contains: q } },
      ];
    }

    const rows = await db.vendor.findMany({
      where,
      orderBy: [{ verified: "desc" }, { rating: "desc" }, { name: "asc" }],
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat vendor.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const name = String(body.name || "").trim();
    if (name.length < 3) return fail("Nama vendor minimal 3 karakter.");

    const rating = Number(body.rating);
    const vendor = await db.vendor.create({
      data: {
        name,
        category: CATEGORIES.includes(String(body.category)) ? String(body.category) : "HOTEL_MAKKAH",
        city: String(body.city || ""),
        country: String(body.country || "SA").toUpperCase().slice(0, 2),
        contact: String(body.contact || ""),
        phone: String(body.phone || ""),
        email: body.email ? String(body.email) : null,
        website: body.website ? String(body.website) : null,
        services: String(body.services || ""),
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0,
        verified: Boolean(body.verified),
        status: ["ACTIVE", "SUSPENDED"].includes(String(body.status)) ? String(body.status) : "ACTIVE",
        note: body.note ? String(body.note) : null,
      },
    });

    void logAudit(req, { action: "CREATE", entity: "Vendor", entityId: vendor.id, detail: vendor.name });
    return ok(vendor, 201);
  } catch {
    return fail("Gagal menambah vendor.", 500);
  }
}
