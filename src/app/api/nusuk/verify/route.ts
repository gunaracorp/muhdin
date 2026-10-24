import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";

/** GET — cek keaslian izin Nusuk secara publik ?no=NSK-VSA-2026-xxxxxx */
export async function GET(req: NextRequest) {
  const no = (req.nextUrl.searchParams.get("no") ?? "").trim().toUpperCase();
  if (!no) return fail("Nomor izin wajib diisi.", 400);
  if (!/^NSK-[A-Z]{3}-\d{4}-\d{4,8}$/.test(no)) {
    return fail("Format nomor izin tidak valid. Contoh: NSK-VSA-2026-482913", 422);
  }

  const permit = await db.nusukPermit.findUnique({
    where: { permitNo: no },
    include: {
      member: { select: { name: true, type: true, city: true, licenseNo: true, status: true } },
    },
  });

  if (!permit) {
    return fail("Izin tidak ditemukan dalam registri Nusuk-MUHDIN.", 404);
  }

  const now = new Date();
  const stillValid = permit.status === "ACTIVE" && permit.expiresAt > now;
  const effectiveStatus = permit.status === "ACTIVE" && !stillValid ? "EXPIRED" : permit.status;

  return ok({
    permit: {
      permitNo: permit.permitNo,
      type: permit.type,
      holderName: permit.holderName,
      status: effectiveStatus,
      meta: permit.meta,
      issuedAt: permit.issuedAt,
      expiresAt: permit.expiresAt,
      lastSync: permit.syncedAt,
    },
    member: permit.member,
    checkedAt: now.toISOString(),
    environment: "NUSUK SANDBOX REGISTRY",
  });
}
