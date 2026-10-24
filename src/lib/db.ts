import { PrismaClient } from '@prisma/client'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Resolusi DATABASE_URL saat runtime — self-healing & Vercel-ready.
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
 * Dipanggil SEBELUM PrismaClient dibuat — Prisma membaca env saat instansiasi.
 */
function resolveDatabaseUrl(): string {
  const bundled = path.join(process.cwd(), 'db', 'custom.db')

  if (process.env.VERCEL === '1') {
    const tmpDb = '/tmp/muhdin.db'
    try {
      mkdirSync('/tmp', { recursive: true })
      if (existsSync(bundled)) copyFileSync(bundled, tmpDb)
    } catch {
      // biarkan Prisma yang melaporkan bila /tmp tak tersedia
    }
    if (existsSync(tmpDb)) return 'file:/tmp/muhdin.db'
  }

  const explicit = process.env.DATABASE_URL
  if (explicit) {
    if (!explicit.startsWith('file:')) return explicit // provider lain — serahkan ke Prisma
    const candidate = explicit.slice('file:'.length)
    const abs = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(process.cwd(), candidate)
    if (existsSync(abs)) return explicit
  }

  return `file:${bundled}`
}

process.env.DATABASE_URL = resolveDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query logging hanya di development agar log produksi/Vercel bersih.
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
