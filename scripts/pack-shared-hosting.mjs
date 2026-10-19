#!/usr/bin/env node
/**
 * ============================================================================
 * pack-shared-hosting.mjs — Membuat paket upload untuk SHARED HOSTING (cPanel)
 * ----------------------------------------------------------------------------
 * Jalankan setelah `npm run build`:
 *
 *     npm run hosting:pack        (atau: node scripts/pack-shared-hosting.mjs)
 *
 * Hasil: release/muhdin-shared-hosting/  (+ .zip bila tool `zip` tersedia)
 *
 * Struktur paket (upload ke cPanel, mis. /home/USERNAME/muhdin-app):
 *   server.js                  ← startup file cPanel (Setup Node.js App)
 *   .env                       ← environment produksi (placeholder __APP__ auto)
 *   .htaccess                  ← HTTPS + header keamanan (opsional)
 *   PANDUAN-SHARED-HOSTING.md  ← panduan lengkap Bahasa Indonesia
 *   .next/standalone/...       ← server Next.js + node_modules minimal (Prisma)
 *   .next/static/...           ← aset frontend
 *   public/...                 ← gambar, logo, robots.txt
 *   db/custom.db               ← database SQLite (sudah ter-seed)
 *   prisma/schema.prisma       ← referensi skema
 * ============================================================================
 */
import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const outDir = path.join(root, "release", "muhdin-shared-hosting");

const log = (m = "") => console.log(`[pack] ${m}`);
const fail = (m) => {
  console.error(`\n[pack] ❌ ${m}\n`);
  process.exit(1);
};
const dirSize = (p) => {
  let total = 0;
  for (const f of readdirSync(p, { withFileTypes: true })) {
    const fp = path.join(p, f.name);
    total += f.isDirectory() ? dirSize(fp) : statSync(fp).size;
  }
  return total;
};
const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;

/* 0) Prasyarat ------------------------------------------------------------ */
if (!existsSync(standaloneDir)) {
  fail("Build produksi belum ada. Jalankan dulu:  npm run build  (atau bun run build)");
}
if (!existsSync(staticDir)) {
  fail(".next/static tidak ditemukan — jalankan:  npm run build");
}
if (!existsSync(path.join(root, "db", "custom.db"))) {
  fail("db/custom.db tidak ditemukan — database seed wajib ada sebelum dipaketkan.");
}

log("Menyiapkan folder paket ...");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(path.join(outDir, ".next"), { recursive: true });
mkdirSync(path.join(outDir, "db"), { recursive: true });
mkdirSync(path.join(outDir, "prisma"), { recursive: true });

/* 1) Server standalone + aset statis -------------------------------------- */
log("Menyalin .next/standalone (server + node_modules minimal) ...");
cpSync(standaloneDir, path.join(outDir, ".next", "standalone"), { recursive: true });
log("Menyalin .next/static ...");
cpSync(staticDir, path.join(outDir, ".next", "static"), { recursive: true });

/* 2) Jaring pengaman engine Prisma (bila tracing melewatkan varian engine) */
const prismaClientSrc = path.join(root, "node_modules", ".prisma");
const prismaClientDst = path.join(outDir, ".next", "standalone", "node_modules", ".prisma");
if (existsSync(prismaClientSrc)) {
  log("Menyalin jaring pengaman Query Engine Prisma (debian + rhel) ...");
  cpSync(prismaClientSrc, prismaClientDst, { recursive: true, force: true });
}

/* 3) Aset publik + database + skema --------------------------------------- */
log("Menyalin public/ ...");
cpSync(path.join(root, "public"), path.join(outDir, "public"), { recursive: true });
log("Menyalin db/custom.db (database ter-seed) ...");
cpSync(path.join(root, "db", "custom.db"), path.join(outDir, "db", "custom.db"));
log("Menyalin prisma/schema.prisma ...");
cpSync(path.join(root, "prisma", "schema.prisma"), path.join(outDir, "prisma", "schema.prisma"));

/* 4) File konfigurasi & panduan ------------------------------------------- */
log("Menulis server.js, .env, .htaccess, dan panduan ...");
cpSync(path.join(root, "server.js"), path.join(outDir, "server.js"));

const envProd = path.join(root, ".env.production.example");
if (existsSync(envProd)) cpSync(envProd, path.join(outDir, ".env"));

for (const f of [".htaccess", "PANDUAN-SHARED-HOSTING.md"]) {
  const src = path.join(root, f);
  if (existsSync(src)) cpSync(src, path.join(outDir, f));
}

writeFileSync(
  path.join(outDir, "RELEASE-INFO.txt"),
  [
    "MUHDIN — Paket Shared Hosting",
    "================================",
    `Dibuat    : ${new Date().toISOString()}`,
    `Node lokal: ${process.version}`,
    `Sumber    : ${root}`,
    "",
    "Cara pakai: lihat PANDUAN-SHARED-HOSTING.md",
    "Startup file cPanel : server.js",
    "Folder aplikasi     : mis. /home/USERNAME/muhdin-app",
    "Database            : db/custom.db (path di-set otomatis oleh server.js)",
  ].join("\n") + "\n"
);

/* 5) Zip (bila tersedia) --------------------------------------------------- */
const releaseDir = path.dirname(outDir);
let zipPath = null;
const zipTry = (cmd, args) => spawnSync(cmd, args, { cwd: releaseDir, stdio: "ignore" });
let zipRes = zipTry("zip", ["-rq", "muhdin-shared-hosting.zip", "muhdin-shared-hosting"]);
if (zipRes.error || zipRes.status !== 0) {
  zipRes = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      "Compress-Archive -Path 'muhdin-shared-hosting' -DestinationPath 'muhdin-shared-hosting.zip' -Force",
    ],
    { cwd: releaseDir, stdio: "ignore" }
  );
}
if (zipRes.error || zipRes.status !== 0) {
  log("⚠ Tool zip tidak tersedia — zip manual:");
  log("   • Windows : klik kanan folder → Send to → Compressed (zipped) folder");
  log("   • macOS/Linux : cd release && zip -r muhdin-shared-hosting.zip muhdin-shared-hosting");
} else {
  zipPath = path.join(releaseDir, "muhdin-shared-hosting.zip");
}

/* 6) Ringkasan -------------------------------------------------------------- */
const size = dirSize(outDir);
log("");
log("════════════════════════════════════════════════════════");
log("  PAKET SHARED HOSTING SIAP ✓");
log("════════════════════════════════════════════════════════");
log(`  Folder : ${outDir}`);
if (zipPath) log(`  Zip    : ${zipPath} (${mb(statSync(zipPath).size)})`);
log(`  Isi    : ${mb(size)}`);
log("  Langkah berikutnya: buka PANDUAN-SHARED-HOSTING.md (Langkah B — Upload).");
log("════════════════════════════════════════════════════════");
