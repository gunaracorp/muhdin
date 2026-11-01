import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { offerWaitlistSlot } from "@/lib/waitlist";
import { logAudit } from "@/lib/audit";

/**
 * v5.0 — Update status booking oleh panitia.
 * PUT  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]:
 *      NEW → CONTACTED → CONFIRMED; CANCELLED membebaskan slot otomatis
 *      (hanya bila sebelumnya belum CANCELLED).
 * DELETE admin [SUPER_ADMIN, ADMIN]: hapus booking (slot dibebaskan bila belum dibatalkan).
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.packageBooking.findUnique({ where: { id } });
    if (!existing) return fail("Booking tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!["NEW", "CONTACTED", "CONFIRMED", "CANCELLED"].includes(status)) {
        return fail("Status tidak valid.");
      }
      data.status = status;
    }
    if (body.note !== undefined) data.note = String(body.note);

    const booking = await db.$transaction(async (tx) => {
      const b = await tx.packageBooking.update({ where: { id }, data });
      // CANCELLED membebaskan slot — hanya sekali (dari status non-CANCELLED).
      if (
        data.status === "CANCELLED" &&
        existing.status !== "CANCELLED"
      ) {
        await tx.tourPackage.update({
          where: { id: existing.packageId },
          data: { slotsTaken: { decrement: existing.pilgrims } },
        });
      }
      return b;
    });

    // R-040 — slot dibebaskan: tawarkan ke antrean tunggu teratas (gagal-aman).
    if (data.status === "CANCELLED" && existing.status !== "CANCELLED") {
      void offerWaitlistSlot(existing.packageId, existing.pilgrims).catch(() => undefined);
    }

    void logAudit(req, {
      action: "UPDATE",
      entity: "PackageBooking",
      entityId: id,
      detail: `${booking.name}: ${existing.status} → ${booking.status}`,
    });
    return ok(booking);
  } catch {
    return fail("Gagal memperbarui booking.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const existing = await db.packageBooking.findUnique({ where: { id } });
    if (!existing) return fail("Booking tidak ditemukan.", 404);

    await db.$transaction(async (tx) => {
      await tx.packageBooking.delete({ where: { id } });
      if (existing.status !== "CANCELLED") {
        await tx.tourPackage.update({
          where: { id: existing.packageId },
          data: { slotsTaken: { decrement: existing.pilgrims } },
        });
      }
    });
    // R-040 — slot dibebaskan: tawarkan ke antrean tunggu (gagal-aman).
    if (existing.status !== "CANCELLED") {
      void offerWaitlistSlot(existing.packageId, existing.pilgrims).catch(() => undefined);
    }

    void logAudit(req, { action: "DELETE", entity: "PackageBooking", entityId: id, detail: existing.name });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus booking.", 500);
  }
}
