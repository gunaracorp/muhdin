/**
 * Task 18 — Tindak lanjut pengaduan (CMS).
 * PUT   : Super Admin / Admin / VERIFIKATOR — ubah status (UNREAD/PROCESSED/
 *         CLOSED) & catatan respons. Saat status berubah ke PROCESSED/CLOSED,
 *         jejak responden disimpan + ditulis ke log audit.
 * DELETE: Super Admin / Admin saja.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

const ALLOWED_STATUS = ["UNREAD", "PROCESSED", "CLOSED"];

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  const me = await requireAdmin();
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const existing = await db.complaint.findUnique({ where: { id } });
    if (!existing) return fail("Pengaduan tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    let action = "UPDATE";
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!ALLOWED_STATUS.includes(status)) return fail("Status tidak valid.");
      data.status = status;
      if (status !== existing.status && (status === "PROCESSED" || status === "CLOSED")) {
        data.respondedBy = me?.name || null;
        data.respondedAt = new Date();
        action = status; // jejak audit mengikuti status baru
      }
    }
    if (body.responseNote !== undefined) {
      data.responseNote = body.responseNote ? String(body.responseNote) : null;
    }

    const complaint = await db.complaint.update({ where: { id }, data });
    void logAudit(req, {
      action,
      entity: "Complaint",
      entityId: id,
      detail: `Pengaduan dari ${existing.name}`,
    });
    return ok(complaint);
  } catch {
    return fail("Gagal memperbarui pengaduan.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.complaint.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "Complaint", entityId: id });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus pengaduan.", 500);
  }
}
