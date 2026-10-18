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
    if (body.step !== undefined) data.step = parseInt(body.step, 10);
    if (body.title !== undefined) data.title = String(body.title);
    if (body.activity !== undefined) data.activity = String(body.activity);
    if (body.actor !== undefined) data.actor = String(body.actor);
    if (body.output !== undefined) data.output = String(body.output);
    if (body.icon !== undefined) data.icon = String(body.icon);
    const step = await db.journeyStep.update({ where: { id }, data });
    return ok(step);
  } catch {
    return fail("Gagal memperbarui tahap.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.journeyStep.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus tahap.", 500);
  }
}
