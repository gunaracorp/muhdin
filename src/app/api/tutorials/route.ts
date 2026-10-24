import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail, slugify } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category") || undefined;
    const q = sp.get("q") || undefined;
    const isAdmin = sp.get("all") === "1";

    const where: Record<string, unknown> = {};
    if (!isAdmin) where.published = true;
    if (category) where.category = category;
    if (q) where.OR = [{ title: { contains: q } }, { summary: { contains: q } }, { content: { contains: q } }];

    const tutorials = await db.tutorial.findMany({
      where,
      orderBy: { order: "asc" },
    });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "Tutorial",
      rows: tutorials,
      locale,
      keyOf: (t) => t.slug,
      fields: ["title", "summary", "content"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat tutorial.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) return fail("Judul wajib diisi.");
    const slug = slugify(body.slug || title) || `tutorial-${Date.now()}`;
    const exists = await db.tutorial.findUnique({ where: { slug } });
    const tutorial = await db.tutorial.create({
      data: {
        title,
        slug: exists ? `${slug}-${Date.now().toString(36)}` : slug,
        category: String(body.category || "Umum"),
        level: String(body.level || "Pemula"),
        duration: parseInt(body.duration, 10) || 10,
        summary: String(body.summary || ""),
        content: String(body.content || ""),
        order: parseInt(body.order, 10) || 99,
        published: body.published !== undefined ? Boolean(body.published) : true,
      },
    });
    return ok(tutorial, 201);
  } catch {
    return fail("Gagal membuat tutorial.", 500);
  }
}
