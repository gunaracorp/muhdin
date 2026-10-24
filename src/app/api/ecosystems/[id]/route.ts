import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ecosystem = await db.ecosystem.findUnique({ where: { id } });
  if (!ecosystem) return fail("Ekosistem tidak ditemukan.", 404);
  return ok(ecosystem);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.number !== undefined) data.number = parseInt(body.number, 10);
    if (body.name !== undefined) data.name = String(body.name);
    if (body.cluster !== undefined) data.cluster = String(body.cluster);
    if (body.scope !== undefined) data.scope = String(body.scope);
    if (body.standard !== undefined) data.standard = String(body.standard);
    if (body.icon !== undefined) data.icon = String(body.icon);
    if (body.color !== undefined) data.color = String(body.color);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.image !== undefined) data.image = body.image ? String(body.image) : null;
    const ecosystem = await db.ecosystem.update({ where: { id }, data });
    return ok(ecosystem);
  } catch {
    return fail("Gagal memperbarui ekosistem.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.ecosystem.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus ekosistem.", 500);
  }
}
