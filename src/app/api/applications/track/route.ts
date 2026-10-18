/**
 * Task 18 — Pelacakan pendaftaran publik via kode tiket.
 * GET /api/applications/track?code=MHD-XXXXXX
 * Respons hanya memuat data non-sensitif (tanpa email/telepon/kontak).
 *
 * Catatan Next.js: path statis "track" selalu menang atas [id] dinamis,
 * sehingga route ini aman berdampingan dengan PUT/DELETE /api/applications/[id].
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
    if (code.length < 5) {
      return fail("Masukkan kode tiket (contoh: MHD-TKKN8Z). Kode minimal 5 karakter.");
    }
    // Kode tiket selalu tersimpan huruf besar, input di-uppercase → pencarian case-insensitive.
    const app = await db.membershipApplication.findUnique({ where: { ticketCode: code } });
    if (!app) return fail("Kode tiket tidak ditemukan. Periksa kembali.", 404);
    return ok({
      found: true,
      ticketCode: app.ticketCode,
      orgName: app.orgName,
      type: app.type,
      status: app.status,
      submittedAt: app.createdAt,
      reviewedAt: app.reviewedAt,
      reviewNote: app.reviewNote,
    });
  } catch {
    return fail("Gagal melacak pendaftaran.", 500);
  }
}
