import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";

/** Public verification endpoint — cek legalitas penyelenggara */
export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 3) return fail("Masukkan minimal 3 karakter nama penyelenggara atau nomor izin.");

    const matches = await db.member.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { licenseNo: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    const notFound = matches.length === 0;
    const allSuspended = !notFound && matches.every((m) => m.status === "SUSPENDED");

    return ok({
      query: q,
      found: !notFound,
      warning: allSuspended ? "Seluruh hasil ditemukan berstatus DITANGGUHKAN. Jangan bertransaksi." : null,
      results: matches,
    });
  } catch {
    return fail("Gagal memverifikasi.", 500);
  }
}
