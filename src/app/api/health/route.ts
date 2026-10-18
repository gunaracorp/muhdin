import { NextResponse } from "next/server";
import os from "node:os";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — Healthcheck untuk deployment shared hosting.
 * Dipakai saat verifikasi pasca-upload (lihat PANDUAN-SHARED-HOSTING.md):
 * memastikan server Next.js hidup, koneksi SQLite OK, dan environment sesuai.
 * Tidak mengekspos informasi sensitif (path/kredensial tidak disertakan).
 */
export async function GET() {
  const started = Date.now();

  let dbOk = false;
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    dbLatencyMs = Date.now() - started;
  } catch (e) {
    dbError = (e as Error).message.slice(0, 200);
  }

  const payload = {
    ok: dbOk,
    service: "muhdin.web.id",
    checks: {
      database: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError },
    },
    runtime: {
      node: process.version,
      nodeEnv: process.env.NODE_ENV || "unknown",
      platform: `${os.platform()}-${os.arch()}`,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: dbOk ? 200 : 503 });
}
