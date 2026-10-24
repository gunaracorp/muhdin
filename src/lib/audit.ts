/**
 * Task 18 — Jejak audit aktivitas admin (fire-and-forget).
 *
 * Selalu dipanggil dengan `void logAudit(...)` SETELAH operasi utama berhasil.
 * Kegagalan penulisan log TIDAK BOLEH membuat request utama gagal.
 * Identitas pengguna diambil dari sesi (requireAdmin) — bila tidak ada
 * sesi (mis. aksi sistem), dicatat sebagai "sistem".
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function logAudit(
  req: NextRequest,
  data: { action: string; entity: string; entityId?: string; detail?: string }
) {
  try {
    // req disediakan untuk kompatibilitas kontrak (mis. kebutuhan IP di masa depan);
    // saat ini identitas cukup dari sesi cookie.
    void req;
    const user = await requireAdmin().catch(() => null);
    await db.auditLog
      .create({
        data: {
          userId: user?.id ?? null,
          userName: user?.name ?? "sistem",
          role: user?.role ?? "",
          action: data.action,
          entity: data.entity,
          entityId: data.entityId ?? null,
          detail: data.detail ?? null,
        },
      })
      .catch(() => {});
  } catch {
    // Log audit tidak boleh mengganggu alur utama.
  }
}
