import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PROMO_SLOTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/promo/counter — penghitung live pendaftar GRATIS (publik). Task 52: promo "200 anggota pertama" dihapus,
 *
 * Slot terpakai = pendaftar valid (status != REJECTED) + baseTaken (seed opsional).
 * Dipakai SlotCounter (hero / free section / membership / form daftar) yang
 * poll tiap 15 dtk + refresh instan via event "muhdin:promo-refresh" setelah
 * formulir sukses dikirim — sehingga angka turun otomatis tiap ada pendaftar.
 */
export async function GET() {
  try {
    const valid = await db.membershipApplication.count({
      where: { status: { not: "REJECTED" } },
    });
    const taken = Math.min(PROMO_SLOTS.total, PROMO_SLOTS.baseTaken + valid);
    const remaining = Math.max(0, PROMO_SLOTS.total - taken);
    return NextResponse.json(
      { total: PROMO_SLOTS.total, taken, remaining, closed: remaining <= 0 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    // Fallback deterministik bila DB tak terjangkau — UI tetap hidup, tidak meledak.
    const remaining = Math.max(0, PROMO_SLOTS.total - PROMO_SLOTS.baseTaken);
    return NextResponse.json(
      { total: PROMO_SLOTS.total, taken: PROMO_SLOTS.baseTaken, remaining, closed: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
