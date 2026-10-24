import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, guardAdmin, parseIntOr } from "@/lib/api-helpers";

/** GET — daftar izin Nusuk (admin) ?status&type&q&page&pageSize */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "";
  const type = sp.get("type") ?? "";
  const q = (sp.get("q") ?? "").trim();
  const page = parseIntOr(sp.get("page"), 1);
  const pageSize = Math.min(parseIntOr(sp.get("pageSize"), 10), 50);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (q) {
    where.OR = [
      { permitNo: { contains: q.toUpperCase() } },
      { holderName: { contains: q } },
      { member: { is: { name: { contains: q } } } },
    ];
  }

  const [total, permits] = await Promise.all([
    db.nusukPermit.count({ where }),
    db.nusukPermit.findMany({
      where,
      include: { member: { select: { id: true, name: true, type: true, city: true, licenseNo: true } } },
      orderBy: { syncedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok({ permits, total, page, pageSize, pages: Math.ceil(total / pageSize) });
}
