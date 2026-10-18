/**
 * Task 18 — Pusat unduhan (publik + CMS).
 * GET  : publik → hanya published; ?all=1 mengembalikan semua BILA peminta
 *        sesi admin sah.
 * POST : Super Admin / Admin / Editor — title & fileUrl wajib.
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
        const rows = await db.resource.findMany({ orderBy: { createdAt: "desc" } });
        return ok(rows);
      }
    }
    const rows = await db.resource.findMany({
      where: { published: true },
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat dokumen.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const fileUrl = String(body.fileUrl || "").trim();
    if (!title || !fileUrl) return fail("Judul dan URL berkas wajib diisi.");
    const item = await db.resource.create({
      data: {
        title,
        description: body.description ? String(body.description) : null,
        category: String(body.category || "Formulir"),
        fileUrl,
        fileType: String(body.fileType || "PDF"),
        published: body.published === undefined ? true : Boolean(body.published),
      },
    });
    return ok(item, 201);
  } catch {
    return fail("Gagal menambah dokumen.", 500);
  }
}
