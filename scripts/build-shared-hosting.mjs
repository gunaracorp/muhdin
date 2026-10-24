#!/usr/bin/env node
/**
 * ============================================================================
 * build-shared-hosting.mjs — MUHDIN Shared Hosting Edition (tanpa Node.js)
 * ----------------------------------------------------------------------------
 * Membangun frontend STATIC EXPORT murni + memaketkan backend PHP + database:
 *
 *   1. Membuat salinan proyek terisolasi di /tmp (proyek utama TIDAK disentuh,
 *      dev server tetap aman berjalan).
 *   2. Route API Node (src/app/api) dikeluarkan dari salinan — di hosting
 *      digantikan backend PHP (shared-hosting/api).
 *   3. `next build` dengan BUILD_STATIC=1 → output/export (HTML+JS+CSS statis).
 *   4. Merakit paket: deploy/muhdin-shared-hosting/
 *        index.html + _next/ + aset publik   ← frontend statis
 *        api/*.php                           ← backend PHP (paritas API)
 *        data/muhdin.sqlite                  ← database (salinan db/custom.db)
 *        .htaccess                           ← routing Apache + proteksi DB
 *        INSTALL.txt / RELEASE-INFO.txt      ← panduan unggah
 *   5. Zip: deploy/muhdin-shared-hosting-v<versi>.zip
 *
 * Jalankan:  npm run hosting:build   (atau: node scripts/build-shared-hosting.mjs)
 * Prasyarat: db/custom.db sudah ter-seed (bun run dev pernah dijalankan).
 * ============================================================================
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = "/tmp/muhdin-hosting-build";
const outDir = path.join(root, "deploy", "muhdin-shared-hosting");
const log = (m = "") => console.log(`[hosting] ${m}`);
const die = (m) => {
  console.error(`\n[hosting] ❌ ${m}\n`);
  process.exit(1);
};
const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;
const dirSize = (p) => {
  let total = 0;
  for (const f of readdirSync(p, { withFileTypes: true })) {
    total += f.isDirectory() ? dirSize(path.join(p, f.name)) : statSync(path.join(p, f.name)).size;
  }
  return total;
};

/* 0) Prasyarat ------------------------------------------------------------- */
const dbSrc = path.join(root, "db", "custom.db");
if (!existsSync(dbSrc)) die("db/custom.db tidak ditemukan — jalankan dulu aplikasi agar database ter-seed.");
if (!existsSync(path.join(root, "shared-hosting", "api", "index.php"))) {
  die("shared-hosting/api tidak lengkap — backend PHP wajib ada.");
}
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version || "2.0.0";

/**
 * Password akun demo DI-REHASH ke bcrypt agar dapat diverifikasi backend PHP
 * (hash scrypt Node tidak dapat diverifikasi PHP — lihat INSTALL.txt).
 * Hash berformat $2y$ = bcrypt PHP standar, berisi salt tersendiri.
 * Password-nya adalah kredensial demo yang sudah terdokumentasi di README.
 */
const DEMO_BCRYPT = {
  "admin@muhdin.web.id": "$2y$10$nvTFHuwBHB17N8j9..HQ7ujKXxwGBiIP5ZY3pZPNRVbdVydfAVFrC", // muhdin2026
  "verifikator@muhdin.web.id": "$2y$10$XPOTunBQ53YsM5YtV/DP0O5xM..NDLzyYCbZD219B4MIzrb3w5dQ2", // verifikator2026
  "editor@muhdin.web.id": "$2y$10$pNNG7z3LxTzi.1ipNqMOd.QRizVL.GyZRfQFJcxnR503QTaRkhzRW", // editor2026
};

/* 1) Salinan proyek terisolasi ---------------------------------------------- */
log("Menyiapkan salinan proyek terisolasi (dev server tidak disentuh) ...");
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
for (const f of ["package.json", "tsconfig.json", "next.config.ts", "next-env.d.ts", "postcss.config.mjs", ".env"]) {
  if (existsSync(path.join(root, f))) cpSync(path.join(root, f), path.join(buildDir, f));
}
for (const d of ["prisma", "public", "src"]) {
  cpSync(path.join(root, d), path.join(buildDir, d), { recursive: true });
}
log("Mengaitkan node_modules (hardlink, tanpa duplikasi) ...");
const nmRes = spawnSync("cp", ["-al", path.join(root, "node_modules"), path.join(buildDir, "node_modules")], { stdio: "inherit" });
if (nmRes.status !== 0) die("cp -al node_modules gagal — jalankan manual: cp -al node_modules " + buildDir);
// Route API Node tidak kompatibel dengan export statis — di hosting digantikan PHP.
rmSync(path.join(buildDir, "src", "app", "api"), { recursive: true, force: true });

