/**
 * Task 19 — Jaringan kepengurusan daerah (DPD/DPC & Branch Office).
 * GET  : publik → hanya published, urut order; ?all=1 mengembalikan semua
 *        BILA peminta membawa sesi admin sah. Mendukung ?locale=en|ar
 *        (terjemahan konten via ContentTranslation — auto engine).
 * POST : Super Admin / Admin / Editor (+ jejak audit).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { localeFromRequest, applyEntityTranslations } from "@/lib/i18n-server";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    if (all) {
      const user = await requireAdmin();
      if (user) {
        const allRows = await db.regionalBranch.findMany({
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });
        return ok(allRows);
      }
    }
    const rows = await db.regionalBranch.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const locale = localeFromRequest(req);
    const localized = await applyEntityTranslations({
      entity: "RegionalBranch",
      rows,
      locale,
      keyOf: (b) => b.id,
      fields: ["name", "officeName", "address", "description"],
    });
    return ok(localized);
  } catch {
    return fail("Gagal memuat jaringan daerah.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) return fail("Nama kepengurusan daerah wajib diisi.");
    const item = await db.regionalBranch.create({
      data: {
        name,
        code: String(body.code || "").trim(),
        province: String(body.province || "").trim(),
        city: String(body.city || "").trim(),
        officeName: String(body.officeName || "").trim(),
        address: String(body.address || "").trim(),
        picName: String(body.picName || "").trim(),
        picPhone: String(body.picPhone || "").trim(),
        email: body.email ? String(body.email).trim() : null,
        description: body.description ? String(body.description) : null,
        order: parseInt(body.order, 10) || 99,
        published: body.published === undefined ? true : Boolean(body.published),
      },
    });
    void logAudit(req, { action: "CREATE", entity: "RegionalBranch", entityId: item.id, detail: name });
    return ok(item, 201);
  } catch {
    return fail("Gagal menambah jaringan daerah.", 500);
  }
}
