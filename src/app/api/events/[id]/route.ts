/**
 * Task 18 — Agenda: ubah & hapus (Super Admin / Admin / Editor).
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
      if (!title) return fail("Judul agenda wajib diisi.");
      data.title = title;
    }
    if (body.description !== undefined) data.description = String(body.description);
    if (body.location !== undefined) data.location = String(body.location);
    if (body.startsAt !== undefined) {
      const startsAt = new Date(String(body.startsAt));
      if (isNaN(startsAt.getTime())) return fail("Tanggal & jam mulai (startsAt) tidak valid.");
      data.startsAt = startsAt;
    }
    if (body.endsAt !== undefined) {
      if (!body.endsAt) {
        data.endsAt = null;
      } else {
        const endsAt = new Date(String(body.endsAt));
        if (isNaN(endsAt.getTime())) return fail("Tanggal selesai (endsAt) tidak valid.");
        data.endsAt = endsAt;
      }
    }
    if (body.category !== undefined) data.category = String(body.category);
    if (body.published !== undefined) data.published = Boolean(body.published);
    const item = await db.event.update({ where: { id }, data });
    return ok(item);
  } catch {
    return fail("Gagal memperbarui agenda.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.event.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus agenda.", 500);
  }
}
