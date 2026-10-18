/**
 * Task 18 — Pelanggan newsletter (footer publik).
 * GET  : Super Admin / Admin.
 * POST : publik + rate limit; email duplikat tetap 201 {already:true}
 *        agar keberadaan email seseorang tidak bisa diuji coba (privasi).
 * PUT/DELETE [id]: Super Admin / Admin.
 */
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

export async function GET() {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const subscribers = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
    return ok(subscribers);
  } catch {
    return fail("Gagal memuat pelanggan.", 500);
  }
}

export async function POST(req: NextRequest) {
  // Task 18 — rem spam: maksimal 5 langganan/menit per IP.
  if (!rateLimit(req, "subscribers")) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Format email tidak valid.");
    try {
      await db.subscriber.create({ data: { email } });
      return ok({ ok: true, already: false }, 201);
    } catch (err) {
      // Task 18 — P2002 (email unik): jangan bocorkan bahwa email sudah terdaftar.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return ok({ ok: true, already: true }, 201);
      }
      throw err;
    }
  } catch {
    return fail("Gagal mendaftarkan langganan.", 500);
  }
}