/* 2) Static export ----------------------------------------------------------- */
log("Menjalankan next build (BUILD_STATIC=1 → output export) ...");
const buildRes = spawnSync("bun", ["x", "next", "build"], {
  cwd: buildDir,
  stdio: "inherit",
  env: {
    ...process.env,
    BUILD_STATIC: "1",
    DATABASE_URL: `file:${dbSrc}`,
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
if (buildRes.status !== 0) die("next build gagal — periksa log di atas.");
const exportDir = path.join(buildDir, "out");
if (!existsSync(path.join(exportDir, "index.html"))) die("out/index.html tidak dihasilkan — export statis gagal.");

/* 3) Rakit paket -------------------------------------------------------------- */
log("Merakit paket shared hosting ...");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(path.join(outDir, "data"), { recursive: true });
// Salin seluruh hasil export (index.html, _next/, manifest, sw.js, offline.html, ikon, gambar).
cpSync(exportDir, outDir, { recursive: true });
// Backend PHP + .htaccess + router.
cpSync(path.join(root, "shared-hosting", "api"), path.join(outDir, "api"), { recursive: true });
cpSync(path.join(root, "shared-hosting", ".htaccess"), path.join(outDir, ".htaccess"));
// Database SQLite (berkas yang sama dengan versi Node).
cpSync(dbSrc, path.join(outDir, "data", "muhdin.sqlite"));
// Beres-beres: salinan unduhan darurat di public/ (*.zip, INSTALL) tidak boleh
// ikut ke dalam paket — mencegah zip di dalam zip (self-bloat) saat rebuild.
for (const f of readdirSync(outDir)) {
  if (/\.zip$/i.test(f) || f === "muhdin-shared-hosting-INSTALL.txt") {
    rmSync(path.join(outDir, f));
    log(`Bersihkan artefak publik dari paket: ${f}`);
  }
}

// Re-hash password akun demo → bcrypt (agar login demo berfungsi di hosting PHP).
{
  const phpCandidates = [process.env.PHP_BIN, "/home/z/tools/php/bin/php"].filter(Boolean);
  const phpBin = phpCandidates.find((p) => existsSync(p));
  const json = JSON.stringify(DEMO_BCRYPT);
  const phpCode = `$db=${JSON.stringify(path.join(outDir, "data", "muhdin.sqlite"))}; `
    // JSON dibungkus KUTIP TUNGGAL agar "$" pada hash bcrypt tidak
    // di-interpolasi PHP sebagai variabel.
    + `$map=json_decode('${json.replaceAll("'", "\\'")}', true); `
    + `$p=new PDO("sqlite:".$db); $p->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); `
    + `$st=$p->prepare("UPDATE User SET password = ? WHERE email = ?"); `
    + `$n=0; foreach ($map as $email => $hash) { $st->execute([$hash, $email]); $n += $st->rowCount(); } `
    + `echo "rehashed=$n\\n";`;
  if (phpBin) {
    // spawnSync tanpa shell → kode PHP tidak dimanggil /bin/sh.
    const res = spawnSync(phpBin, ["-r", phpCode], { encoding: "utf8" });
    if (res.status === 0) {
      log(`Password akun demo di-rehash ke bcrypt ✓ (${(res.stdout || "").trim()})`);
    } else {
      log(`⚠ Re-hash gagal: ${(res.stderr || res.stdout || "").trim().slice(0, 200)}`);
    }
  } else {
    log("⚠ Binary php tidak ditemukan — password akun demo TIDAK di-rehash.");
    log("  Login demo di hosting butuh reset password lewat Super Admin (lihat INSTALL.txt).");
  }
}

/* 4) Panduan & info rilis ------------------------------------------------------ */
cpSync(path.join(root, "shared-hosting", "INSTALL.txt"), path.join(outDir, "INSTALL.txt"));
writeFileSync(
  path.join(outDir, "RELEASE-INFO.txt"),
  [
    "MUHDIN — Shared Hosting Edition (tanpa Node.js)",
    "================================================",
    `Versi    : ${version}`,
    `Dibuat   : ${new Date().toISOString()}`,
    `Sumber   : ${root}`,
    "",
    "Isi paket:",
    "  index.html + _next/ + aset  → frontend statis (Next.js export)",
    "  api/*.php                   → backend API PHP (paritas kontrak penuh)",
    "  data/muhdin.sqlite          → database SQLite (sudah ter-seed)",
    "  .htaccess                   → routing Apache + proteksi database",
    "  INSTALL.txt                 → panduan unggah Bahasa Indonesia",
    "",
    "Prasyarat hosting: PHP 7.4+ dengan ekstensi pdo_sqlite (bawaan cPanel),",
    "tanpa Node.js, tanpa Composer, tanpa database MySQL.",
  ].join("\n") + "\n"
);

/* 5) Zip ------------------------------------------------------------------------ */
const releaseDir = path.dirname(outDir);
const zipName = `muhdin-shared-hosting-v${version}.zip`;
let zipOk = false;
{
  const res = spawnSync("zip", ["-rq", zipName, "muhdin-shared-hosting"], { cwd: releaseDir, stdio: "ignore" });
  zipOk = res.status === 0;
}
if (!zipOk) {
  const res = spawnSync("bun", ["-e", `await Bun.file("${path.join(outDir)}")` ], { stdio: "ignore" });
  zipOk = false;
  log("⚠ Tool `zip` tidak tersedia — zip manual: klik kanan folder → Compress");
}

/* 6) Ringkasan --------------------------------------------------------------------- */
const size = dirSize(outDir);
log("");
log("════════════════════════════════════════════════════════");
log("  PAKET SHARED HOSTING (TANPA NODE.JS) SIAP ✓");
log("════════════════════════════════════════════════════════");
log(`  Folder : ${outDir} (${mb(size)})`);
if (zipOk) log(`  Zip    : ${path.join(releaseDir, zipName)} (${mb(statSync(path.join(releaseDir, zipName)).size)})`);
log(`  Versi  : ${version}`);
log("  Pratinjau lokal (opsional):");
log(`    php -S 0.0.0.0:3010 -t ${outDir} ${path.join(root, "shared-hosting", "router.php")}`);
log("  Langkah berikutnya: baca INSTALL.txt → unggah ke cPanel.");
log("════════════════════════════════════════════════════════");
