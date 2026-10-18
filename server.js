#!/usr/bin/env node
"use strict";

/**
 * ============================================================================
 * MUHDIN — muhdin.web.id · Startup File Shared Hosting (cPanel / Passenger)
 * ----------------------------------------------------------------------------
 * File inilah yang diisi di kolom "Application startup file" pada
 * cPanel → Setup Node.js App. Tugasnya:
 *
 *   1. Memuat file .env dari folder aplikasi (env dari cPanel TIDAK ditimpa)
 *   2. Menyelesaikan placeholder __APP__ (folder aplikasi) dan __HOME__
 *      (folder akun hosting) di dalam nilai .env
 *   3. Menyiapkan default aman: NODE_ENV, PORT, NEXT_TELEMETRY_DISABLED,
 *      DATABASE_URL (otomatis menunjuk <folder aplikasi>/db/custom.db)
 *   4. Pre-flight check build & database dengan pesan galat yang jelas
 *   5. Menjalankan server Next.js standalone (.next/standalone/server.js)
 *
 * Tidak membutuhkan dependensi apa pun — cukup Node.js 20+.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const APP_ROOT = __dirname;
const TAG = "[MUHDIN]";

/* ---------------------------------------------------------------------------
 * 1) Muat .env dari folder aplikasi
 * ------------------------------------------------------------------------ */
function loadEnvFile() {
  const envPath = path.join(APP_ROOT, ".env");
  if (!fs.existsSync(envPath)) {
    return 0;
  }
  const raw = fs.readFileSync(envPath, "utf8");
  let count = 0;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Placeholder → path absolut pada server hosting
    value = value.replace(/__APP__/g, APP_ROOT).replace(/__HOME__/g, os.homedir());
    if (process.env[key] === undefined) {
      process.env[key] = value;
      count += 1;
    }
  }
  return count;
}

const loadedVars = loadEnvFile();

/* ---------------------------------------------------------------------------
 * 2) Default aman
 * ------------------------------------------------------------------------ */
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.NEXT_TELEMETRY_DISABLED = process.env.NEXT_TELEMETRY_DISABLED || "1";

if (!process.env.PORT) {
  // Di cPanel/Passenger, PORT diisi otomatis oleh sistem.
  // Nilai 3000 hanya fallback saat menjalankan `node server.js` secara lokal.
  process.env.PORT = "3000";
}

if (!process.env.HOSTNAME) {
  process.env.HOSTNAME = "0.0.0.0";
}

// DATABASE_URL default → <folder aplikasi>/db/custom.db (portabel, anti salah path)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(APP_ROOT, "db", "custom.db")}`;
}

/* ---------------------------------------------------------------------------
 * 3) Pre-flight check
 * ------------------------------------------------------------------------ */
function die(messages) {
  console.error(`${TAG} ==========================================================`);
  messages.forEach((m) => console.error(`${TAG} ${m}`));
  console.error(`${TAG} ==========================================================`);
  process.exit(1);
}

const standaloneServer = path.join(APP_ROOT, ".next", "standalone", "server.js");
if (!fs.existsSync(standaloneServer)) {
  die([
    "BUILD PRODUKSI TIDAK DITEMUKAN.",
    `Diharapkan ada di : ${standaloneServer}`,
    "Solusi:",
    "  a) Upload paket release/muhdin-shared-hosting.zip secara LENGKAP (pastikan",
    "     file .next/standalone/server.js ikut ter-upload), atau",
    "  b) Jalankan 'npm run build' di komputer lokal, lalu 'npm run hosting:pack',",
    "     dan upload ulang hasilnya ke cPanel.",
  ]);
}

const dbFile = process.env.DATABASE_URL.replace(/^file:/, "");
if (!process.env.MUHDIN_SKIP_DB_CHECK && !fs.existsSync(dbFile)) {
  die([
    "DATABASE SQLITE TIDAK DITEMUKAN.",
    `DATABASE_URL     : ${process.env.DATABASE_URL}`,
    `File yang dicari : ${dbFile}`,
    "Solusi:",
    "  a) Pastikan folder 'db/custom.db' dari paket release ikut ter-upload, atau",
    "  b) Isi Environment variable DATABASE_URL di cPanel → Setup Node.js App",
    "     menunjuk ke file database yang benar, contoh:",
    "     file:/home/USERNAME/muhdin-app/db/custom.db",
  ]);
}

/* ---------------------------------------------------------------------------
 * 4) Banner informasi startup
 * ------------------------------------------------------------------------ */
console.log(`${TAG} ==========================================================`);
console.log(`${TAG} MUHDIN — muhdin.web.id  ·  Shared Hosting Mode`);
console.log(`${TAG} Node.js      : ${process.version}`);
console.log(`${TAG} Mode         : ${process.env.NODE_ENV}`);
console.log(`${TAG} Port         : ${process.env.PORT} (diset oleh Passenger)`);
console.log(`${TAG} App Root     : ${APP_ROOT}`);
console.log(`${TAG} Database     : ${dbFile}`);
console.log(`${TAG} .env dimuat  : ${loadedVars} variabel baru`);
console.log(`${TAG} ==========================================================`);
console.log(`${TAG} Memulai server Next.js standalone ...`);

/* ---------------------------------------------------------------------------
 * 5) Jalankan server Next.js standalone
 * ------------------------------------------------------------------------ */
try {
  require(standaloneServer);
} catch (err) {
  console.error(`${TAG} Gagal menjalankan server Next.js:`, err);
  process.exit(1);
}
