import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";

/** Pencarian global lintas konten (publik) */
export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) return ok({ query: q, articles: [], tutorials: [], ecosystems: [] });

    const [articles, tutorials, ecosystems] = await Promise.all([
      db.article.findMany({
        where: { status: "PUBLISHED", OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { content: { contains: q } }] },
        select: { id: true, title: true, slug: true, excerpt: true, category: true, cover: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      db.tutorial.findMany({
        where: { published: true, OR: [{ title: { contains: q } }, { summary: { contains: q } }, { content: { contains: q } }] },
        select: { id: true, title: true, slug: true, summary: true, category: true, level: true },
        take: 5,
        orderBy: { order: "asc" },
      }),
      db.ecosystem.findMany({
        where: { OR: [{ name: { contains: q } }, { scope: { contains: q } }, { description: { contains: q } }] },
        take: 5,
        orderBy: { number: "asc" },
      }),
    ]);

    return ok({ query: q, articles, tutorials, ecosystems });
  } catch {
    return fail("Gagal melakukan pencarian.", 500);
  }
}
