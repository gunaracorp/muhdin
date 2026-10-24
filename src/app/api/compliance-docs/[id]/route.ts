import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, computeLifecycle } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Detail dokumen kepatuhan.
 * PUT  admin [SUPER_ADMIN, ADMIN, EDITOR]: ubah dokumen / verifikasi (verified).
 * DELETE admin [SUPER_ADMIN, ADMIN].
 */

const KINDS = ["SIUJK", "COP", "PTA", "SKAI", "ASURANSI", "RENCANA_KERJA", "NPWP", "AKTA"];

const memberSelect = {
  select: { id: true, name: true, type: true, city: true, licenseNo: true, status: true },
};

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.complianceDoc.findUnique({ where: { id } });
    if (!existing) return fail("Dokumen tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.memberId !== undefined) {
      const member = await db.member.findUnique({ where: { id: String(body.memberId) } });
      if (!member) return fail("Anggota tidak ditemukan.", 404);
      data.memberId = String(body.memberId);
    }
    if (body.kind !== undefined && KINDS.includes(String(body.kind))) data.kind = String(body.kind);
    if (body.docNo !== undefined) data.docNo = String(body.docNo);
    if (body.issuedBy !== undefined) data.issuedBy = String(body.issuedBy);
    if (body.issuedAt !== undefined) {
      if (!body.issuedAt) data.issuedAt = null;
      else {
        const d = new Date(String(body.issuedAt));
        if (Number.isNaN(d.getTime())) return fail("Tanggal terbit tidak valid.");
        data.issuedAt = d;
      }
    }
    if (body.expiresAt !== undefined) {
      if (!body.expiresAt) data.expiresAt = null;
      else {
        const d = new Date(String(body.expiresAt));
        if (Number.isNaN(d.getTime())) return fail("Tanggal kedaluwarsa tidak valid.");
        data.expiresAt = d;
      }
    }
    if (body.fileUrl !== undefined) data.fileUrl = body.fileUrl ? String(body.fileUrl) : null;
    if (body.verified !== undefined) data.verified = Boolean(body.verified);
    if (body.note !== undefined) data.note = body.note ? String(body.note) : null;

    const doc = await db.complianceDoc.update({ where: { id }, data, include: { member: memberSelect } });
    void logAudit(req, {
      action: "UPDATE",
      entity: "ComplianceDoc",
      entityId: id,
      detail: `${doc.member?.name ?? existing.memberId} — ${doc.kind}${body.verified !== undefined ? (doc.verified ? " (terverifikasi)" : " (verifikasi dicabut)") : ""}`,
    });
    const { lifecycle, daysLeft } = computeLifecycle(doc.expiresAt);
    return ok({ ...doc, lifecycle, daysLeft });
  } catch {
    return fail("Gagal memperbarui dokumen kepatuhan.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const doc = await db.complianceDoc.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "ComplianceDoc", entityId: id, detail: doc.kind });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus dokumen kepatuhan.", 500);
  }
}
