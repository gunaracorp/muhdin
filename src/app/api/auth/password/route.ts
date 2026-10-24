import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { requireAdmin, verifyPassword, hashPassword } from "@/lib/auth";

const schema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter."),
});

/**
 * PUT /api/auth/password — Ganti password akun admin yang sedang login.
 * - Wajib sesi admin aktif.
 * - Wajib memasukkan password saat ini (verifikasi ulang).
 * - Semua sesi di perangkat LAIN otomatis dikeluarkan (sesi saat ini dipertahankan).
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) return fail("Tidak diizinkan — silakan login sebagai admin.", 401);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Data tidak valid.");
    }
    const { currentPassword, newPassword } = parsed.data;

    const fresh = await db.user.findUnique({ where: { id: user.id } });
    if (!fresh) return fail("Akun tidak ditemukan.", 404);

    if (!verifyPassword(currentPassword, fresh.password)) {
      return fail("Password saat ini salah.", 400);
    }
    if (verifyPassword(newPassword, fresh.password)) {
      return fail("Password baru sama dengan password lama.");
    }

    const cookieStore = await cookies();
    const currentToken = cookieStore.get("muhdin_session")?.value ?? "";

    await db.$transaction([
      db.user.update({
        where: { id: fresh.id },
        data: { password: hashPassword(newPassword) },
      }),
      db.session.deleteMany({
        where: { userId: fresh.id, token: { not: currentToken } },
      }),
    ]);

    return ok({
      ok: true,
      message: "Password berhasil diperbarui. Semua perangkat lain telah dikeluarkan.",
    });
  } catch {
    return fail("Terjadi kesalahan pada server.", 500);
  }
}
