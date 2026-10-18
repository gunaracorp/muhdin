import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail, slugify } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return fail("Artikel tidak ditemukan.", 404);
  return ok(article);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.excerpt !== undefined) data.excerpt = String(body.excerpt);
    if (body.content !== undefined) data.content = String(body.content);
    if (body.category !== undefined) data.category = String(body.category);
    if (body.cover !== undefined) data.cover = body.cover ? String(body.cover) : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.featured !== undefined) data.featured = Boolean(body.featured);
    if (body.author !== undefined) data.author = String(body.author);
    if (body.slug !== undefined) data.slug = slugify(body.slug) || undefined;

    const article = await db.article.update({ where: { id }, data });
    return ok(article);
  } catch {
    return fail("Gagal memperbarui artikel.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.article.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus artikel.", 500);
  }
}
