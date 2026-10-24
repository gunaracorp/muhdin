import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail, slugify } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    const category = sp.get("category") || undefined;
    const featured = sp.get("featured");
    const limit = parseInt(sp.get("limit") || "0", 10);
    const q = sp.get("q") || undefined;

    const where: Record<string, unknown> = {};
    if (status === "all") {
      // admin mode: show everything
    } else if (status) {
      where.status = status;
    } else {
      where.status = "PUBLISHED";
    }
    if (category) where.category = category;
    if (featured === "true") where.featured = true;
    if (q) where.OR = [{ title: { contains: q } }, { excerpt: { contains: q } }, { content: { contains: q } }];

    const articles = await db.article.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      ...(limit > 0 ? { take: limit } : {}),
    });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "Article",
      rows: articles,
      locale,
      keyOf: (a) => a.slug,
      fields: ["title", "excerpt", "content"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat artikel.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) return fail("Judul wajib diisi.");
    const slug = slugify(body.slug || title) || `artikel-${Date.now()}`;
    const exists = await db.article.findUnique({ where: { slug } });
    const article = await db.article.create({
      data: {
        title,
        slug: exists ? `${slug}-${Date.now().toString(36)}` : slug,
        excerpt: String(body.excerpt || "").trim() || title.slice(0, 140),
        content: String(body.content || ""),
        category: String(body.category || "Berita"),
        cover: body.cover ? String(body.cover) : null,
        status: String(body.status || "PUBLISHED"),
        featured: Boolean(body.featured),
        author: String(body.author || "Tim MUHDIN"),
      },
    });
    return ok(article, 201);
  } catch {
    return fail("Gagal membuat artikel.", 500);
  }
}
