import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as dotenvConfig } from "dotenv";

/**
 * v11.1 — PrismaClient dengan driver adapter @prisma/adapter-pg.
 *
 * Sumber data kini Prisma Postgres (cloud, pooled.db.prisma.io) —
 * semua pendaftaran/notifikasi tersimpan permanen di Postgres, aman
 * terhadap restart/redeploy sandbox (SQLite lokal hanya arsip).
 *
 * dotenv override:true — .env SELALU menang atas env var warisan
 * sandbox/server. Kasus nyata (Task 13): container membawa
 * DATABASE_URL=file:... lama dari boot, sehingga tanpa override runtime
 * salah menyambung. Di Vercel/.env tidak ada → override no-op, env
 * dashboard tetap dipakai.
 *
 * Arsitektur Rust-free tetap: query compiler TypeScript + adapter,
 * tanpa unduhan binary engine.
 */
dotenvConfig({ override: true });

const PG_URL = (process.env.DATABASE_URL || "").trim();

function resolvePgConfig(): { connectionString: string; ssl: { rejectUnauthorized: false }; max: number } {
  if (PG_URL.startsWith("postgres://") || PG_URL.startsWith("postgresql://")) {
    return {
      connectionString: PG_URL,
      // Prisma Postgres mewajibkan SSL. verify-full bawaan pg kadang gagal
      // pada CA sandbox — samakan semantik dengan sslmode=require Prisma.
      ssl: { rejectUnauthorized: false },
      max: 10, // pool kecil cukup untuk workload portal
    };
  }
  // Belum ada URL Postgres yang sah — jangan biarkan proses hidup dengan
  // koneksi salah sasaran: lempar pesan yang bisa ditindaklanjuti.
  throw new Error(
    "DATABASE_URL Postgres belum diatur. Isi .env (lihat .env.example) atau env var deployment dengan postgres://…@pooled.db.prisma.io:5432/postgres?sslmode=require"
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Driver adapter Postgres — wajib di v8 (tanpa engine Rust).
    adapter: new PrismaPg(resolvePgConfig()),
    // Query logging hanya di development agar log produksi/Vercel bersih.
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
