/**
 * Task 18 — Rate limiter in-memory per bucket + IP.
 * Task 19 (R-073) — LAPISAN ADAPTIF: pelanggaran di bucket mana pun dihitung
 * per IP; pelanggar berulang diblokir sementara dengan backoff berlipat ganda.
 *
 * Aturan adaptif:
 *   • Setiap penolakan (429) dicatat sebagai pelanggaran IP (window 10 menit).
 *   • ≥3 pelanggaran → IP masuk blocklist 5 menit; setiap penindakan
 *     berikutnya durasi ×2 (maks 60 menit) — makin sering, makin lama.
 *   • Selama diblokir, SEMUA bucket menolak lebih dini (tanpa mencatat
 *     pelanggaran tambahan agar Map tidak membengkak).
 *
 * Kontrak tetap: `rateLimit(req, bucket, max?, windowMs?)` → true boleh lanjut,
 * false ditolak (pemanggil membalas 429). Semua endpoint yang sudah memakai
 * rateLimit otomatis mendapat lapisan adaptif ini.
 * Observability: `adaptiveStats()` dipakai dashboard kesehatan (R-062).
 */
import { NextRequest } from "next/server";
import { log } from "@/lib/logger";

/** bucket:ip → daftar timestamp (ms) percobaan dalam window aktif. */
const buckets = new Map<string, number[]>();

/** ip → daftar timestamp pelanggaran (10 menit terakhir). */
const violations = new Map<string, number[]>();

/** ip → { until, strikes } blocklist adaptif. */
const blocked = new Map<string, { until: number; strikes: number }>();

const VIOLATION_WINDOW = 10 * 60_000;
const BLOCK_BASE_MS = 5 * 60_000;
const BLOCK_MAX_MS = 60 * 60_000;

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function rateLimit(
  req: NextRequest,
  bucket: string,
  max = 5,
  windowMs = 60_000
): boolean {
  const ip = clientIp(req);
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  /* --- Lapisan 1: blocklist adaptif --- */
  const bl = blocked.get(ip);
  if (bl) {
    if (now < bl.until) return false; // sedang diblokir → tolak semua bucket
    blocked.delete(ip); // hukuman selesai
  }

  /* --- Lapisan 2: bucket biasa --- */
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= max) {
    buckets.set(key, hits); // simpan versi terbersih agar tak membengkak
    recordViolation(ip, now);
    log("warn", "rate-limit deny", { bucket, ip, max });
    return false;
  }

  hits.push(now);
  buckets.set(key, hits);

  // Housekeeping global ringan — buang bucket kosong bila Map membesar.
  if (buckets.size > 1000) {
    for (const [k, v] of buckets) {
      const alive = v.filter((t) => now - t < windowMs);
      if (alive.length === 0) buckets.delete(k);
      else buckets.set(k, alive);
    }
  }

  return true;
}

/** Catat pelanggaran & eskalasi ke blocklist bila pola berulang. */
function recordViolation(ip: string, now: number) {
  const list = (violations.get(ip) || []).filter((t) => now - t < VIOLATION_WINDOW);
  list.push(now);
  violations.set(ip, list);

  if (list.length >= 3) {
    const prev = blocked.get(ip);
    const strikes = (prev?.strikes || 0) + 1;
    const dur = Math.min(BLOCK_MAX_MS, BLOCK_BASE_MS * 2 ** (strikes - 1));
    blocked.set(ip, { until: now + dur, strikes });
    violations.delete(ip); // reset pelanggaran setelah hukuman ditetapkan
    log("security", "adaptive blocklist", { ip, strikes, durationSec: Math.round(dur / 1000) });
  }
}

/** Statistik adaptif untuk dashboard observability (R-062). */
export function adaptiveStats(now = Date.now()) {
  const blockedIps: { ip: string; untilIso: string; secLeft: number; strikes: number }[] = [];
  for (const [ip, b] of blocked) {
    if (now < b.until) {
      blockedIps.push({ ip, untilIso: new Date(b.until).toISOString(), secLeft: Math.round((b.until - now) / 1000), strikes: b.strikes });
    } else blocked.delete(ip);
  }
  const violating: { ip: string; count: number }[] = [];
  for (const [ip, list] of violations) {
    const alive = list.filter((t) => now - t < VIOLATION_WINDOW);
    if (alive.length) violating.push({ ip, count: alive.length });
    else violations.delete(ip);
  }
  return {
    blockedCount: blockedIps.length,
    blockedIps,
    violatingIps: violating.sort((a, b) => b.count - a.count).slice(0, 10),
    activeBuckets: buckets.size,
  };
}
