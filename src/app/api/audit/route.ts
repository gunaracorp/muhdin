/**
 * Task 18 — Log audit aktivitas admin. Hanya SUPER_ADMIN.
 * ?take= jumlah baris (default 100, maksimum 500).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardSuperAdmin, ok, fail } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const denied = await guardSuperAdmin();
  if (denied) return denied;
  try {
    const takeRaw = parseInt(req.nextUrl.searchParams.get("take") || "100", 10);
    const take = Math.min(Math.max(Number.isNaN(takeRaw) ? 100 : takeRaw, 1), 500);
    const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
    return ok(logs);
  } catch {
    return fail("Gagal memuat log audit.", 500);
  }
}
