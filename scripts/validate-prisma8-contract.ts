import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };

// Validate the generated V8 contract against the exact PostgreSQL runtime
// package selected in package.json, without opening a database connection.
const contract = contractFromJson<Contract>(contractJson);

if (!contract) {
  throw new Error("Prisma ORM 8 runtime rejected the generated contract.");
}

console.log("Prisma ORM 8 runtime accepted the generated contract.");
