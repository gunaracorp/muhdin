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
    if (body.question !== undefined) data.question = String(body.question);
    if (body.answer !== undefined) data.answer = String(body.answer);
    if (body.category !== undefined) data.category = String(body.category);
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    const faq = await db.faq.update({ where: { id }, data });
    return ok(faq);
  } catch {
    return fail("Gagal memperbarui FAQ.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.faq.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus FAQ.", 500);
  }
}
