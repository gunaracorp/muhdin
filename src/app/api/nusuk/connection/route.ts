import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, guardAdmin, guardRole } from "@/lib/api-helpers";
import { ensureConnection } from "@/lib/nusuk-engine";

function mask(key: string) {
  if (!key) return "—";
  return `${key.slice(0, 12)}${"•".repeat(16)}${key.slice(-4)}`;
}

/** GET — status koneksi (admin). ?reveal=1 untuk menampilkan kunci penuh. */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const conn = await ensureConnection();
  const reveal = req.nextUrl.searchParams.get("reveal") === "1";
  return ok({
    connection: {
      id: conn.id,
      environment: conn.environment,
      status: conn.status,
      autoSync: conn.autoSync,
      totalSyncs: conn.totalSyncs,
      lastSyncAt: conn.lastSyncAt,
      apiKeyMasked: mask(conn.apiKey),
      apiKey: reveal ? conn.apiKey : undefined,
      webhookSecret: reveal ? conn.webhookSecret : undefined,
    },
  });
}

/** POST — hubungkan ke Nusuk { environment } */
export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const environment = body.environment === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
  const conn = await ensureConnection();
  const updated = await db.nusukConnection.update({
    where: { id: conn.id },
    data: { environment, status: "CONNECTED" },
  });
  await db.nusukSyncLog.create({
    data: {
      connectionId: updated.id,
      type: "CONNECTION",
      status: "SUCCESS",
      message: `Terhubung ke Nusuk ${environment} — handshake berhasil.`,
    },
  });
  return ok({ connection: { ...updated, apiKey: undefined, webhookSecret: undefined } });
}

/** PUT — perbarui autoSync { autoSync } */
export async function PUT(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const conn = await ensureConnection();
  const updated = await db.nusukConnection.update({
    where: { id: conn.id },
    data: { autoSync: Boolean(body.autoSync) },
  });
  return ok({ connection: { ...updated, apiKey: undefined, webhookSecret: undefined } });
}

/** DELETE — putuskan koneksi */
export async function DELETE() {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const conn = await ensureConnection();
  const updated = await db.nusukConnection.update({
    where: { id: conn.id },
    data: { status: "DISCONNECTED" },
  });
  await db.nusukSyncLog.create({
    data: {
      connectionId: updated.id,
      type: "CONNECTION",
      status: "FAILED",
      message: "Koneksi Nusuk diputus manual oleh administrator.",
    },
  });
  return ok({ connection: { ...updated, apiKey: undefined, webhookSecret: undefined } });
}
