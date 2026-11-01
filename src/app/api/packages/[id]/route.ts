import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr, slugify } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v5.0 — Detail paket.
 * GET  publik: detail paket + ringkasan anggota.
 * PUT  admin [SUPER_ADMIN, ADMIN, EDITOR]: ubah paket.
 * DELETE admin [SUPER_ADMIN, ADMIN, EDITOR]: hapus paket (booking ikut terhapus, Cascade).
 */
const memberSelect = {
  select: { id: true, name: true, type: true, city: true, licenseNo: true, status: true, rating: true },
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const pkg = await db.tourPackage.findUnique({ where: { id }, include: { member: memberSelect } });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);
    return ok(pkg);
  } catch {
    return fail("Gagal memuat paket.", 500);
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.tourPackage.findUnique({ where: { id } });
    if (!existing) return fail("Paket tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.memberId !== undefined) {
      const member = await db.member.findUnique({ where: { id: String(body.memberId) } });
      if (!member) return fail("Anggota tidak ditemukan.", 404);
      data.memberId = String(body.memberId);
    }
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length < 5) return fail("Judul paket minimal 5 karakter.");
      data.title = title;
    }
    if (body.type !== undefined && ["UMROH", "HAJI", "ZIARAH", "WISATA_ISLAMI"].includes(String(body.type))) {
      data.type = String(body.type);
    }
    if (body.city !== undefined) data.city = String(body.city);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.price !== undefined) data.price = Math.max(0, parseIntOr(String(body.price) || null, existing.price) as number);
    if (body.durationDays !== undefined)
      data.durationDays = Math.max(1, parseIntOr(String(body.durationDays) || null, existing.durationDays) as number);
    if (body.departureDate !== undefined) {
      if (!body.departureDate) data.departureDate = null;
      else {
        const d = new Date(String(body.departureDate));
        if (Number.isNaN(d.getTime())) return fail("Tanggal keberangkatan tidak valid.");
        data.departureDate = d;
      }
    }
    if (body.slots !== undefined) data.slots = Math.max(1, parseIntOr(String(body.slots) || null, existing.slots) as number);
    if (body.slotsTaken !== undefined)
      data.slotsTaken = Math.max(0, parseIntOr(String(body.slotsTaken) || null, existing.slotsTaken) as number);
    if (body.hotelMakkah !== undefined) data.hotelMakkah = String(body.hotelMakkah);
    if (body.hotelMadinah !== undefined) data.hotelMadinah = String(body.hotelMadinah);
    if (body.airline !== undefined) data.airline = String(body.airline);
    if (body.status !== undefined && ["PUBLISHED", "DRAFT", "CLOSED"].includes(String(body.status))) {
      data.status = String(body.status);
    }
    if (body.featured !== undefined) data.featured = Boolean(body.featured);
    // R-057 SEO — slug unik (auto bila kosong), gambar & meta deskripsi.
    if (body.slug !== undefined || body.title !== undefined) {
      const base = slugify(String(body.slug || data.title || existing.title)).slice(0, 80) || existing.slug || `paket-${Date.now().toString(36)}`;
      if (base !== existing.slug) {
        let slug = base;
        let n = 2;
        while (await db.tourPackage.findFirst({ where: { slug, NOT: { id } } })) slug = `${base}-${n++}`;
        data.slug = slug;
      }
    }
    if (body.image !== undefined) data.image = body.image ? String(body.image) : null;
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription ? String(body.metaDescription).slice(0, 160) : null;

    const pkg = await db.tourPackage.update({ where: { id }, data, include: { member: memberSelect } });
    void logAudit(req, { action: "UPDATE", entity: "TourPackage", entityId: id, detail: pkg.title });
    return ok(pkg);
  } catch {
    return fail("Gagal memperbarui paket.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const pkg = await db.tourPackage.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "TourPackage", entityId: id, detail: pkg.title });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus paket.", 500);
  }
}
