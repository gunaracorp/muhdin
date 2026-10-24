import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import { ensureConnection, ELIGIBILITY, PERMIT_CATALOG } from "@/lib/nusuk-engine";

/**
 * Task 51 — Dashboard PPIU & PPIHK (#/dashboard/ppiu-pihk)
 * GET publik: ringkasan ekosistem dua jenis penyelenggara ibadah
 * (PPIU = Perusahaan Perjalanan Ibadah Umrah, PIHK/PPIHK = Perusahaan
 * Perjalanan Ibadah Haji Khusus) beserta status izin Nusuk perusahaan
 * dan riwayat sinkronisasi terbaru.
 * Tidak ada kredensial — data setara direktori anggota publik.
 */

const PP_TYPES = ["PPIU", "PIHK"];

export async function GET() {
  const conn = await ensureConnection();

  const [members, permits, logs] = await Promise.all([
    db.member.findMany({
      where: { type: { in: PP_TYPES } },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        province: true,
        licenseNo: true,
        rating: true,
        status: true,
        memberSince: true,
        description: true,
      },
    }),
    db.nusukPermit.findMany({
      where: { member: { type: { in: PP_TYPES } } },
      select: { memberId: true, status: true, type: true, syncedAt: true },
    }),
    db.nusukSyncLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  // Agregasi izin per perusahaan (dataset kecil — agregasi in-memory).
  const permitMap = new Map<string, { total: number; active: number; pending: number; expired: number; rejected: number; lastSyncedAt: string | null }>();
  for (const p of permits) {
    const cur = permitMap.get(p.memberId) ?? { total: 0, active: 0, pending: 0, expired: 0, rejected: 0, lastSyncedAt: null as string | null };
    cur.total += 1;
    if (p.status === "ACTIVE") cur.active += 1;
    else if (p.status === "PENDING") cur.pending += 1;
    else if (p.status === "EXPIRED") cur.expired += 1;
    else if (p.status === "REJECTED") cur.rejected += 1;
    const at = p.syncedAt instanceof Date ? p.syncedAt.toISOString() : String(p.syncedAt);
    if (!cur.lastSyncedAt || at > cur.lastSyncedAt) cur.lastSyncedAt = at;
    permitMap.set(p.memberId, cur);
  }

  const companies = members.map((m) => ({
    ...m,
    permits: permitMap.get(m.id) ?? { total: 0, active: 0, pending: 0, expired: 0, rejected: 0, lastSyncedAt: null },
    eligibility: (ELIGIBILITY[m.type] ?? [])
      .map((code) => PERMIT_CATALOG[code])
      .filter(Boolean)
      .map((spec) => ({ code: spec.code, label: spec.label, icon: spec.icon })),
  }));

  const ppiu = companies.filter((c) => c.type === "PPIU");
  const pihk = companies.filter((c) => c.type === "PIHK");
  const verified = companies.filter((c) => c.status === "TERVERIFIKASI");
  const withActive = companies.filter((c) => c.permits.active > 0);
  const totals = companies.reduce(
    (acc, c) => ({
      total: acc.total + c.permits.total,
      active: acc.active + c.permits.active,
      pending: acc.pending + c.permits.pending,
      expired: acc.expired + c.permits.expired,
      rejected: acc.rejected + c.permits.rejected,
    }),
    { total: 0, active: 0, pending: 0, expired: 0, rejected: 0 }
  );

  const lastSyncAt = conn.lastSyncAt?.toISOString() ?? null;

  return ok({
    summary: {
      totalPpiu: ppiu.length,
      totalPihk: pihk.length,
      verified: verified.length,
      provinces: new Set(companies.map((c) => c.province)).size,
      permits: totals,
      compliance: companies.length ? Math.round((withActive.length / companies.length) * 100) : 0,
      companiesWithActive: withActive.length,
      connection: {
        environment: conn.environment,
        status: conn.status,
        autoSync: conn.autoSync,
        totalSyncs: conn.totalSyncs,
        lastSyncAt,
      },
    },
    companies,
    logs: logs.map((l) => ({
      id: l.id,
      type: l.type,
      status: l.status,
      message: l.message,
      recordsAffected: l.recordsAffected,
      durationMs: l.durationMs,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
