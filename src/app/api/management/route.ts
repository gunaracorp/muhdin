import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  try {
    const items = await db.management.findMany({ orderBy: { order: "asc" } });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "Management",
      rows: items,
      locale,
      keyOf: (m) => m.id,
      fields: ["position", "bio"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat struktur organisasi.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body.name || !body.position) return fail("Nama dan jabatan wajib diisi.");
    const item = await db.management.create({
      data: {
        name: String(body.name),
        position: String(body.position),
        bio: body.bio ? String(body.bio) : null,
        order: parseInt(body.order, 10) || 99,
      },
    });
    return ok(item, 201);
  } catch {
    return fail("Gagal menambah pengurus.", 500);
  }
}
