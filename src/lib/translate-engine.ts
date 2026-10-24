/**
 * ============================================================================
 * translate-engine.ts — Mesin terjemahan konten database (EN/AR) via AI.
 * SERVER ONLY — dipakai oleh API routes, CMS "Penerjemah Cerdas", dan CLI.
 * ----------------------------------------------------------------------------
 * Pola: entity + entityKey(id/slug) + field → ContentTranslation (cache DB).
 * Idempoten: yang sudah diterjemahkan tidak diulang.
 * ============================================================================
 */
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export type TargetLocale = "en" | "ar";

const GLOSSARY = [
  "MUHDIN (nama organisasi — jangan diterjemahkan)",
  "Nusuk (platform Kementerian Hajj & Umrah KSA — jangan diterjemahkan)",
  "PPIU, PIHK, KBIHU, IPHI (singkatan lembaga — biarkan)",
  "Umroh/Umrah, Haji, Tamu Allah, Jamaah, Mutawif, Raudah, Manasik, Maktab, Haramain",
  "nama kota/provinsi Indonesia (Jakarta, Surabaya, dll) tetap ejaan aslinya",
];

const SYSTEM_PROMPT = [
  "You are a professional translator specializing in Hajj & Umrah services (Indonesian → English / Arabic).",
  `Glossary & rules: ${GLOSSARY.join("; ")}.`,
  "Translate naturally for a formal, warm, respectful Islamic tone.",
  "Preserve Markdown syntax (#, ##, -, **, tables, code) and URLs/numbers/emails exactly.",
  "Return ONLY a valid JSON object mapping the EXACT same keys to translated strings. No commentary.",
].join(" ");

type BatchItem = { key: string; text: string };

let zaiPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null;
async function getZAI() {
  if (!zaiPromise) zaiPromise = ZAI.create();
  return zaiPromise;
}

