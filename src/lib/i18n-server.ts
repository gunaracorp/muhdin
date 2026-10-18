/**
 * i18n-server.ts — dukungan locale di lapisan API.
 * SERVER ONLY. View TIDAK perlu berubah utk konten DB: field langsung
 * digantikan versi terjemahan saat ?locale=en|ar (fallback: Indonesia).
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { translateBatch, SETTING_TRANSLATABLE, type TargetLocale } from "@/lib/translate-engine";

export function localeFromRequest(req: NextRequest): "id" | TargetLocale {
  const raw = req.nextUrl.searchParams.get("locale")?.toLowerCase();
  return raw === "en" || raw === "ar" ? raw : "id";
}

type ApplyArgs<T> = {
  entity: string;
  rows: T[];
  locale: "id" | TargetLocale;
  keyOf: (row: T) => string;
  fields: string[];
};

/** Terjemahan "lengket" agar lazy tidak dobel utk konten yang sama. */
const lazyInFlight = new Set<string>();

export async function applyEntityTranslations<T>(args: ApplyArgs<T>): Promise<T[]> {
  const { entity, rows, locale, keyOf, fields } = args;
  if (locale === "id" || rows.length === 0) return rows;

  // SiteSetting: hanya key pada allowlist yang boleh diterjemahkan
  // (identitas situs, email, telepon, sosmed tetap apa adanya).
  const eligible = entity === "SiteSetting" ? rows.filter((r) => SETTING_TRANSLATABLE.has(keyOf(r))) : rows;
  if (eligible.length === 0) return rows;
  const work = entity === "SiteSetting" ? eligible : rows;
  const keys = work.map(keyOf);
  const saved = await db.contentTranslation.findMany({
    where: { entity, locale, entityKey: { in: keys }, field: { in: fields } },
    select: { entityKey: true, field: true, value: true },
  });
  const map = new Map<string, string>();
  for (const s of saved) map.set(`${s.entityKey}::${s.field}`, s.value);

  // Kumpulkan yang belum ada → terjemahkan inline bila pendek (<300 char),
  // panjang cukup dikembalikan apa adanya (fallback Indonesia) + antrean lazy.
  const missing: { key: string; field: string; text: string }[] = [];
  for (const row of rows) {
    for (const field of fields) {
      const raw = (row as Record<string, unknown>)[field];
      if (typeof raw === "string" && raw.trim() && !map.has(`${keyOf(row)}::${field}`)) {
        missing.push({ key: keyOf(row), field, text: raw });
      }
    }
  }

  const short = missing.filter((m) => m.text.length <= 300).slice(0, 24);
  const long = missing.filter((m) => m.text.length > 300);

  if (short.length > 0) {
    try {
      const result = await translateBatch(
        short.map((m) => ({ key: `${m.key}::${m.field}`, text: m.text })),
        locale
      );
      for (const [k, v] of Object.entries(result)) map.set(k, v);
      await Promise.all(
        Object.entries(result).map(([k, v]) => {
          const [entityKey, field] = k.split("::");
          return db.contentTranslation
            .upsert({
              where: { entity_entityKey_locale_field: { entity, entityKey, locale, field } },
              create: { entity, entityKey, locale, field, value: v },
              update: { value: v },
            })
            .catch(() => undefined);
        })
      );
    } catch {
      /* biarkan fallback Indonesia */
    }
  }

  if (long.length > 0) {
    void (async () => {
      const todo = long.filter((m) => {
        const id = `${entity}:${locale}:${m.key}:${m.field}`;
        if (lazyInFlight.has(id)) return false;
        lazyInFlight.add(id);
        return true;
      });
      for (const m of todo) {
        try {
          const result = await translateBatch([{ key: `${m.key}::${m.field}`, text: m.text }], locale);
          const value = result[`${m.key}::${m.field}`];
          if (value) {
            await db.contentTranslation.upsert({
              where: { entity_entityKey_locale_field: { entity, entityKey: m.key, locale, field: m.field } },
              create: { entity, entityKey: m.key, locale, field: m.field, value },
              update: { value },
            }).catch(() => undefined);
          }
        } catch {
          /* gagal diam — fallback Indonesia */
        } finally {
          const id = `${entity}:${locale}:${m.key}:${m.field}`;
          setTimeout(() => lazyInFlight.delete(id), 60_000).unref?.();
        }
      }
    })();
  }

  // Terapkan ke salinan row (jangan mutasi hasil query Prisma)
  return rows.map((row) => {
    const clone = { ...(row as Record<string, unknown>) };
    let changed = false;
    for (const field of fields) {
      const translated = map.get(`${keyOf(row)}::${field}`);
      if (translated) {
        clone[field] = translated;
        changed = true;
      }
    }
    return (changed ? clone : (row as T)) as T;
  });
}
