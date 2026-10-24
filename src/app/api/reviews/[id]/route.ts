import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Moderasi ulasan jamaah (CMS).
 * PUT  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: APPROVED / REJECTED / PENDING.
 * DELETE admin [SUPER_ADMIN, ADMIN].
 */

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.pilgrimReview.findUnique({ where: { id } });
    if (!existing) return fail("Ulasan tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.status !== undefined && ["PENDING", "APPROVED", "REJECTED"].includes(String(body.status))) {
      data.status = String(body.status);
      data.reviewedAt = new Date();
      const user = await requireUserOrNull();
      data.reviewedBy = user?.email ?? "cms";
    }

    const review = await db.pilgrimReview.update({
      where: { id },
      data,
      include: { pkg: { select: { id: true, title: true, type: true } } },
    });
    void logAudit(req, { action: "UPDATE", entity: "PilgrimReview", entityId: id, detail: `${existing.cardNo} → ${review.status}` });
    return ok(review);
  } catch {
    return fail("Gagal memperbarui ulasan.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const review = await db.pilgrimReview.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "PilgrimReview", entityId: id, detail: review.authorName });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus ulasan.", 500);
  }
}

/** Ambil user sesi tanpa menggagalkan request (untuk reviewedBy). */
async function requireUserOrNull(): Promise<{ email: string } | null> {
  try {
    const { requireAdmin } = await import("@/lib/auth");
    const user = await requireAdmin();
    return user ? { email: user.email } : null;
  } catch {
    return null;
  }
}
