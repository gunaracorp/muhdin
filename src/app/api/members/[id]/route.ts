import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit"; // Task 18

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // Task 17 — VERIFIKATOR boleh memutakhirkan data/status anggota (verifikasi),
  // namun tetap tidak dapat menambah (POST) atau menghapus (DELETE).
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name);
    if (body.type !== undefined) data.type = String(body.type);
    if (body.city !== undefined) data.city = String(body.city);
    if (body.province !== undefined) data.province = String(body.province);
    if (body.licenseNo !== undefined) data.licenseNo = String(body.licenseNo);
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone) : null;
    if (body.email !== undefined) data.email = body.email ? String(body.email) : null;
    if (body.website !== undefined) data.website = body.website ? String(body.website) : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.rating !== undefined) data.rating = parseFloat(body.rating) || 4.5;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.memberSince !== undefined) data.memberSince = parseInt(body.memberSince, 10) || new Date().getFullYear();
    const member = await db.member.update({ where: { id }, data });
    // Task 18 — jejak audit pemutakhiran anggota.
    void logAudit(req, { action: "UPDATE", entity: "Member", entityId: id, detail: member.name });
    return ok(member);
  } catch {
    return fail("Gagal memperbarui anggota.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.member.delete({ where: { id } });
    // Task 18 — jejak audit penghapusan anggota.
    void logAudit(req, { action: "DELETE", entity: "Member", entityId: id });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus anggota.", 500);
  }
}
