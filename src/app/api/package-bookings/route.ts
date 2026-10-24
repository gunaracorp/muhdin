import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v5.0 — Booking paket.
 * GET  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: seluruh booking (+ judul paket).
 * POST publik (rate limit 6/menit/IP): ajukan booking → slot berkurang otomatis.
 *      Validasi: paket PUBLISHED, sisa slot cukup, jumlah jamaah 1-50.
 */
export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const status = req.nextUrl.searchParams.get("status");
    const where = status && status !== "all" ? { status } : {};
    const rows = await db.packageBooking.findMany({
      where,
      include: { pkg: { select: { id: true, title: true, type: true, city: true, price: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat booking.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "package-booking", 6, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const packageId = String(body.packageId || "");
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const pilgrims = Math.max(1, Math.min(50, parseIntOr(String(body.pilgrims ?? "") || null, 1) as number));
    const note = String(body.note || "").trim();

    if (!packageId) return fail("Paket tidak valid.");
    if (name.length < 3) return fail("Nama lengkap minimal 3 karakter.");
    if (!/^[+\-\s()0-9]{8,20}$/.test(phone)) return fail("Nomor WhatsApp/telepon tidak valid.");

    const pkg = await db.tourPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);
    if (pkg.status !== "PUBLISHED") return fail("Paket ini sudah tidak menerima pendaftaran.");
    if (pkg.slotsTaken + pilgrims > pkg.slots) {
      return fail(`Sisa slot hanya ${pkg.slots - pkg.slotsTaken}. Kurangi jumlah jamaah atau hubungi panitia.`);
    }

    const booking = await db.$transaction(async (tx) => {
      const b = await tx.packageBooking.create({
        data: {
          packageId,
          name,
          phone,
          email: email || null,
          pilgrims,
          note: note || null,
        },
      });
      await tx.tourPackage.update({
        where: { id: packageId },
        data: { slotsTaken: { increment: pilgrims } },
      });
      return b;
    });

    void logAudit(req, { action: "CREATE", entity: "PackageBooking", entityId: booking.id, detail: `${name} → ${pkg.title}` });
    return ok(
      {
        ...booking,
        message: `Booking diterima. Tim ${pkg.title ? "penyelenggara" : "panitia"} akan menghubungi Anda via WhatsApp.`,
      },
      201
    );
  } catch {
    return fail("Gagal mengirim booking.", 500);
  }
}
