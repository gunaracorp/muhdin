import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { ensureConnection, PERMIT_CATALOG } from "@/lib/nusuk-engine";

/**
 * POST — webhook receiver Nusuk.
 * Header  : X-Nusuk-Signature: <webhookSecret>
 * Body    : { permitNo, event: PERMIT.ISSUED|PERMIT.RENEWED|PERMIT.EXPIRED|PERMIT.REVOKED, note? }
 */
export async function POST(req: NextRequest) {
  const conn = await ensureConnection();
  const signature = req.headers.get("x-nusuk-signature") ?? "";
  if (!signature || signature !== conn.webhookSecret) {
    return fail("Signature webhook tidak valid.", 401);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.permitNo !== "string" || typeof body.event !== "string") {
    return fail("Payload webhook tidak lengkap: permitNo & event wajib.", 422);
  }

  const permitNo = body.permitNo.trim().toUpperCase();
  const permit = await db.nusukPermit.findUnique({ where: { permitNo } });
  if (!permit) return fail(`Izin ${permitNo} tidak ditemukan.`, 404);

  const now = new Date();
  const EVENT_MAP: Record<string, { status: string; logStatus: string }> = {
    "PERMIT.ISSUED": { status: "ACTIVE", logStatus: "SUCCESS" },
    "PERMIT.RENEWED": { status: "ACTIVE", logStatus: "SUCCESS" },
    "PERMIT.EXPIRED": { status: "EXPIRED", logStatus: "SUCCESS" },
    "PERMIT.REVOKED": { status: "REJECTED", logStatus: "SUCCESS" },
  };
  const mapped = EVENT_MAP[body.event];
  if (!mapped) return fail(`Event tidak dikenal: ${body.event}`, 422);

  const expiresAt =
    body.event === "PERMIT.RENEWED"
      ? new Date(now.getTime() + (PERMIT_CATALOG[permit.type]?.validityDays ?? 90) * 86400000)
      : body.event === "PERMIT.EXPIRED"
        ? now
        : permit.expiresAt;

  const updated = await db.nusukPermit.update({
    where: { permitNo },
    data: { status: mapped.status, expiresAt, syncedAt: now },
  });

  await db.nusukSyncLog.create({
    data: {
      connectionId: conn.id,
      type: "WEBHOOK",
      status: mapped.logStatus,
      message: `${body.event} → ${permitNo} status menjadi ${mapped.status}.${body.note ? ` Catatan: ${body.note}` : ""}`,
      recordsAffected: 1,
      durationMs: Math.max(1, Date.now() % 97),
    },
  });

  return ok({
    received: true,
    permitNo,
    event: body.event,
    status: updated.status,
    expiresAt: updated.expiresAt,
  });
}
