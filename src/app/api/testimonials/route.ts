import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    const testimonials = await db.testimonial.findMany({
      where: all ? {} : { published: true },
      orderBy: { createdAt: "desc" },
    });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "Testimonial",
      rows: testimonials,
      locale,
      keyOf: (t) => t.id,
      fields: ["role", "content"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat testimoni.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.content) return fail("Nama dan isi testimoni wajib diisi.");
    // Testimoni publik masuk sebagai unpublished untuk dimoderasi admin
    const t = await db.testimonial.create({
      data: {
        name: String(body.name),
        role: String(body.role || "Jamaah"),
        content: String(body.content),
        rating: parseInt(body.rating, 10) || 5,
        published: false,
      },
    });
    return ok(t, 201);
  } catch {
    return fail("Gagal mengirim testimoni.", 500);
  }
}
