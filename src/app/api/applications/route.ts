import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { notifyMembershipApplication } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/ratelimit";

// Task 18 — alfabet kode tiket: A-Z tanpa I/O + angka 2-9 (hindari salah baca).
const TICKET_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Task 18 — kode tiket unik MHD-XXXXXX (loop cek unik di DB). */
async function generateTicketCode(): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt++) {
    let code = "MHD-";
    for (let i = 0; i < 6; i++) {
      code += TICKET_CHARS[Math.floor(Math.random() * TICKET_CHARS.length)];
    }
    const exists = await db.membershipApplication.findUnique({ where: { ticketCode: code } });
    if (!exists) return code;
  }
  // Cadangan (praktis tak terpakai): turunkan dari timestamp, tetap charset-sah.
  let n = Date.now();
  let fallback = "";
  for (let i = 0; i < 6; i++) {
    fallback = TICKET_CHARS[n % TICKET_CHARS.length] + fallback;
    n = Math.floor(n / TICKET_CHARS.length);
  }
  return `MHD-${fallback}`;
}

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const applications = await db.membershipApplication.findMany({ orderBy: { createdAt: "desc" } });
    return ok(applications);
  } catch {
    return fail("Gagal memuat pendaftaran.", 500);
  }
}

export async function POST(req: NextRequest) {
  // Task 18 — rem spam: maksimal 5 pendaftaran/menit per IP.
  if (!rateLimit(req, "applications")) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json();
    // Task 33 (ROLE 08) — No. izin hanya wajib untuk jenis berizin (PPIU/PIHK/KBIHU);
    // peran individu/penyedia/teknologi/partner boleh tanpa nomor izin.
    const LICENSED_TYPES = ["PPIU", "PIHK", "KBIHU"];
    const required = ["orgName", "type", "contactName", "email", "phone", "city"];
    for (const f of required) {
      if (!String(body[f] || "").trim()) return fail(`Kolom ${f} wajib diisi.`);
    }
    if (LICENSED_TYPES.includes(String(body.type)) && !String(body.licenseNo || "").trim()) {
      return fail("Kolom licenseNo wajib diisi untuk jenis PPIU/PIHK/KBIHU.");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(body.email))) return fail("Format email tidak valid.");
    const ticketCode = await generateTicketCode();
    const app = await db.membershipApplication.create({
      data: {
        orgName: String(body.orgName).trim(),
        type: String(body.type),
        contactName: String(body.contactName).trim(),
        email: String(body.email).trim(),
        phone: String(body.phone).trim(),
        city: String(body.city).trim(),
        province: String(body.province || "").trim(),
        licenseNo: String(body.licenseNo).trim(),
        message: body.message ? String(body.message) : null,
        ticketCode, // Task 18 — kode pelacakan publik
      },
    });
    // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
    void notifyMembershipApplication({
      orgName: app.orgName,
      type: app.type,
      contactName: app.contactName,
      email: app.email,
      phone: app.phone,
      city: app.city,
      licenseNo: app.licenseNo,
      ticketCode: app.ticketCode,
    });
    return ok(app, 201);
  } catch {
    return fail("Gagal mengirim pendaftaran.", 500);
  }
}
