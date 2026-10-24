import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, guardAdmin, parseIntOr } from "@/lib/api-helpers";

/** GET — log sinkronisasi (admin) ?limit */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const limit = parseIntOr(req.nextUrl.searchParams.get("limit"), 25);
  const logs = await db.nusukSyncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });
  return ok({ logs });
}
