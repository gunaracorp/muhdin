/**
 * Task 38 — QR code statis menuju situs MUHDIN (untuk section
 * "Bawa MUHDIN di Genggaman" di homepage, bergaya section unduh aplikasi Nusuk.sa).
 * Dipanggil sekali saat pengembangan: bun scripts/gen-qr.ts
 * Output: public/images/qr-muhdin-web.png (PNG 1024px, siap dipakai <img>).
 */
import QRCode from "qrcode";
import path from "node:path";

const OUT = path.resolve(import.meta.dir, "../public/images/qr-muhdin-web.png");
const TARGET_URL = "https://muhdin.web.id";

const svg = await QRCode.toString(TARGET_URL, {
  type: "svg",
  errorCorrectionLevel: "H",
  margin: 2,
  color: { dark: "#0B3D2Eff", light: "#FFFFFFff" },
});

// Rasterize SVG → PNG via sharp-less path: qrcode.toFile mendukung PNG langsung.
await QRCode.toFile(OUT, TARGET_URL, {
  errorCorrectionLevel: "H",
  margin: 2,
  width: 1024,
  color: { dark: "#0B3D2Eff", light: "#FFFFFFff" },
});

console.log("QR saved:", OUT, "| svg preview len:", svg.length);
