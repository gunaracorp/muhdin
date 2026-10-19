import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Task 52 (P0) — Widget Badge Verifikasi (publik, lintas domain).
 *
 * GET /api/widget/verify?q=<nomor izin | nama>
 *   → { found, member?, checkedAt }  (field minimal, tanpa kontak pribadi)
 *
 * CORS terbuka (Access-Control-Allow-Origin: *) karena badge dipasang di
 * website anggota (domain berbeda). Hanya GET/OPTIONS; field yang diekspos
 * dibatasi sengaja: name, type, city, province, licenseNo, status,
 * memberSince — TANPA phone/email/website (minimasi data UU PDP).
 */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 3) {
      return NextResponse.json(
        { found: false, error: "QUERY_TOO_SHORT", checkedAt: new Date().toISOString() },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Prioritas: kecocokan nomor izin persis (case-insensitive), lalu nama.
    const byLicense = await db.member.findFirst({
      where: { licenseNo: { equals: q } },
    });
    const member =
      byLicense ??
      (await db.member.findFirst({
        where: { OR: [{ licenseNo: { contains: q } }, { name: { contains: q } }] },
        orderBy: { status: "asc" },
      }));

    return NextResponse.json(
      {
        found: Boolean(member),
        member: member
          ? {
              name: member.name,
              type: member.type,
              city: member.city,
              province: member.province,
              licenseNo: member.licenseNo,
              status: member.status,
              memberSince: member.memberSince,
              rating: member.rating,
            }
          : null,
        checkedAt: new Date().toISOString(),
      },
      { status: 200, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { found: false, error: "SERVER_ERROR", checkedAt: new Date().toISOString() },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
