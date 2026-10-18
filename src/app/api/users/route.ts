/**
 * Task 15-c — Multi-admin: daftar & tambah akun admin.
 * Seluruh endpoint hanya untuk SUPER_ADMIN.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { guardSuperAdmin, ok, fail } from "@/lib/api-helpers";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit"; // Task 18

export async function GET() {
  const denied = await guardSuperAdmin();
  if (denied) return denied;
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return ok(users);
  } catch {
    return fail("Gagal memuat daftar admin.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardSuperAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "EDITOR");

    if (!name) return fail("Nama wajib diisi.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Format email tidak valid.");
    if (password.length < 8) return fail("Password minimal 8 karakter.");
    if (!(ROLES as string[]).includes(role)) return fail("Peran tidak valid.");

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return fail("Email sudah terdaftar.", 409);

    const user = await db.user.create({
      data: { name, email, password: hashPassword(password), role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    // Task 18 — jejak audit pembuatan akun admin (tanpa data sensitif).
    void logAudit(req, { action: "CREATE", entity: "User", entityId: user.id, detail: `${user.name} (${user.role})` });
    return ok(user, 201);
  } catch {
    return fail("Gagal menambahkan admin.", 500);
  }
}