/** Terjemahkan satu batch (JSON in → JSON out) dengan timeout & retry. */
export async function translateBatch(items: BatchItem[], target: TargetLocale): Promise<Record<string, string>> {
  if (items.length === 0) return {};
  const payload = Object.fromEntries(items.map((i) => [i.key, i.text]));
  const langName =
    target === "ar"
      ? "Arabic (Modern Standard, formal, natural — do NOT add diacritics/tashkeel)"
      : "English (international, formal)";
  const userMsg =
    `Translate the values of this JSON object from Indonesian to ${langName}.\n` +
    `Keys must stay identical. Return ONLY the JSON object.\n\n${JSON.stringify(payload)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const zai = await getZAI();
      const completion = (await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: SYSTEM_PROMPT },
            { role: "user", content: userMsg },
          ],
          thinking: { type: "disabled" },
        }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout 120s")), 120_000)),
      ])) as Awaited<ReturnType<typeof zai.chat.completions.create>>;

      const raw = completion.choices[0]?.message?.content?.trim() || "";
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const item of items) {
        const v = parsed[item.key];
        if (typeof v === "string" && v.trim().length > 0) out[item.key] = v.trim();
      }
      if (Object.keys(out).length > 0) return out;
      throw new Error("empty translation result");
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return {};
}

async function upsertTranslation(entity: string, entityKey: string, locale: string, field: string, value: string) {
  await db.contentTranslation.upsert({
    where: {
      entity_entityKey_locale_field: { entity, entityKey, locale, field },
    },
    create: { entity, entityKey, locale, field, value, engine: "ai" },
    update: { value, engine: "ai" },
  });
}

/** Bagi item menjadi chunk ±1200 karakter (maks 10 item). */
function chunkItems(items: BatchItem[]): BatchItem[][] {
  const chunks: BatchItem[][] = [];
  let cur: BatchItem[] = [];
  let size = 0;
  for (const it of items) {
    if (cur.length >= 10 || (size + it.text.length > 1200 && cur.length > 0)) {
      chunks.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(it);
    size += it.text.length;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

/* ---------------------------------------------------------------------------
 * REGISTRY — entitas konten yang dapat diterjemahkan
 * ------------------------------------------------------------------------- */

export type EntitySpec = {
  entity: string;
  fields: string[];
  load: () => Promise<{ key: string; values: Record<string, string | null> }[]>;
};

// Key SiteSetting yang layak diterjemahkan (identitas/kontak/sosmed DIKECUALIKAN)
export const SETTING_TRANSLATABLE = new Set([
  "heroTitle", "heroSubtitle", "vision", "mission", "tagline",
  "nusuk_tagline", "nusuk_desc", "nusuk_api_note",
]);

export const ENTITY_REGISTRY: Record<string, EntitySpec> = {
  Article: {
    entity: "Article",
    fields: ["title", "excerpt", "content"],
    load: async () =>
      (await db.article.findMany({ select: { slug: true, title: true, excerpt: true, content: true } })).map((a) => ({
        key: a.slug,
        values: { title: a.title, excerpt: a.excerpt, content: a.content },
      })),
  },
  Tutorial: {
    entity: "Tutorial",
    fields: ["title", "summary", "content"],
    load: async () =>
      (await db.tutorial.findMany({ select: { slug: true, title: true, summary: true, content: true } })).map((t) => ({
        key: t.slug,
        values: { title: t.title, summary: t.summary, content: t.content },
      })),
  },
  Ecosystem: {
    entity: "Ecosystem",
    fields: ["name", "scope", "standard", "description"],
    load: async () =>
      (await db.ecosystem.findMany({ select: { number: true, name: true, scope: true, standard: true, description: true } })).map(
        (e) => ({ key: String(e.number), values: { name: e.name, scope: e.scope, standard: e.standard, description: e.description } })
      ),
  },
  JourneyStep: {
    entity: "JourneyStep",
    fields: ["title", "activity", "output"],
    load: async () =>
      (await db.journeyStep.findMany({ select: { step: true, title: true, activity: true, output: true } })).map((j) => ({
        key: String(j.step),
        values: { title: j.title, activity: j.activity, output: j.output },
      })),
  },
  Roadmap: {
    entity: "Roadmap",
    fields: ["phase", "focus", "deliverables"],
    load: async () =>
      (await db.roadmap.findMany({ select: { id: true, phase: true, focus: true, deliverables: true } })).map((r) => ({
        key: r.id,
        values: { phase: r.phase, focus: r.focus, deliverables: r.deliverables },
      })),
  },
  Member: {
    entity: "Member",
    fields: ["description"],
    load: async () =>
      (await db.member.findMany({ select: { id: true, description: true } })).map((m) => ({
        key: m.id,
        values: { description: m.description },
      })),
  },
  Faq: {
    entity: "Faq",
    fields: ["question", "answer"],
    load: async () =>
      (await db.faq.findMany({ select: { id: true, question: true, answer: true } })).map((f) => ({
        key: f.id,
        values: { question: f.question, answer: f.answer },
      })),
  },
  Testimonial: {
    entity: "Testimonial",
    fields: ["role", "content"],
    load: async () =>
      (await db.testimonial.findMany({ select: { id: true, role: true, content: true } })).map((t) => ({
        key: t.id,
        values: { role: t.role, content: t.content },
      })),
  },
  Management: {
    entity: "Management",
    fields: ["position", "bio"],
    load: async () =>
      (await db.management.findMany({ select: { id: true, position: true, bio: true } })).map((m) => ({
        key: m.id,
        values: { position: m.position, bio: m.bio },
      })),
  },
  SiteSetting: {
    entity: "SiteSetting",
    fields: ["value"],
    load: async () =>
      (await db.siteSetting.findMany({ where: { key: { in: Array.from(SETTING_TRANSLATABLE) } } })).map((s) => ({
        key: s.key,
        values: { value: s.value },
      })),
  },
};

export const ENTITY_NAMES = Object.keys(ENTITY_REGISTRY);

/* ---------------------------------------------------------------------------
 * Terjemahkan satu entitas utk satu locale (hanya yang belum ada)
 * ------------------------------------------------------------------------- */

export async function translateEntity(
  entityName: string,
  locale: TargetLocale,
  onProgress?: (done: number, total: number) => void
): Promise<{ translated: number; failed: number }> {
  const spec = ENTITY_REGISTRY[entityName];
  if (!spec) throw new Error(`Entity tidak dikenal: ${entityName}`);

  const rows = await spec.load();
  const existing = await db.contentTranslation.findMany({
    where: { entity: entityName, locale, field: { in: spec.fields } },
    select: { entityKey: true, field: true },
  });
  const have = new Set(existing.map((x) => `${x.entityKey}::${x.field}`));

  const items: BatchItem[] = [];
  for (const row of rows) {
    for (const field of spec.fields) {
      const text = row.values[field];
      if (typeof text === "string" && text.trim().length > 0 && !have.has(`${row.key}::${field}`)) {
        items.push({ key: `${row.key}::${field}`, text });
      }
    }
  }

  const chunks = chunkItems(items);
  let translated = 0;
  let failed = 0;
  let done = 0;

  // Paralelisme ringan: 2 pekerja + jeda antar-chunk (ramah rate-limit AI)
  const queue = [...chunks];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const worker = async (delayMs: number) => {
    await sleep(delayMs);
    while (queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) break;
      try {
        const result = await translateBatch(chunk, locale);
        await Promise.all(
          chunk.map(async (item) => {
            const value = result[item.key];
            if (!value) return;
            const [entityKey, field] = item.key.split("::");
            await upsertTranslation(entityName, entityKey, locale, field, value);
          })
        );
        translated += Object.keys(result).length;
        failed += chunk.length - Object.keys(result).length;
      } catch {
        failed += chunk.length;
      }
      done += chunk.length;
      onProgress?.(done, items.length);
      await sleep(1200);
    }
  };
  await Promise.all([worker(0), worker(600)]);

  return { translated, failed };
}

/* ---------------------------------------------------------------------------
 * Status cakupan terjemahan (untuk CMS)
 * ------------------------------------------------------------------------- */

export async function translationStatus() {
  const entities: { entity: string; total: number; translated: Record<string, number> }[] = [];
  for (const name of ENTITY_NAMES) {
    const spec = ENTITY_REGISTRY[name];
    const rows = await spec.load();
    let total = 0;
    for (const row of rows) {
      for (const f of spec.fields) {
        const v = row.values[f];
        if (typeof v === "string" && v.trim()) total += 1;
      }
    }
    const counts: Record<string, number> = { en: 0, ar: 0 };
    const rows2 = await db.contentTranslation.groupBy({
      by: ["locale"],
      where: { entity: name },
      _count: { _all: true },
    });
    for (const r of rows2) counts[r.locale] = r._count._all;
    entities.push({ entity: name, total, translated: counts });
  }
  return { entities, locales: ["en", "ar"] };
}

/* ---------------------------------------------------------------------------
 * Job bulk berjalan di memori (satu job pada satu waktu)
 * ------------------------------------------------------------------------- */

type JobState = {
  running: boolean;
  locale: TargetLocale | null;
  entity: string | null;
  entityIndex: number;
  entityTotal: number;
  entityDone: number;
  done: number;
  total: number;
  translated: number;
  failed: number;
  errors: string[];
  startedAt: string | null;
  finishedAt: string | null;
};

const job: JobState = {
  running: false, locale: null, entity: null, entityIndex: 0, entityTotal: 0, entityDone: 0,
  done: 0, total: 0, translated: 0, failed: 0, errors: [], startedAt: null, finishedAt: null,
};

export function jobState(): JobState {
  return { ...job };
}

export async function startBulkJob(locale: TargetLocale, entities?: string[]): Promise<JobState> {
  if (job.running) return jobState();
  const list = (entities && entities.length ? entities : ENTITY_NAMES).filter((e) => ENTITY_REGISTRY[e]);
  job.running = true;
  job.locale = locale;
  job.entity = null;
  job.entityIndex = 0;
  job.entityTotal = list.length;
  job.entityDone = 0;
  job.done = 0;
  job.total = 0;
  job.translated = 0;
  job.failed = 0;
  job.errors = [];
  job.startedAt = new Date().toISOString();
  job.finishedAt = null;

  void (async () => {
    try {
      for (const name of list) {
        job.entity = name;
        job.entityIndex += 1;
        job.entityDone = 0;
        try {
          const res = await translateEntity(name, locale, (done, total) => {
            job.done = done;
            job.total = total;
            job.entityDone = done;
          });
          job.translated += res.translated;
          job.failed += res.failed;
        } catch (e) {
          job.errors.push(`${name}: ${(e as Error).message}`);
        }
      }
    } finally {
      job.running = false;
      job.finishedAt = new Date().toISOString();
    }
  })();

  return jobState();
}
