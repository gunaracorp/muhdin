/**
 * Task 60 — Log audit notifikasi EMAIL & WHATSAPP (ADMIN+).
 * GET    : 100 upaya notifikasi terbaru (channel, event, status, penerima…).
 * DELETE : bersihkan log (SUPER_ADMIN saja).
 */
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";

export async function GET(req: import("next/server").NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const channel = req.nextUrl.searchParams.get("channel");
    const status = req.nextUrl.searchParams.get("status");
    const logs = await db.notificationLog.findMany({
      where: {
        ...(channel && channel !== "ALL" ? { channel } : {}),
        ...(status && status !== "ALL" ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const [sent, failed] = await Promise.all([
      db.notificationLog.count({ where: { status: "SENT" } }),
      db.notificationLog.count({ where: { status: "FAILED" } }),
    ]);
    return ok({ logs, stats: { sent, failed } });
  } catch {
    return fail("Gagal memuat log notifikasi.", 500);
  }
}

export async function DELETE() {
  const denied = await guardRole(["SUPER_ADMIN"]);
  if (denied) return denied;
  try {
    await db.notificationLog.deleteMany({});
    return ok({ ok: true });
  } catch {
    return fail("Gagal membersihkan log notifikasi.", 500);
  }
}
