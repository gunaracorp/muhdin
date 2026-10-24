import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const tutorial = await db.tutorial.findUnique({ where: { slug } });
  if (!tutorial || !tutorial.published) return fail("Tutorial tidak ditemukan.", 404);
  await db.tutorial.update({ where: { id: tutorial.id }, data: { views: { increment: 1 } } }).catch(() => {});
  const locale = localeFromRequest(req);
  const [translated] = await applyEntityTranslations({
    entity: "Tutorial",
    rows: [tutorial],
    locale,
    keyOf: (t) => t.slug,
    fields: ["title", "summary", "content"],
  });
  return ok(translated);
}
