import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail, slugify } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tutorial = await db.tutorial.findUnique({ where: { id } });
  if (!tutorial) return fail("Tutorial tidak ditemukan.", 404);
  return ok(tutorial);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.category !== undefined) data.category = String(body.category);
    if (body.level !== undefined) data.level = String(body.level);
    if (body.duration !== undefined) data.duration = parseInt(body.duration, 10) || 10;
    if (body.summary !== undefined) data.summary = String(body.summary);
    if (body.content !== undefined) data.content = String(body.content);
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    if (body.published !== undefined) data.published = Boolean(body.published);
    if (body.slug !== undefined) data.slug = slugify(body.slug) || undefined;
    const tutorial = await db.tutorial.update({ where: { id }, data });
    return ok(tutorial);
  } catch {
    return fail("Gagal memperbarui tutorial.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.tutorial.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus tutorial.", 500);
  }
}
