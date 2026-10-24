import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v5.0 — Kelola kartu jamaah (CMS).
 * PUT  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: ubah data/status kartu.
 * DELETE admin [SUPER_ADMIN, ADMIN]: hapus kartu.
 */
const cardInclude = {
  member: { select: { id: true, name: true, city: true } },
};

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.pilgrimCard.findUnique({ where: { id } });
    if (!existing) return fail("Kartu tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) {
      const fullName = String(body.fullName).trim();
      if (fullName.length < 3) return fail("Nama lengkap minimal 3 karakter.");
      data.fullName = fullName;
    }
    if (body.phone !== undefined) data.phone = String(body.phone).trim();
    if (body.type !== undefined && ["JAMAAH", "PENDAMPING", "PETUGAS"].includes(String(body.type))) {
      data.type = String(body.type);
    }
    if (body.groupName !== undefined) data.groupName = String(body.groupName).trim();
    if (body.note !== undefined) data.note = String(body.note);
    if (body.status !== undefined && ["ACTIVE", "SUSPENDED", "EXPIRED"].includes(String(body.status))) {
      data.status = String(body.status);
    }
    if (body.validUntil !== undefined) {
      if (!body.validUntil) data.validUntil = null;
      else {
        const d = new Date(String(body.validUntil));
        if (Number.isNaN(d.getTime())) return fail("Tanggal berlaku tidak valid.");
        data.validUntil = d;
      }
    }
    if (body.memberId !== undefined) {
      if (!body.memberId) {
        data.memberId = null;
      } else {
        const member = await db.member.findUnique({ where: { id: String(body.memberId) } });
        if (!member) return fail("Anggota tidak ditemukan.", 404);
        data.memberId = member.id;
      }
    }

    const card = await db.pilgrimCard.update({ where: { id }, data, include: cardInclude });
    void logAudit(req, {
      action: "UPDATE",
      entity: "PilgrimCard",
      entityId: id,
      detail: `${card.cardNo} (${existing.status} → ${card.status})`,
    });
    return ok(card);
  } catch {
    return fail("Gagal memperbarui kartu.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const card = await db.pilgrimCard.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "PilgrimCard", entityId: id, detail: card.cardNo });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus kartu.", 500);
  }
}
