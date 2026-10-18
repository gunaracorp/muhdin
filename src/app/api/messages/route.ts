import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { notifyContactMessage } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const messages = await db.contactMessage.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
    return ok(messages);
  } catch {
    return fail("Gagal memuat pesan.", 500);
  }
}

export async function POST(req: NextRequest) {
  // Task 18 — rem spam: maksimal 5 pesan/menit per IP.
  if (!rateLimit(req, "messages")) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const subject = String(body.subject || "").trim();
    if (!name || !email || !message || !subject) return fail("Nama, email, subjek, dan pesan wajib diisi.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Format email tidak valid.");
    const msg = await db.contactMessage.create({
      data: { name, email, subject, message, phone: body.phone ? String(body.phone) : null },
    });
    // Task 15-d — notifikasi WhatsApp (fire-and-forget, gagal-aman).
    void notifyContactMessage({ name, email, phone: msg.phone, subject, message });
    return ok(msg, 201);
  } catch {
    return fail("Gagal mengirim pesan.", 500);
  }
}
