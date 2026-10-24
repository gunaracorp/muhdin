import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  try {
    const items = await db.roadmap.findMany({ orderBy: { order: "asc" } });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "Roadmap",
      rows: items,
      locale,
      keyOf: (r) => r.id,
      fields: ["phase", "focus", "deliverables"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat roadmap.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const item = await db.roadmap.create({
      data: {
        phase: String(body.phase || "Fase"),
        period: String(body.period || ""),
        focus: String(body.focus || ""),
        deliverables: String(body.deliverables || ""),
        order: parseInt(body.order, 10) || 99,
      },
    });
    return ok(item, 201);
  } catch {
    return fail("Gagal membuat fase roadmap.", 500);
  }
}
