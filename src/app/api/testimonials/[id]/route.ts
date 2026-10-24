import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name);
    if (body.role !== undefined) data.role = String(body.role);
    if (body.content !== undefined) data.content = String(body.content);
    if (body.rating !== undefined) data.rating = parseInt(body.rating, 10) || 5;
    if (body.published !== undefined) data.published = Boolean(body.published);
    const t = await db.testimonial.update({ where: { id }, data });
    return ok(t);
  } catch {
    return fail("Gagal memperbarui testimoni.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.testimonial.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus testimoni.", 500);
  }
}
