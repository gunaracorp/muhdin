/**
 * Task 18 — Agenda kegiatan (publik + CMS).
 * GET  : publik → hanya published, urut startsAt menaik (mendatang dulu);
 *        ?all=1 mengembalikan semua BILA peminta sesi admin sah.
 * POST : Super Admin / Admin / Editor — startsAt wajib (ISO string).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { guardRole, ok, fail } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    if (all) {
      const user = await requireAdmin();
      if (user) {
        const rows = await db.event.findMany({ orderBy: { startsAt: "asc" } });
        return ok(rows);
      }
    }
    const rows = await db.event.findMany({
      where: { published: true },
      orderBy: { startsAt: "asc" },
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat agenda.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) return fail("Judul agenda wajib diisi.");
    const startsAt = new Date(String(body.startsAt || ""));
    if (!body.startsAt || isNaN(startsAt.getTime())) {
      return fail("Tanggal & jam mulai (startsAt) wajib dan harus valid.");
    }
    let endsAt: Date | null = null;
    if (body.endsAt) {
      endsAt = new Date(String(body.endsAt));
      if (isNaN(endsAt.getTime())) return fail("Tanggal selesai (endsAt) tidak valid.");
    }
    const item = await db.event.create({
      data: {
        title,
        description: String(body.description || "").trim(),
        location: String(body.location || "").trim(),
        startsAt,
        endsAt,
        category: String(body.category || "Kegiatan"),
        published: body.published === undefined ? true : Boolean(body.published),
      },
    });
    return ok(item, 201);
  } catch {
    return fail("Gagal menambah agenda.", 500);
  }
}
