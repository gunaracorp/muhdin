import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import { ensureConnection, computeMetrics } from "@/lib/nusuk-engine";

/** GET — data publik untuk Nusuk Hub (tanpa kredensial) */
export async function GET() {
  const conn = await ensureConnection();
  const [metrics, ecosystems, recentLogs, permitGroup] = await Promise.all([
    computeMetrics(),
    db.ecosystem.findMany({
      orderBy: { number: "asc" },
      select: { number: true, name: true, icon: true, cluster: true },
    }),
    db.nusukSyncLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.nusukPermit.groupBy({ by: ["memberId", "status"], _count: true }),
  ]);

  const memberMap = new Map<string, { active: number; total: number }>();
  for (const g of permitGroup) {
    const cur = memberMap.get(g.memberId) ?? { active: 0, total: 0 };
    cur.total += g._count;
    if (g.status === "ACTIVE") cur.active += g._count;
    memberMap.set(g.memberId, cur);
  }
  const memberIds = [...memberMap.entries()].filter(([, v]) => v.active > 0).map(([k]) => k);
  const members = await db.member.findMany({
    where: { id: { in: memberIds }, status: "TERVERIFIKASI" },
    select: { id: true, name: true, type: true, city: true, rating: true },
  });

  const topMembers = members
    .map((m) => {
      const stat = memberMap.get(m.id) ?? { active: 0, total: 1 };
      return {
        id: m.id,
        name: m.name,
        type: m.type,
        city: m.city,
        activePermits: stat.active,
        compliance: Math.round((stat.active / Math.max(1, stat.total)) * 100),
        rating: m.rating,
      };
    })
    .sort((a, b) => b.activePermits - a.activePermits)
    .slice(0, 6);

  return ok({
    connection: {
      status: conn.status,
      environment: conn.environment,
      lastSyncAt: conn.lastSyncAt,
      totalSyncs: conn.totalSyncs,
      autoSync: conn.autoSync,
    },
    metrics,
    ecosystems,
    recentLogs,
    topMembers,
  });
}
