/**
 * Task 18 — Kelola pelanggan newsletter (Super Admin / Admin).
 * PUT: aktifkan/nonaktifkan; DELETE: hapus.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const isActive = Boolean(body.isActive);
    const subscriber = await db.subscriber.update({ where: { id }, data: { isActive } });
    return ok(subscriber);
  } catch {
    return fail("Gagal memperbarui pelanggan.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.subscriber.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus pelanggan.", 500);
  }
}
