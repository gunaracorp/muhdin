import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Detail titik darurat. PUT admin [SUPER_ADMIN, ADMIN, EDITOR]; DELETE [SUPER_ADMIN, ADMIN].
 */

const CATEGORIES = ["HOSPITAL", "CLINIC", "EMBASSY", "CONSULATE", "CONSUL_HAJJ", "KKI", "POLICE", "EMERGENCY"];

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.sosPoint.findUnique({ where: { id } });
    if (!existing) return fail("Titik darurat tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 3) return fail("Nama titik darurat minimal 3 karakter.");
      data.name = name;
    }
    if (body.category !== undefined && CATEGORIES.includes(String(body.category))) data.category = String(body.category);
    if (body.city !== undefined) data.city = String(body.city);
    if (body.country !== undefined) data.country = String(body.country).toUpperCase().slice(0, 2);
    if (body.address !== undefined) data.address = String(body.address);
    if (body.phone !== undefined) {
      const phone = String(body.phone).trim();
      if (!phone) return fail("Nomor telepon wajib diisi.");
      data.phone = phone;
    }
    if (body.phone2 !== undefined) data.phone2 = body.phone2 ? String(body.phone2) : null;
    if (body.hours !== undefined) data.hours = String(body.hours);
    if (body.note !== undefined) data.note = body.note ? String(body.note) : null;
    if (body.featured !== undefined) data.featured = Boolean(body.featured);

    const point = await db.sosPoint.update({ where: { id }, data });
    void logAudit(req, { action: "UPDATE", entity: "SosPoint", entityId: id, detail: point.name });
    return ok(point);
  } catch {
    return fail("Gagal memperbarui titik darurat.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const point = await db.sosPoint.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "SosPoint", entityId: id, detail: point.name });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus titik darurat.", 500);
  }
}
