import { NextRequest } from "next/server";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { translationStatus, jobState, startBulkJob, ENTITY_NAMES, type TargetLocale } from "@/lib/translate-engine";

/** GET /api/translations — status cakupan terjemahan + progress job berjalan. */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const status = await translationStatus();
    return ok({ ...status, job: jobState(), entityNames: ENTITY_NAMES });
  } catch {
    return fail("Gagal membaca status terjemahan.", 500);
  }
}

/** POST /api/translations — mulai job terjemahan massal { locale: "en"|"ar", entities?: string[] }. */
export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const locale = body?.locale;
    if (locale !== "en" && locale !== "ar") return fail("Locale harus 'en' atau 'ar'.");

    const current = jobState();
    if (current.running) return ok({ started: false, job: current, message: "Job lain sedang berjalan." });

    let entities: string[] | undefined = body?.entities;
    if (Array.isArray(entities)) {
      entities = entities.filter((e: unknown): e is string => typeof e === "string" && ENTITY_NAMES.includes(e));
      if (entities.length === 0) entities = undefined;
    }

    const job = await startBulkJob(locale as TargetLocale, entities);
    return ok({ started: true, job });
  } catch {
    return fail("Gagal memulai terjemahan.", 500);
  }
}
