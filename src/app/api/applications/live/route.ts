/**
 * Task 53 — Snapshot PUBLIK papan slot pendaftaran realtime.
 * GET /api/applications/live
 *
 * Sumber kebenaran awal untuk useRegistrationLive (board + counter + feed).
 * Setelah snapshot ini, pembaruan datang via socket.io ("registration:new");
 * polling ulang hanya fallback.
 *
 * Privasi (PDP): TANPA nama organisasi/kontak/email/telepon — hanya jenis
 * pendaftar, kota, waktu, dan nomor urutnya.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export type LiveSlot = {
  n: number;
  type: string;
  city: string;
  at: string;
  status: string;
};

export async function GET() {
  try {
    const rows = await db.membershipApplication.findMany({
      where: { queueNumber: { not: null } },
      orderBy: { queueNumber: "asc" },
      select: {
        queueNumber: true,
        type: true,
        city: true,
        status: true,
        createdAt: true,
      },
    });

    const valid = rows.filter((r) => r.status !== "REJECTED");
    const filled: LiveSlot[] = valid.slice(-120).map((r) => ({
      n: r.queueNumber ?? 0,
      type: r.type,
      city: r.city,
      at: r.createdAt.toISOString(),
      status: r.status,
    }));

    const sequence = rows.length ? (rows[rows.length - 1].queueNumber ?? 0) : 0;
    const waiting = valid.filter((r) => r.status === "PENDING").length;

    return NextResponse.json(
      {
        sequence,
        total: valid.length,
        waiting,
        filled,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { sequence: 0, total: 0, waiting: 0, filled: [], updatedAt: new Date().toISOString() },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
