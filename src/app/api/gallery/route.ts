/**
 * Task 18 — Galeri kegiatan (publik + CMS).
 * GET  : publik → hanya published, urut order; ?all=1 mengembalikan semua
 *        BILA peminta membawa sesi admin sah.
 * POST : Super Admin / Admin / Editor.
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
        const rows = await db.gallery.findMany({
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });
        return ok(rows);
      }
    }
    const rows = await db.gallery.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat galeri.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();
    if (!title || !imageUrl) return fail("Judul dan URL gambar wajib diisi.");
    const item = await db.gallery.create({
      data: {
        title,
        caption: body.caption ? String(body.caption) : null,
        category: String(body.category || "Kegiatan"),
        imageUrl,
        order: parseInt(body.order, 10) || 0,
        published: body.published === undefined ? true : Boolean(body.published),
      },
    });
    return ok(item, 201);
  } catch {
    return fail("Gagal menambah galeri.", 500);
  }
}
