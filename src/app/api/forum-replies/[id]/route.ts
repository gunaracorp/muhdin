import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v5.0 — Moderasi balasan forum (CMS).
 * PUT  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: APPROVED / REJECTED.
 * DELETE admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: hapus balasan.
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const status = String(body.status || "");
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) return fail("Status tidak valid.");

    const reply = await db.forumReply.update({ where: { id }, data: { status } });
    void logAudit(req, {
      action: "UPDATE",
      entity: "ForumReply",
      entityId: id,
      detail: `balasan ${reply.authorName} → ${status}`,
    });
    return ok(reply);
  } catch {
    return fail("Gagal memoderasi balasan.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const reply = await db.forumReply.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "ForumReply", entityId: id, detail: reply.authorName });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus balasan.", 500);
  }
}
