import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const r1 = await p.pilgrimReview.deleteMany({ where: { OR: [{ body: { contains: "E2E:" } }, { body: { contains: "Uji coba ulasan" } }, { body: { contains: "coba kartu palsu" } }] } });
const r2 = await p.jamaahDoc.deleteMany({ where: { OR: [{ docNo: { contains: "TEST" } }, { note: { contains: "uji e2e" } }, { note: { contains: "uji brankas" } }] } });
console.log("cleaned reviews:", r1.count, "| docs:", r2.count);
await p.$disconnect();
