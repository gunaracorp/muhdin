/**
 * Pencarian global lintas konten (publik) — v10 upgrade.
 * 6 entitas: artikel, tutorial, ekosistem, anggota terverifikasi, agenda, FAQ.
 * Setiap hasil menyertakan `href` (hash route) agar command palette bisa
 * menavigasi langsung. Rate limit 30 permintaan/menit/IP.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  if (!rateLimit(req, "search", 30, 60_000)) {
    return fail("Terlalu banyak permintaan — coba lagi sebentar lagi.", 429);
  }
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return ok({ query: q, articles: [], tutorials: [], ecosystems: [], members: [], events: [], faqs: [] });
    }
    const like = { contains: q };

    const [articles, tutorials, ecosystems, members, events, faqs] = await Promise.all([
      db.article.findMany({
        where: { status: "PUBLISHED", OR: [{ title: like }, { excerpt: like }, { content: like }] },
        select: { id: true, title: true, slug: true, excerpt: true, category: true, cover: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      db.tutorial.findMany({
        where: { published: true, OR: [{ title: like }, { summary: like }, { content: like }] },
        select: { id: true, title: true, slug: true, summary: true, category: true, level: true },
        take: 4,
        orderBy: { order: "asc" },
      }),
      db.ecosystem.findMany({
        where: { OR: [{ name: like }, { scope: like }, { description: like }] },
        select: { id: true, name: true, number: true, scope: true, description: true },
        take: 4,
        orderBy: { number: "asc" },
      }),
      db.member.findMany({
        where: { status: "TERVERIFIKASI", OR: [{ name: like }, { city: like }, { province: like }, { licenseNo: like }] },
        select: { id: true, name: true, type: true, city: true, province: true, licenseNo: true },
        take: 5,
        orderBy: { name: "asc" },
      }),
      db.event.findMany({
        where: { published: true, OR: [{ title: like }, { description: like }, { location: like }] },
        select: { id: true, title: true, startsAt: true, location: true, category: true },
        take: 4,
        orderBy: { startsAt: "asc" },
      }),
      db.faq.findMany({
        where: { OR: [{ question: like }, { answer: like }] },
        select: { id: true, question: true, category: true },
        take: 4,
        orderBy: { order: "asc" },
      }),
    ]);

    return ok({
      query: q,
      articles: articles.map((a) => ({ ...a, href: `berita/${a.slug}` })),
      tutorials: tutorials.map((t) => ({ ...t, href: `tutorial/${t.slug}` })),
      ecosystems: ecosystems.map((e) => ({ ...e, href: `ekosistem/${e.number}` })),
      members: members.map((m) => ({ ...m, href: `anggota/${m.id}` })),
      events: events.map((e) => ({ ...e, href: `agenda/${e.id}` })),
      faqs: faqs.map((f) => ({ ...f, href: "faq" })),
    });
  } catch {
    return fail("Gagal melakukan pencarian.", 500);
  }
}
