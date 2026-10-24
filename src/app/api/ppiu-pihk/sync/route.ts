import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { runSync, ensureConnection } from "@/lib/nusuk-engine";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Task 51 — POST sinkronisasi Dashboard PPIU & PPIHK.
 *
 * Menjalankan engine sinkronisasi Nusuk dengan cakupan khusus dua jenis
 * penyelenggara ibadah:
 * - body kosong            → sinkron seluruh PPIU + PIHK terverifikasi
 * - body { memberId }      → sinkron satu perusahaan (tombol per kartu)
 *
 * Keamanan: endpoint konsol operasional berbasis bridge SANDBOX simulasi —
 * dilindungi rate-limit per IP (6x/menit), wajib koneksi Nusuk berstatus
 * CONNECTED, dan setiap eksekusi meninggalkan jejak di NusukSyncLog +
 * AuditLog (action SYNC). Data yang ditulis hanya izin simulasi.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "ppiu-pihk-sync", 6, 60_000)) {
    return fail("Terlalu banyak permintaan sinkronisasi. Silakan coba lagi satu menit lagi.", 429);
  }

  const body = await req.json().catch(() => ({}));
  const conn = await ensureConnection();
  if (conn.status !== "CONNECTED") {
    return fail("Koneksi Nusuk belum aktif. Hubungkan terlebih dahulu di modul Integrasi Nusuk (#/nusuk).", 400);
  }

  const memberId = typeof body?.memberId === "string" ? body.memberId : undefined;
  if (memberId) {
    const exists = await db.member.findFirst({
      where: { id: memberId, type: { in: ["PPIU", "PIHK"] }, status: "TERVERIFIKASI" },
      select: { id: true },
    });
    if (!exists) return fail("Perusahaan tidak ditemukan atau belum terverifikasi.", 404);
  }

  try {
    const result = await runSync(memberId ? { memberIds: [memberId] } : { types: ["PPIU", "PIHK"] });

    // Jejak audit (fire-and-forget, tidak boleh menggagalkan sync sukses).
    void db.auditLog
      .create({
        data: {
          userName: "Dashboard PPIU-PPIHK",
          role: "OPERATOR",
          action: "SYNC",
          entity: "NusukPermit",
          entityId: memberId ?? "PPIU_PIHK",
          detail: result.message,
        },
      })
      .catch(() => {});

    return ok(result);
  } catch (err) {
    const message = (err as Error).message || "Sinkronisasi gagal.";
    await db.nusukSyncLog.create({
      data: {
        connectionId: conn.id,
        type: memberId ? "MEMBER_SYNC" : "FULL_SYNC",
        status: "FAILED",
        message,
        durationMs: 0,
      },
    });
    return fail(message, 400);
  }
}
