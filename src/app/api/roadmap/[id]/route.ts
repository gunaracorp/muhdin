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
    if (body.phase !== undefined) data.phase = String(body.phase);
    if (body.period !== undefined) data.period = String(body.period);
    if (body.focus !== undefined) data.focus = String(body.focus);
    if (body.deliverables !== undefined) data.deliverables = String(body.deliverables);
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    const item = await db.roadmap.update({ where: { id }, data });
    return ok(item);
  } catch {
    return fail("Gagal memperbarui fase roadmap.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.roadmap.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus fase roadmap.", 500);
  }
}
