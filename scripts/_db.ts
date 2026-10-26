/**
 * _db.ts — helper koneksi Prisma v8 untuk skrip lepas (seed/sync/backfill).
 *
 * v8 mewajibkan driver adapter: PrismaClient tanpa adapter akan gagal.
 * PENTING: jalankan skrip dengan Node + tsx (`npx tsx scripts/...`) —
 * runtime Bun belum mendukung native modul better-sqlite3
 * (oven-sh/bun#4290). Contoh: `npx tsx scripts/seed-v5/run.ts`
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

export function makeDb(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL?.startsWith("file:")
      ? process.env.DATABASE_URL.slice("file:".length)
      : path.join(process.cwd(), "db", "custom.db"),
  });
  return new PrismaClient({ adapter });
}
