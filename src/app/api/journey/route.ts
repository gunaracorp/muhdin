import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  try {
    const steps = await db.journeyStep.findMany({ orderBy: { step: "asc" } });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "JourneyStep",
      rows: steps,
      locale,
      keyOf: (s) => String(s.step),
      fields: ["title", "activity", "output"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat alur perjalanan.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const step = parseInt(body.step, 10);
    if (!body.title || Number.isNaN(step)) return fail("Tahap dan judul wajib diisi.");
    const created = await db.journeyStep.create({
      data: {
        step,
        title: String(body.title),
        activity: String(body.activity || ""),
        actor: String(body.actor || ""),
        output: String(body.output || ""),
        icon: String(body.icon || "circle"),
      },
    });
    return ok(created, 201);
  } catch {
    return fail("Gagal membuat tahap — nomor mungkin sudah dipakai.", 500);
  }
}
