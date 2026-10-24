/**
 * Task 15-c — Multi-admin: ubah (nama/peran/status/password) & hapus akun.
 * Hanya SUPER_ADMIN, dengan pagar perlindungan:
 *  - Super Admin tidak bisa menurunkan/menonaktifkan/menghapus dirinya.
 *  - Super Admin aktif terakhir tidak bisa dinonaktifkan/diturunkan/dihapus.
 *  - Menonaktifkan/menghapus akun otomatis mencabut seluruh sesinya.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, requireSuperAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api-helpers";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit"; // Task 18

const SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

/** Jumlah Super Admin aktif selain `excludeId`. */
async function otherActiveSuperCount(excludeId: string) {
  return db.user.count({
    where: { role: "SUPER_ADMIN", isActive: true, id: { not: excludeId } },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuperAdmin();
  if (!me) return fail("Hanya Super Admin yang dapat mengelola akun admin.", 403);
  try {
    const { id } = await params;
    const body = await req.json();

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return fail("Akun tidak ditemukan.", 404);

    const data: {
      name?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return fail("Nama tidak boleh kosong.");
      data.name = name;
    }

    if (body.password !== undefined && body.password !== "") {
      const password = String(body.password);
      if (password.length < 8) return fail("Password minimal 8 karakter.");
      data.password = hashPassword(password);
    }

    if (body.role !== undefined && String(body.role) !== target.role) {
      const role = String(body.role);
      if (!(ROLES as string[]).includes(role)) return fail("Peran tidak valid.");
      if (id === me.id) return fail("Anda tidak dapat mengubah peran akun sendiri.", 400);
      if (target.role === "SUPER_ADMIN" && target.isActive && role !== "SUPER_ADMIN") {
        const others = await otherActiveSuperCount(id);
        if (others === 0) return fail("Minimal harus ada satu Super Admin aktif.", 400);
      }
      data.role = role;
    }

    if (body.isActive !== undefined && Boolean(body.isActive) !== target.isActive) {
      if (id === me.id) return fail("Anda tidak dapat menonaktifkan akun sendiri.", 400);
      if (target.isActive && target.role === "SUPER_ADMIN") {
        const others = await otherActiveSuperCount(id);
        if (others === 0) return fail("Minimal harus ada satu Super Admin aktif.", 400);
      }
      data.isActive = Boolean(body.isActive);
    }

    if (Object.keys(data).length === 0) {
      const unchanged = await db.user.findUnique({ where: { id }, select: SELECT });
      return ok(unchanged);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: SELECT,
    });

    // Cabut sesi target ketika dinonaktifkan atau password direset.
    if (data.isActive === false || data.password) {
      await db.session.deleteMany({ where: { userId: id } }).catch(() => {});
    }

    // Task 18 — jejak audit perubahan akun admin (tanpa data sensitif).
    void logAudit(req, { action: "UPDATE", entity: "User", entityId: id, detail: `${updated.name} (${updated.role})` });

    return ok(updated);
  } catch {
    return fail("Gagal memperbarui akun admin.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuperAdmin();
  if (!me) return fail("Hanya Super Admin yang dapat mengelola akun admin.", 403);
  try {
    const { id } = await params;
    if (id === me.id) return fail("Anda tidak dapat menghapus akun sendiri.", 400);

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return fail("Akun tidak ditemukan.", 404);

    if (target.role === "SUPER_ADMIN" && target.isActive) {
      const others = await otherActiveSuperCount(id);
      if (others === 0) return fail("Minimal harus ada satu Super Admin aktif.", 400);
    }

    // Sessions terhapus otomatis (onDelete: Cascade).
    await db.user.delete({ where: { id } });
    // Task 18 — jejak audit penghapusan akun admin (tanpa data sensitif).
    void logAudit(req, { action: "DELETE", entity: "User", entityId: id, detail: `${target.name} (${target.role})` });
    return ok({ deleted: true, id });
  } catch {
    return fail("Gagal menghapus akun admin.", 500);
  }
}
