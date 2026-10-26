/**
 * Task 23 — Pengunduh logo maskapai dunia yang melayani penerbangan ke Arab Saudi.
 *
 * Sumber logo (fallback berurutan):
 *   1. Kiwi.com CDN  : https://images.kiwi.com/airlines/64/{IATA}.png
 *   2. AirHex CDN    : https://content.airhex.com/content/logos/airlines_{IATA}_100_100_s.png
 *
 * Output:
 *   - public/airlines/{IATA}.png   (logo resmi, latar transparan)
 *   - src/lib/airlines.ts          (data hanya maskapai yang logo-nya berhasil diunduh)
 *
 * Jalankan: bun scripts/fetch-airline-logos.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const OUT_DIR = path.join(ROOT, "public", "airlines");
const TS_OUT = path.join(ROOT, "src", "lib", "airlines.ts");

/** Daftar maskapai yang melayani rute ke Arab Saudi (JED/MED/RUH/DMM dst.) — reguler & charter musiman. */
const AIRLINES = [
  // ── Indonesia (kartu unggulan) ──────────────────────────────
  { code: "GA", name: "Garuda Indonesia", region: "id" },
  { code: "ID", name: "Batik Air", region: "id" },
  { code: "JT", name: "Lion Air", region: "id" },
  { code: "SJ", name: "Sriwijaya Air", region: "id" },

  // ── Timur Tengah & Teluk ────────────────────────────────────
  { code: "SV", name: "Saudia", region: "gcc" },
  { code: "XY", name: "Flynas", region: "gcc" },
  { code: "F3", name: "Flyadeal", region: "gcc" },
  { code: "EK", name: "Emirates", region: "gcc" },
  { code: "EY", name: "Etihad Airways", region: "gcc" },
  { code: "FZ", name: "flydubai", region: "gcc" },
  { code: "G9", name: "Air Arabia", region: "gcc" },
  { code: "QR", name: "Qatar Airways", region: "gcc" },
  { code: "GF", name: "Gulf Air", region: "gcc" },
  { code: "KU", name: "Kuwait Airways", region: "gcc" },
  { code: "J9", name: "Jazeera Airways", region: "gcc" },
  { code: "WY", name: "Oman Air", region: "gcc" },
  { code: "OV", name: "SalamAir", region: "gcc" },
  { code: "RJ", name: "Royal Jordanian", region: "gcc" },
  { code: "ME", name: "Middle East Airlines", region: "gcc" },
  { code: "IY", name: "Yemenia", region: "gcc" },
  { code: "IA", name: "Iraqi Airways", region: "gcc" },
  { code: "IF", name: "Fly Baghdad", region: "gcc" },
  { code: "RQ", name: "Kam Air", region: "gcc" },

  // ── Asia ────────────────────────────────────────────────────
  { code: "MH", name: "Malaysia Airlines", region: "asia" },
  { code: "OD", name: "Batik Air Malaysia", region: "asia" },
  { code: "D7", name: "AirAsia X", region: "asia" },
  { code: "SQ", name: "Singapore Airlines", region: "asia" },
  { code: "TG", name: "Thai Airways", region: "asia" },
  { code: "PR", name: "Philippine Airlines", region: "asia" },
  { code: "5J", name: "Cebu Pacific", region: "asia" },
  { code: "VN", name: "Vietnam Airlines", region: "asia" },
  { code: "BG", name: "Biman Bangladesh", region: "asia" },
  { code: "BS", name: "US-Bangla Airlines", region: "asia" },
  { code: "PK", name: "PIA Pakistan", region: "asia" },
  { code: "PA", name: "Airblue", region: "asia" },
  { code: "ER", name: "Serene Air", region: "asia" },
  { code: "PF", name: "AirSial", region: "asia" },
  { code: "AI", name: "Air India", region: "asia" },
  { code: "IX", name: "Air India Express", region: "asia" },
  { code: "6E", name: "IndiGo", region: "asia" },
  { code: "SG", name: "SpiceJet", region: "asia" },
  { code: "UL", name: "SriLankan Airlines", region: "asia" },
  { code: "RA", name: "Nepal Airlines", region: "asia" },
  { code: "H9", name: "Himalaya Airlines", region: "asia" },
  { code: "HY", name: "Uzbekistan Airways", region: "asia" },
  { code: "ZT", name: "Somon Air", region: "asia" },
  { code: "KC", name: "Air Astana", region: "asia" },
  { code: "T5", name: "Turkmenistan Airlines", region: "asia" },
  { code: "J2", name: "Azerbaijan Airlines", region: "asia" },

  // ── Afrika & Eropa ──────────────────────────────────────────
  { code: "MS", name: "EgyptAir", region: "africa-europe" },
  { code: "SM", name: "Air Cairo", region: "africa-europe" },
  { code: "NP", name: "Nile Air", region: "africa-europe" },
  { code: "UJ", name: "AlMasria Universal", region: "africa-europe" },
  { code: "AT", name: "Royal Air Maroc", region: "africa-europe" },
  { code: "TU", name: "Tunisair", region: "africa-europe" },
  { code: "AH", name: "Air Algérie", region: "africa-europe" },
  { code: "LN", name: "Libyan Airlines", region: "africa-europe" },
  { code: "8U", name: "Afriqiyah Airways", region: "africa-europe" },
  { code: "SD", name: "Sudan Airways", region: "africa-europe" },
  { code: "3T", name: "Tarco Air", region: "africa-europe" },
  { code: "J4", name: "Badr Airlines", region: "africa-europe" },
  { code: "ET", name: "Ethiopian Airlines", region: "africa-europe" },
  { code: "KQ", name: "Kenya Airways", region: "africa-europe" },
  { code: "WB", name: "RwandAir", region: "africa-europe" },
  { code: "TC", name: "Air Tanzania", region: "africa-europe" },
  { code: "UR", name: "Uganda Airlines", region: "africa-europe" },
  { code: "P4", name: "Air Peace", region: "africa-europe" },
  { code: "TK", name: "Turkish Airlines", region: "africa-europe" },
  { code: "PC", name: "Pegasus Airlines", region: "africa-europe" },
  { code: "VF", name: "AJet", region: "africa-europe" },
  { code: "BA", name: "British Airways", region: "africa-europe" },
  { code: "AF", name: "Air France", region: "africa-europe" },
  { code: "LH", name: "Lufthansa", region: "africa-europe" },
  { code: "AZ", name: "ITA Airways", region: "africa-europe" },
  { code: "A3", name: "Aegean Airlines", region: "africa-europe" },
  { code: "W6", name: "Wizz Air", region: "africa-europe" },
];

