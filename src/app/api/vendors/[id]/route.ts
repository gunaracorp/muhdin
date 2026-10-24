import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Detail vendor. PUT admin [SUPER_ADMIN, ADMIN, EDITOR]; DELETE [SUPER_ADMIN, ADMIN].
 */

const CATEGORIES = ["HOTEL_MAKKAH", "HOTEL_MADINAH", "TRANSPORT", "CATERING", "HANDLER", "AVIATION", "TPA", "FINANCE"];

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.vendor.findUnique({ where: { id } });
    if (!existing) return fail("Vendor tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 3) return fail("Nama vendor minimal 3 karakter.");
      data.name = name;
    }
    if (body.category !== undefined && CATEGORIES.includes(String(body.category))) data.category = String(body.category);
    if (body.city !== undefined) data.city = String(body.city);
    if (body.country !== undefined) data.country = String(body.country).toUpperCase().slice(0, 2);
    if (body.contact !== undefined) data.contact = String(body.contact);
    if (body.phone !== undefined) data.phone = String(body.phone);
    if (body.email !== undefined) data.email = body.email ? String(body.email) : null;
    if (body.website !== undefined) data.website = body.website ? String(body.website) : null;
    if (body.services !== undefined) data.services = String(body.services);
    if (body.rating !== undefined) {
      const r = Number(body.rating);
      data.rating = Number.isFinite(r) ? Math.min(5, Math.max(0, r)) : existing.rating;
    }
    if (body.verified !== undefined) data.verified = Boolean(body.verified);
    if (body.status !== undefined && ["ACTIVE", "SUSPENDED"].includes(String(body.status))) data.status = String(body.status);
    if (body.note !== undefined) data.note = body.note ? String(body.note) : null;

    const vendor = await db.vendor.update({ where: { id }, data });
    void logAudit(req, { action: "UPDATE", entity: "Vendor", entityId: id, detail: vendor.name });
    return ok(vendor);
  } catch {
    return fail("Gagal memperbarui vendor.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const vendor = await db.vendor.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "Vendor", entityId: id, detail: vendor.name });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus vendor.", 500);
  }
}
