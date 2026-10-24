/**
 * Task 18 — Rate limiter in-memory sederhana per bucket + IP.
 *
 * Dirancang untuk form publik (complaints, subscribers, messages,
 * applications) agar tidak disalahgunakan spam/bot. State disimpan di
 * memori proses (Map) — cukup untuk satu instance Next.js tanpa middleware.
 *
 * Kontrak: `rateLimit(req, bucket, max?, windowMs?)` → true boleh lanjut,
 * false ditolak (pemanggil membalas 429).
 */
import { NextRequest } from "next/server";

/** bucket:ip → daftar timestamp (ms) percobaan dalam window aktif. */
const buckets = new Map<string, number[]>();

export function rateLimit(
  req: NextRequest,
  bucket: string,
  max = 5,
  windowMs = 60_000
): boolean {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  // Bersihkan entri kadaluarsa untuk key ini.
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= max) {
    buckets.set(key, hits); // simpan versi terbersih agar tak membengkak
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
