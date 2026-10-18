#!/usr/bin/env node
/**
 * post-build.mjs — dipanggil otomatis oleh `npm run build`.
 * Menyalin aset statis ke dalam folder standalone agar siap dijalankan
 * di mana saja (VPS, Docker, maupun shared hosting cPanel).
 *
 *   - .next/static      →  .next/standalone/.next/static
 *   - public/           →  .next/standalone/public
 *
 * Cross-platform (jalan di Windows/macOS/Linux tanpa `cp -r`).
 */
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  // Di Vercel, `next build` tidak menghasilkan folder standalone — itu NORMAL.
  // Vercel menangani packaging serverless-nya sendiri, jadi akhiri dengan sukses.
  if (process.env.VERCEL === "1") {
    console.log("[post-build] Mode Vercel terdeteksi — langkah standalone dilewati (Vercel menangani packaging). ✓");
    process.exit(0);
  }
  console.error("[post-build] Folder .next/standalone tidak ditemukan — jalankan `next build` dulu.");
  process.exit(1);
}

cpSync(staticDir, path.join(standalone, ".next", "static"), { recursive: true });
cpSync(publicDir, path.join(standalone, "public"), { recursive: true });

console.log("[post-build] ✓ .next/static dan public tersalin ke .next/standalone — siap dipaketkan.");
