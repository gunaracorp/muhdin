import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return fail("Email dan password wajib diisi.");

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      return fail("Email atau password salah.", 401);
    }
    // Multi-admin (Task 15-c): akun nonaktif ditolak.
    if (!user.isActive) {
      return fail("Akun Anda dinonaktifkan. Hubungi Super Admin.", 403);
    }
    await createSession(user.id);
    await db.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});
    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive } });
  } catch {
    return fail("Terjadi kesalahan pada server.", 500);
  }
}
