/**
 * Task 18 — Galeri: ubah & hapus item (Super Admin / Admin / Editor).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return fail("Judul wajib diisi.");
      data.title = title;
    }
    if (body.imageUrl !== undefined) {
      const imageUrl = String(body.imageUrl).trim();
      if (!imageUrl) return fail("URL gambar wajib diisi.");
      data.imageUrl = imageUrl;
    }
    if (body.caption !== undefined) data.caption = body.caption ? String(body.caption) : null;
    if (body.category !== undefined) data.category = String(body.category);
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    if (body.published !== undefined) data.published = Boolean(body.published);
    const item = await db.gallery.update({ where: { id }, data });
    return ok(item);
  } catch {
    return fail("Gagal memperbarui galeri.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.gallery.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus galeri.", 500);
  }
}
