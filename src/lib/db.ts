import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * v8 — PrismaClient dengan driver adapter better-sqlite3 (arsitektur
 * Rust-free: query compiler TypeScript, TANPA unduhan binary engine).
 * Hasilnya: `bun install` jauh lebih ringan & cepat di semua lingkungan.
 *
 * Resolusi path database saat runtime — self-healing & Vercel-ready.
 *
 * Urutan keputusan:
 * 1. Di Vercel/serverless (filesystem read-only, kecuali /tmp):
 *    salin database SQLite yang ter-bundle (db/custom.db) ke /tmp
 *    lalu gunakan salinan itu (SQLite butuh akses tulis meski hanya membaca).
 * 2. Hormati DATABASE_URL eksplisit (.env / env var) SELAMA file-nya nyata ada.
 *    Path warisan yang tidak ada (mis. path absolut komputer lain) diabaikan
 *    dengan anggun — inilah yang membuat deploy berpindah mesin tetap hidup.
 * 3. Lokal/VPS: gunakan db/custom.db di root proyek (path absolut dari cwd).
 *
 * Catatan: berjalan di Node.js (runtime Next.js). Di bawah runtime Bun,
 * native modul better-sqlite3 belum didukung (oven-sh/bun#4290) —
 * skrip lepas gunakan `npx tsx` / Node, bukan `bun run`.
 */
function resolveDatabasePath(): string {
  const bundled = path.join(process.cwd(), 'db', 'custom.db')

  if (process.env.VERCEL === '1') {
    const tmpDb = '/tmp/muhdin.db'
    try {
      mkdirSync('/tmp', { recursive: true })
      if (existsSync(bundled)) copyFileSync(bundled, tmpDb)
    } catch {
      // biarkan adapter yang melaporkan bila /tmp tak tersedia
    }
    if (existsSync(tmpDb)) return tmpDb
  }

  const explicit = process.env.DATABASE_URL
  if (explicit) {
    if (!explicit.startsWith('file:')) return explicit // provider lain — serahkan ke adapter
    const candidate = explicit.slice('file:'.length)
    const abs = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(process.cwd(), candidate)
    if (existsSync(abs)) return abs
  }

  return bundled
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Driver adapter SQLite — wajib di v8 (tanpa engine Rust).
    adapter: new PrismaBetterSqlite3({ url: resolveDatabasePath() }),
    // Query logging hanya di development agar log produksi/Vercel bersih.
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
