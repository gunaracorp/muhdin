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
    if (body.position !== undefined) data.position = String(body.position);
    if (body.bio !== undefined) data.bio = body.bio ? String(body.bio) : null;
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    const item = await db.management.update({ where: { id }, data });
    return ok(item);
  } catch {
    return fail("Gagal memperbarui pengurus.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.management.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus pengurus.", 500);
  }
}
