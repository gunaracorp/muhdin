import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v5.0 — Verifikasi publik kartu jamaah (dipakai QR di kartu digital).
 * GET ?no=MHD-JM-2026-0001 → status kartu + info publik terbatas
 * (tanpa nomor telepon penuh — hanya inisial & status). Setiap scan dicatat.
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(req, "card-verify", 30, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const no = req.nextUrl.searchParams.get("no")?.trim().toUpperCase();
    if (!no) return fail("Nomor kartu wajib diisi.");

    const card = await db.pilgrimCard.findUnique({
      where: { cardNo: no },
      include: { member: { select: { name: true, city: true, licenseNo: true, status: true } } },
    });
    if (!card) return fail("Kartu tidak ditemukan. Periksa kembali nomor kartu.", 404);

    // Catat scan (fire-and-forget).
    void db.pilgrimCard
      .update({ where: { id: card.id }, data: { scans: { increment: 1 }, lastScanAt: new Date() } })
      .catch(() => {});

    // Masa berlaku lewat → tampilkan EXPIRED efektif tanpa mengubah DB.
    const effectiveStatus =
      card.status === "ACTIVE" && card.validUntil && card.validUntil.getTime() < Date.now()
        ? "EXPIRED"
        : card.status;

    return ok({
      cardNo: card.cardNo,
      fullName: card.fullName,
      type: card.type,
      groupName: card.groupName,
      status: effectiveStatus,
      validUntil: card.validUntil,
      scans: card.scans + 1,
      member: card.member ? { name: card.member.name, city: card.member.city, licenseNo: card.member.licenseNo } : null,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return fail("Gagal memverifikasi kartu.", 500);
  }
}
