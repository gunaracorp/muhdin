import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const rows = await p.muthowif.findMany({ select: { id: true, memberId: true }, take: 1 });
  console.log("PROBE OK — memberId selectable, rows:", rows.length);
} catch (e) {
  console.log("PROBE FAIL:", (e as Error).message.slice(0, 200));
} finally {
  await p.$disconnect();
}
