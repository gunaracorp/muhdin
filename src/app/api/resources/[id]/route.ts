/**
 * Task 18 — Pusat unduhan: ubah & hapus dokumen (Super Admin / Admin / Editor).
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
    if (body.fileUrl !== undefined) {
      const fileUrl = String(body.fileUrl).trim();
      if (!fileUrl) return fail("URL berkas wajib diisi.");
      data.fileUrl = fileUrl;
    }
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.category !== undefined) data.category = String(body.category);
    if (body.fileType !== undefined) data.fileType = String(body.fileType);
    if (body.published !== undefined) data.published = Boolean(body.published);
    const item = await db.resource.update({ where: { id }, data });
    return ok(item);
  } catch {
    return fail("Gagal memperbarui dokumen.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.resource.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus dokumen.", 500);
  }
}
