import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function guardAdmin() {
  const user = await requireAdmin();
  if (!user) return fail("Tidak diizinkan — silakan login sebagai admin.", 401);
  return null;
}

/** Multi-admin (Task 15-c): hanya peran tertentu yang boleh lolos. */
export async function guardRole(allowed: string[]) {
  const user = await requireAdmin();
  if (!user) return fail("Tidak diizinkan — silakan login sebagai admin.", 401);
  if (!allowed.includes(user.role)) {
    return fail("Peran Anda tidak memiliki akses ke aksi ini.", 403);
  }
  return null;
}

/** Multi-admin: hanya SUPER_ADMIN. */
export async function guardSuperAdmin() {
  const user = await requireSuperAdmin();
  if (!user) {
    const anyUser = await requireAdmin();
    if (anyUser) return fail("Hanya Super Admin yang dapat mengelola akun admin.", 403);
    return fail("Tidak diizinkan — silakan login sebagai admin.", 401);
  }
  return null;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseIntOr<T>(value: string | null, fallback: T): number | T {
  if (value === null) return fallback;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

/**
 * v6.0 — siklus hidup dokumen berdasarkan tanggal kedaluwarsa.
 * EXPIRED (lewat) | EXPIRING (≤90 hari) | VALID (jauh / tanpa expiry).
 */
export function computeLifecycle(expiresAt: Date | string | null | undefined): {
  lifecycle: string;
  daysLeft: number | null;
} {
  if (!expiresAt) return { lifecycle: "VALID", daysLeft: null };
  const exp = new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) return { lifecycle: "VALID", daysLeft: null };
  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) return { lifecycle: "EXPIRED", daysLeft };
  if (daysLeft <= 90) return { lifecycle: "EXPIRING", daysLeft };
  return { lifecycle: "VALID", daysLeft };
}
