import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v5.0 — Balasan diskusi (publik).
 * POST publik (rate limit 5/menit/IP): balas thread APPROVED/LOCKED?
 *      → thread LOCKED tidak menerima balasan; balasan baru status PENDING.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!rateLimit(req, "forum-reply", 5, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const authorName = String(body.authorName || "").trim();
    const replyBody = String(body.body || "").trim();
    if (authorName.length < 3) return fail("Nama Anda minimal 3 karakter.");
    if (replyBody.length < 10) return fail("Balasan minimal 10 karakter.");

    const thread = await db.forumThread.findUnique({ where: { id } });
    if (!thread || (thread.status !== "APPROVED" && thread.status !== "LOCKED")) {
      return fail("Diskusi tidak ditemukan.", 404);
    }
    if (thread.status === "LOCKED") {
      return fail("Diskusi ini telah dikunci — tidak menerima balasan baru.");
    }

    const reply = await db.forumReply.create({
      data: { threadId: id, authorName, body: replyBody, status: "PENDING" },
    });

    return ok(
      { id: reply.id, message: "Balasan terkirim — akan tampil setelah moderasi tim MUHDIN." },
      201
    );
  } catch {
    return fail("Gagal mengirim balasan.", 500);
  }
}
