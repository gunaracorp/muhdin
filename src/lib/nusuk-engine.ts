import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

/**
 * NUSUK SYNC ENGINE
 * Jembatan data MUHDIN ↔ Platform Nusuk (Kementerian Hajj & Umrah KSA).
 * Simulasi API bridge yang siap dialihkan ke endpoint resmi Nusuk
 * (api.hajj.gov / nusuk.sa) tanpa perubahan pada lapisan aplikasi.
 */

export interface PermitSpec {
  code: string;
  label: string;
  validityDays: number;
  ecosystem: number;
  icon: string;
}

export const PERMIT_CATALOG: Record<string, PermitSpec> = {
  VISA: { code: "VSA", label: "Nusuk Visa Authorization", validityDays: 90, ecosystem: 1, icon: "passport" },
  HANDLING: { code: "HDL", label: "Nusuk Handling Clearance", validityDays: 180, ecosystem: 2, icon: "plane-landing" },
  MUTAWIF: { code: "MTW", label: "Nusuk Mutawif License", validityDays: 365, ecosystem: 5, icon: "compass" },
  HOTEL: { code: "HTL", label: "Nusuk Hotel Contract", validityDays: 365, ecosystem: 6, icon: "building-2" },
  TRANSPORT: { code: "TRN", label: "Nusuk Transport Permit", validityDays: 120, ecosystem: 7, icon: "bus" },
  RAUDAH: { code: "RDH", label: "Nusuk Rawdah Permit", validityDays: 30, ecosystem: 9, icon: "moon-star" },
};

// Tipe anggota → jenis permit yang layak disinkronkan
export const ELIGIBILITY: Record<string, string[]> = {
  PPIU: ["VISA", "HANDLING", "HOTEL", "TRANSPORT", "RAUDAH"],
  PIHK: ["VISA", "HOTEL", "TRANSPORT", "RAUDAH"],
  KBIHU: ["VISA", "HANDLING"],
  IPHI: ["MUTAWIF"],
  TRAVEL_WISATA: ["TRANSPORT", "HOTEL"],
};

