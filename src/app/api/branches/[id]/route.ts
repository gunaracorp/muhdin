/**
 * Task 19 — Ubah / hapus jaringan kepengurusan daerah (DPD/Branch Office).
 * PUT/DELETE: Super Admin / Admin / Editor (+ jejak audit).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.code !== undefined) data.code = String(body.code).trim();
    if (body.province !== undefined) data.province = String(body.province).trim();
    if (body.city !== undefined) data.city = String(body.city).trim();
    if (body.officeName !== undefined) data.officeName = String(body.officeName).trim();
    if (body.address !== undefined) data.address = String(body.address).trim();
    if (body.picName !== undefined) data.picName = String(body.picName).trim();
    if (body.picPhone !== undefined) data.picPhone = String(body.picPhone).trim();
    if (body.email !== undefined) data.email = body.email ? String(body.email).trim() : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    if (body.published !== undefined) data.published = Boolean(body.published);
    const item = await db.regionalBranch.update({ where: { id }, data });
    void logAudit(req, { action: "UPDATE", entity: "RegionalBranch", entityId: id, detail: item.name });
    return ok(item);
  } catch {
    return fail("Gagal memperbarui jaringan daerah.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const item = await db.regionalBranch.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "RegionalBranch", entityId: id, detail: item.name });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus jaringan daerah.", 500);
  }
}
