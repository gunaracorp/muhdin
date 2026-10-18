/**
 * Task 15-b — Generator aset ikon PWA dari pwa-src/icon-1024.png.
 * Output ke public/icons/:
 *  - icon-512.png / icon-192.png            (any)
 *  - icon-maskable-512/192.png              (safe-zone 80% + latar blur seam)
 *  - apple-touch-icon.png (180)             (iOS home screen)
 * Jalankan: bun scripts/make-pwa-icons.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "pwa-src", "icon-1024.png");
const OUT = path.join(ROOT, "public", "icons");

if (!fs.existsSync(SRC)) {
  console.error("Sumber tidak ditemukan:", SRC);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

async function maskable(size) {
  // Latar = gambar penuh (sedikit blur) agar tepi lingkaran mask Android mulus;
  // konten disusutkan ke 80% (safe zone maskable icon).
  const bg = await sharp(SRC).resize(size, size).blur(6).toBuffer();
  const fgSize = Math.round(size * 0.8);
  const fg = await sharp(SRC).resize(fgSize, fgSize).toBuffer();
  const left = Math.round((size - fgSize) / 2);
  await sharp(bg)
    .composite([{ input: fg, left, top: left }])
    .png()
    .toFile(path.join(OUT, `icon-maskable-${size}.png`));
}

await sharp(SRC).resize(512, 512).png().toFile(path.join(OUT, "icon-512.png"));
await sharp(SRC).resize(192, 192).png().toFile(path.join(OUT, "icon-192.png"));
await sharp(SRC).resize(180, 180).png().toFile(path.join(OUT, "apple-touch-icon.png"));
await maskable(512);
await maskable(192);

for (const f of fs.readdirSync(OUT)) {
  const kb = (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1);
  console.log(`✓ ${f} (${kb} KB)`);
}
console.log("Selesai.");
