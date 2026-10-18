/**
 * Task 18 — Pengaduan jamaah (#/lapor).
 * GET  : admin semua peran (guardAdmin).
 * POST : publik, rate limit 5/menit/IP + notifikasi WhatsApp gagal-aman.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { notifyComplaint } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const complaints = await db.complaint.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
    return ok(complaints);
  } catch {
    return fail("Gagal memuat pengaduan.", 500);
  }
}

export async function POST(req: NextRequest) {
  // Task 18 — rem spam: maksimal 5 pengaduan/menit per IP.
  if (!rateLimit(req, "complaints")) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const content = String(body.content || "").trim();
    if (!name || !email || !content) return fail("Nama, email, dan isi laporan wajib diisi.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Format email tidak valid.");
    const complaint = await db.complaint.create({
      data: {
        name,
        email,
        phone: body.phone ? String(body.phone) : null,
        targetMember: body.targetMember ? String(body.targetMember) : null,
        category: String(body.category || "Pelayanan"),
        content,
      },
    });
    // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
    void notifyComplaint({ name, targetMember: complaint.targetMember, category: complaint.category });
    return ok(complaint, 201);
  } catch {
    return fail("Gagal mengirim pengaduan.", 500);
  }
}
