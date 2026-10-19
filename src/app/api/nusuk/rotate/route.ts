import { db } from "@/lib/db";
import { ok, guardRole } from "@/lib/api-helpers";
import { ensureConnection, generateApiKey, generateWebhookSecret } from "@/lib/nusuk-engine";

/** POST — rotasi API key & webhook secret Nusuk */
export async function POST() {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const conn = await ensureConnection();
  const updated = await db.nusukConnection.update({
    where: { id: conn.id },
    data: { apiKey: generateApiKey(), webhookSecret: generateWebhookSecret() },
  });
  await db.nusukSyncLog.create({
    data: {
      connectionId: updated.id,
      type: "CONNECTION",
      status: "SUCCESS",
      message: "Rotasi kredensial API — kunci lama dicabut otomatis.",
    },
  });
  return ok({ message: "Kredensial Nusuk berhasil dirotasi." });
}
