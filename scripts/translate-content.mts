/**
 * translate-content.mts — CLI bulk terjemahan seluruh konten DB (EN + AR).
 * Jalankan: bun scripts/translate-content.mts [en|ar|all]
 * Log progres ke stdout; idempoten (aman diulang).
 */
import { translateEntity, ENTITY_NAMES, translationStatus, type TargetLocale } from "../src/lib/translate-engine";

const arg = (process.argv[2] || "all").toLowerCase();
const locales: TargetLocale[] = arg === "en" || arg === "ar" ? [arg] : ["en", "ar"];

console.log(`[translate] mulai — locale: ${locales.join(", ")}`);
const t0 = Date.now();

for (const locale of locales) {
  for (const entity of ENTITY_NAMES) {
    const ts = Date.now();
    try {
      const res = await translateEntity(entity, locale);
      console.log(`[translate] ${locale}/${entity}: +${res.translated} diterjemahkan, ${res.failed} gagal (${((Date.now() - ts) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.error(`[translate] ${locale}/${entity} ERROR: ${(e as Error).message}`);
    }
  }
}

const status = await translationStatus();
console.log("\n[translate] STATUS AKHIR:");
for (const e of status.entities) {
  console.log(`  ${e.entity.padEnd(12)} total=${String(e.total).padStart(4)}  en=${String(e.translated.en).padStart(4)}  ar=${String(e.translated.ar).padStart(4)}`);
}
console.log(`[translate] SELESAI dalam ${((Date.now() - t0) / 1000).toFixed(0)}s`);
process.exit(0);
