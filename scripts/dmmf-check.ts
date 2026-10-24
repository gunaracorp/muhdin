import { Prisma } from "@prisma/client";
const input = (Prisma as any).MuthowifCreateInput;
console.log("MuthowifCreateInput keys:", Object.keys(input ?? {}).slice(0, 20));
const scalar = (Prisma as any).MuthowifUncheckedCreateInput;
console.log("Unchecked keys:", Object.keys(scalar ?? {}).slice(0, 20));
