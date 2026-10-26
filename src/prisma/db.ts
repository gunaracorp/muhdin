import "temporal-polyfill/full/global";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

/**
 * Prisma ORM 8 connection for PostgreSQL.
 *
 * Existing routes still importing "@/lib/db" use the Prisma 6 compatibility
 * client. Migrate those routes before removing the legacy client dependency.
 */
export const prisma8 = postgres({
  contract,
  url: process.env["DATABASE_URL"]!,
});
