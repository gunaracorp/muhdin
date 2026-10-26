// prisma.config.ts — konfigurasi Prisma v8 (wajib sejak v7).
// Menggantikan konfigurasi lama di package.json#prisma & auto-load .env.
// dotenv memuat DATABASE_URL dari .env untuk semua perintah CLI
// (generate, db push, migrate). Runtime Next.js tetap memakai
// resolver self-healing di src/lib/db.ts (adapter better-sqlite3).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback ke db/custom.db bila .env tidak ada (mis. clone bersih).
    url: process.env.DATABASE_URL ?? "file:./db/custom.db",
  },
});
