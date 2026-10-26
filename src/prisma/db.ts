import "temporal-polyfill/full/global";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

/**
 * Prisma ORM 8 connection for PostgreSQL.
 *
 * Routes still importing "@/lib/db" are on the legacy client and have NOT yet
 * been migrated. Move each route to this client before removing the legacy
 * compatibility dependency.
 */
export const prisma8 = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});
