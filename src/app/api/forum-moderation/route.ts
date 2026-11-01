import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";

/**
 * v5.0 — Moderasi forum (CMS).
 * GET admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]:
 *     seluruh thread (semua status, + jumlah balasan menunggu)
 *     + seluruh balasan PENDING (dengan judul thread).
 */
export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const threads = await db.forumThread.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: { select: { replies: { where: { status: "PENDING" } } } },
      },
    });

    const pendingReplies = await db.forumReply.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { thread: { select: { id: true, title: true, status: true } } },
    });

    return ok({
      threads: threads.map((t) => ({
        id: t.id,
        title: t.title,
        body: t.body,
        authorName: t.authorName,
        authorContact: t.authorContact,
        category: t.category,
        status: t.status,
        pinned: t.pinned,
        views: t.views,
        spamScore: t.spamScore,
        spamReasons: t.spamReasons,
        pendingReplies: t._count.replies,
        reviewedBy: t.reviewedBy,
        createdAt: t.createdAt,
      })),
      pendingReplies: pendingReplies.map((r) => ({
        id: r.id,
        threadId: r.threadId,
        threadTitle: r.thread.title,
        threadStatus: r.thread.status,
        authorName: r.authorName,
        body: r.body,
        status: r.status,
        spamScore: r.spamScore,
        spamReasons: r.spamReasons,
        createdAt: r.createdAt,
      })),
    });
  } catch {
    return fail("Gagal memuat antrean moderasi forum.", 500);
  }
}