export function getConnection() {
  return db.nusukConnection.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function ensureConnection() {
  const conn = await getConnection();
  if (conn) return conn;
  return db.nusukConnection.create({
    data: {
      environment: "SANDBOX",
      apiKey: generateApiKey(),
      webhookSecret: generateWebhookSecret(),
      status: "DISCONNECTED",
    },
  });
}

export function generateApiKey() {
  return `nsk_live_${randomBytes(24).toString("hex")}`;
}

export function generateWebhookSecret() {
  return `whsec_${randomBytes(18).toString("hex")}`;
}

/** Nomor izin deterministik — idempoten antar-sync: NSK-VSA-2026-482913 */
export function buildPermitNo(licenseNo: string, type: string) {
  const code = PERMIT_CATALOG[type]?.code ?? "GEN";
  const hash = createHash("sha256").update(`${licenseNo}:${type}:nusuk`).digest("hex");
  const digits = parseInt(hash.slice(0, 8), 16).toString().padStart(6, "0").slice(0, 6);
  return `NSK-${code}-2026-${digits}`;
}

function rollStatus() {
  const r = Math.random();
  if (r < 0.86) return "ACTIVE";
  if (r < 0.93) return "PENDING";
  if (r < 0.98) return "EXPIRED";
  return "REJECTED";
}

export interface SyncSummary {
  created: number;
  updated: number;
  expired: number;
  skipped: number;
  recordsAffected: number;
  durationMs: number;
}

/**
 * Cakupan sinkronisasi (Task 51 — Dashboard PPIU & PPIHK):
 * - types     : batasi ke jenis anggota tertentu, mis. ["PPIU","PIHK"]
 * - memberIds : batasi ke anggota spesifik (sinkron perusahaan tunggal)
 * Tanpa scope → seluruh anggota TERVERIFIKASI (perilaku lama, kompatibel).
 */
export interface SyncScope {
  types?: string[];
  memberIds?: string[];
}

/**
 * Menjalankan satu siklus sinkronisasi penuh:
 * 1. Ambil anggota TERVERIFIKASI  2. Terbitkan/perbarui izin per eligibility
 * 3. Kedaluwarsakan izin ACTIVE yang lewat masa berlaku  4. Tulis log audit
 */
export async function runSync(scope?: SyncScope): Promise<{ summary: SyncSummary; logId: string; message: string }> {
  const started = Date.now();
  const conn = await ensureConnection();
  if (conn.status !== "CONNECTED") {
    throw new Error("Koneksi Nusuk belum aktif. Hubungkan terlebih dahulu di modul Integrasi Nusuk.");
  }

  const members = await db.member.findMany({
    where: {
      status: "TERVERIFIKASI",
      ...(scope?.types?.length ? { type: { in: scope.types } } : {}),
      ...(scope?.memberIds?.length ? { id: { in: scope.memberIds } } : {}),
    },
    select: { id: true, licenseNo: true, type: true, name: true },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date();

  for (const member of members) {
    const types = ELIGIBILITY[member.type] ?? ["VISA"];
    for (const type of types) {
      const spec = PERMIT_CATALOG[type];
      if (!spec) continue;
      const permitNo = buildPermitNo(member.licenseNo, type);
      const existing = await db.nusukPermit.findUnique({ where: { permitNo } });

      // ~8% skip mensimulasikan izin yang belum diajukan siklus ini
      if (!existing && Math.random() < 0.08) {
        skipped += 1;
        continue;
      }

      if (!existing) {
        const status = rollStatus();
        const issuedAt = new Date(now.getTime() - Math.floor(Math.random() * 40) * 86400000);
        const expiresAt =
          status === "EXPIRED"
            ? new Date(now.getTime() - 86400000)
            : new Date(now.getTime() + spec.validityDays * 86400000);
        await db.nusukPermit.create({
          data: {
            memberId: member.id,
            type,
            permitNo,
            holderName: member.name,
            meta: `${spec.label} · quota ${Math.ceil((parseInt(permitNo.slice(-4), 10) % 40) + 12)} jamaah`,
            status,
            issuedAt,
            expiresAt,
            syncedAt: now,
          },
        });
        created += 1;
      } else {
        const expired = existing.expiresAt < now;
        await db.nusukPermit.update({
          where: { permitNo },
          data: {
            status: expired ? "EXPIRED" : existing.status,
            syncedAt: now,
          },
        });
        updated += 1;
      }
    }
  }

  // Kedaluwarsakan izin ACTIVE yang sudah lewat masa berlaku
  const expiredBatch = await db.nusukPermit.updateMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
  const expired = expiredBatch.count;

  const durationMs = Date.now() - started;
  const recordsAffected = created + updated + expired;
  const scopeLabel = scope?.memberIds?.length
    ? " (perusahaan terpilih)"
    : scope?.types?.length
      ? ` (${scope.types.join(" & ")})`
      : "";
  const message = `Sinkronisasi ${conn.environment}${scopeLabel}: ${created} izin baru, ${updated} diperbarui, ${expired} kedaluwarsa dari ${members.length} anggota.`;

  const log = await db.nusukSyncLog.create({
    data: {
      connectionId: conn.id,
      type: scope?.memberIds?.length ? "MEMBER_SYNC" : "FULL_SYNC",
      status: "SUCCESS",
      message,
      recordsAffected,
      durationMs,
    },
  });

  await db.nusukConnection.update({
    where: { id: conn.id },
    data: { lastSyncAt: now, totalSyncs: { increment: 1 } },
  });

  return {
    summary: { created, updated, expired, skipped, recordsAffected, durationMs },
    logId: log.id,
    message,
  };
}

export async function computeMetrics() {
  const [byStatus, grouped, logs, logs7d] = await Promise.all([
    db.nusukPermit.groupBy({ by: ["status"], _count: true }),
    db.nusukPermit.groupBy({ by: ["type", "status"], _count: true }),
    db.nusukSyncLog.findMany({ select: { status: true, durationMs: true }, where: { type: "FULL_SYNC" }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.nusukSyncLog.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
  ]);

  const total = byStatus.reduce((a, s) => a + s._count, 0);
  const get = (status: string) => byStatus.find((s) => s.status === status)?._count ?? 0;

  const typeMap = new Map<string, { type: string; total: number; active: number }>();
  for (const g of grouped) {
    const cur = typeMap.get(g.type) ?? { type: g.type, total: 0, active: 0 };
    cur.total += g._count;
    if (g.status === "ACTIVE") cur.active += g._count;
    typeMap.set(g.type, cur);
  }

  const membersConnected = await db.nusukPermit.findMany({
    where: { status: "ACTIVE" },
    select: { memberId: true },
    distinct: ["memberId"],
  });

  const successCount = logs.filter((l) => l.status === "SUCCESS").length;
  const avgDuration = logs.length ? Math.round(logs.reduce((a, l) => a + l.durationMs, 0) / logs.length) : 0;

  return {
    permitsTotal: total,
    permitsActive: get("ACTIVE"),
    permitsPending: get("PENDING"),
    permitsExpired: get("EXPIRED"),
    permitsRejected: get("REJECTED"),
    membersConnected: membersConnected.length,
    successRate: logs.length ? Math.round((successCount / logs.length) * 1000) / 10 : 100,
    syncsLast7d: logs7d,
    avgDurationMs: avgDuration,
    byType: PERMIT_CATALOG
      ? [...typeMap.values()].sort((a, b) => a.type.localeCompare(b.type))
      : [],
  };
}
