import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v5.0 — Forum Jamaah.
 * GET  publik: daftar thread APPROVED (+ jumlah balasan disetujui),
 *              urut pinned → terbaru. Filter ?category= &q=.
 * POST publik (rate limit 3/menit/IP): ajukan thread baru → status PENDING
 *              (moderasi CMS sebelum tampil publik).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category");
    const q = sp.get("q")?.trim();

    const where: Record<string, unknown> = { status: "APPROVED" };
    if (category) where.category = category;
    if (q) {
      where.OR = [{ title: { contains: q } }, { body: { contains: q } }, { authorName: { contains: q } }];
    }

    const threads = await db.forumThread.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { replies: { where: { status: "APPROVED" } } } } },
    });

    return ok(
      threads.map((t) => ({
        id: t.id,
        title: t.title,
        body: t.body,
        authorName: t.authorName,
        category: t.category,
        status: t.status,
        pinned: t.pinned,
        views: t.views,
        replyCount: t._count.replies,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
    );
  } catch {
    return fail("Gagal memuat diskusi.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "forum-thread", 3, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const title = String(body.title || "").trim();
    const threadBody = String(body.body || "").trim();
    const authorName = String(body.authorName || "").trim();
    const authorContact = String(body.authorContact || "").trim();
    const category = String(body.category || "Umum");

    if (title.length < 8) return fail("Judul pertanyaan minimal 8 karakter.");
    if (threadBody.length < 20) return fail("Isi diskusi minimal 20 karakter agar mudah dijawab.");
    if (authorName.length < 3) return fail("Nama Anda minimal 3 karakter.");

    const thread = await db.forumThread.create({
      data: {
        title,
        body: threadBody,
        authorName,
        authorContact,
        category: ["Manasik", "Dokumen", "Perjalanan", "Akomodasi", "Biaya", "Lainnya"].includes(category)
          ? category
          : "Lainnya",
        status: "PENDING",
      },
    });

    return ok(
      {
        id: thread.id,
        message: "Diskusi Anda terkirim dan menunggu moderasi tim MUHDIN. Terima kasih!",
      },
      201
    );
  } catch {
    return fail("Gagal mengirim diskusi.", 500);
  }
}
