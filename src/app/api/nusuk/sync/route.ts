import { db } from "@/lib/db";
import { ok, fail, guardRole } from "@/lib/api-helpers";
import { runSync } from "@/lib/nusuk-engine";

/** POST — jalankan sinkronisasi penuh dengan Nusuk */
export async function POST() {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const result = await runSync();
    return ok(result);
  } catch (err) {
    const message = (err as Error).message || "Sinkronisasi gagal.";
    const conn = await db.nusukConnection.findFirst();
    if (conn) {
      await db.nusukSyncLog.create({
        data: {
          connectionId: conn.id,
          type: "FULL_SYNC",
          status: "FAILED",
          message,
          durationMs: 0,
        },
      });
    }
    return fail(message, 400);
  }
}