const isPng = (buf) =>
  buf && buf.length > 300 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;

async function tryFetch(url, timeoutMs = 15000) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return isPng(buf) ? buf : null;
  } catch {
    return null;
  }
}

async function download(code) {
  const kiwi = await tryFetch(`https://images.kiwi.com/airlines/64/${code}.png`);
  if (kiwi) return { buf: kiwi, src: "kiwi" };
  const airhex = await tryFetch(`https://content.airhex.com/content/logos/airlines_${code}_100_100_s.png`);
  if (airhex) return { buf: airhex, src: "airhex" };
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const ok = [];
  const failed = [];

  for (const a of AIRLINES) {
    const outPath = path.join(OUT_DIR, `${a.code}.png`);
    const res = await download(a.code);
    if (res) {
      await writeFile(outPath, res.buf);
      ok.push(a);
      console.log(`✔ ${a.code.padEnd(3)} ${a.name} (${res.src}, ${(res.buf.length / 1024).toFixed(1)} KB)`);
    } else {
      failed.push(a);
      console.log(`✘ ${a.code.padEnd(3)} ${a.name} — gagal dari kedua CDN`);
    }
  }

  // ── Generate src/lib/airlines.ts ────────────────────────────
  const byRegion = (r) => ok.filter((a) => a.region === r);
  const fmt = (list) =>
    list.map((a) => `  { code: "${a.code}", name: "${a.name}" },`).join("\n");

  const id = byRegion("id");
  const gcc = byRegion("gcc");
  const asia = byRegion("asia");
  const afe = byRegion("africa-europe");

  const ts = `/**
 * Data maskapai dunia yang melayani penerbangan ke Arab Saudi (JED · MED · RUH · DMM).
 * Dibangkitkan OTOMATIS oleh scripts/fetch-airline-logos.mjs — jangan edit manual.
 * Edit daftar di script, lalu jalankan: bun scripts/fetch-airline-logos.mjs
 *
 * Logo tersedia di /airlines/{code}.png (CDN: Kiwi.com / AirHex, latar transparan).
 */

export interface Airline {
  /** Kode IATA — sekaligus nama file logo di /airlines/ */
  code: string;
  name: string;
}

/** Maskapai Indonesia — kartu unggulan "Terbang Langsung dari Indonesia". */
export const AIRLINES_INDONESIA: Airline[] = [
${fmt(id)}
];

/** Timur Tengah & Teluk — baris marquee 1. */
export const AIRLINES_GCC: Airline[] = [
${fmt(gcc)}
];

/** Asia — baris marquee 2. */
export const AIRLINES_ASIA: Airline[] = [
${fmt(asia)}
];

/** Afrika & Eropa — baris marquee 3. */
export const AIRLINES_AFRICA_EUROPE: Airline[] = [
${fmt(afe)}
];

export const AIRLINES_ALL: Airline[] = [
  ...AIRLINES_INDONESIA,
  ...AIRLINES_GCC,
  ...AIRLINES_ASIA,
  ...AIRLINES_AFRICA_EUROPE,
];

export const AIRLINES_COUNT = AIRLINES_ALL.length;

/** Estimasi jumlah negara asal maskapai (untuk statistik sekti). */
export const AIRLINE_COUNTRIES = 45;

export function airlineLogo(code: string): string {
  return \`/airlines/\${code}.png\`;
}
`;

  await writeFile(TS_OUT, ts, "utf8");

  console.log("\n──────────────────────────────");
  console.log(`Berhasil : ${ok.length} logo → public/airlines/`);
  console.log(`Gagal    : ${failed.length}${failed.length ? " → " + failed.map((f) => f.code).join(", ") : ""}`);
  console.log(`Data TS  : src/lib/airlines.ts (id=${id.length}, gcc=${gcc.length}, asia=${asia.length}, africa-europe=${afe.length})`);
  if (!existsSync(TS_OUT)) process.exitCode = 1;
}

main();
