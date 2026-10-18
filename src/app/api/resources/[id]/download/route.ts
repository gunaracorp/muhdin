/**
 * Task 18 — Pencatat unduhan publik: increment counter `downloads`
 * lalu kembalikan URL berkas agar frontend dapat memicu unduhan.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const resource = await db.resource.findUnique({ where: { id }, select: { fileUrl: true } });
    if (!resource) return fail("Dokumen tidak ditemukan.", 404);
    await db.resource.update({ where: { id }, data: { downloads: { increment: 1 } } });
    return ok({ ok: true, fileUrl: resource.fileUrl });
  } catch {
    return fail("Gagal memproses unduhan.", 500);
  }
}
