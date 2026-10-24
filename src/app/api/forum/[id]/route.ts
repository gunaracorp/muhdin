import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v5.0 — Detail thread forum.
 * GET  publik: thread APPROVED/LOCKED + balasan APPROVED; menambah view.
 * PUT  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: moderasi (status, pinned).
 * DELETE admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: hapus thread + balasan (Cascade).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const thread = await db.forumThread.findUnique({ where: { id } });
    if (!thread || (thread.status !== "APPROVED" && thread.status !== "LOCKED")) {
      return fail("Diskusi tidak ditemukan atau belum dipublikasikan.", 404);
    }

    // Naikkan counter view (fire-and-forget — tidak menunda respons).
    void db.forumThread.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

    const replies = await db.forumReply.findMany({
      where: { threadId: id, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    });

    return ok({
      thread: {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        authorName: thread.authorName,
        category: thread.category,
        status: thread.status,
        pinned: thread.pinned,
        views: thread.views + 1,
        createdAt: thread.createdAt,
      },
      replies,
    });
  } catch {
    return fail("Gagal memuat diskusi.", 500);
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.forumThread.findUnique({ where: { id } });
    if (!existing) return fail("Diskusi tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!["PENDING", "APPROVED", "REJECTED", "LOCKED"].includes(status)) return fail("Status tidak valid.");
      data.status = status;
      data.reviewedAt = new Date();
      const { getSessionUser } = await import("@/lib/auth");
      const user = await getSessionUser().catch(() => null);
      data.reviewedBy = user?.name ?? null;
    }
    if (body.pinned !== undefined) data.pinned = Boolean(body.pinned);

    const thread = await db.forumThread.update({ where: { id }, data });
    void logAudit(req, {
      action: "UPDATE",
      entity: "ForumThread",
      entityId: id,
      detail: `${existing.status} → ${thread.status}${thread.pinned ? " (pinned)" : ""}: ${thread.title}`,
    });
    return ok(thread);
  } catch {
    return fail("Gagal memoderasi diskusi.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const thread = await db.forumThread.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "ForumThread", entityId: id, detail: thread.title });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus diskusi.", 500);
  }
}
