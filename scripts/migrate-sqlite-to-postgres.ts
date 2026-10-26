import { Temporal } from "temporal-polyfill";
import { PrismaClient } from "@prisma/client";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };

/**
 * One-time, backup-first import from the repository's legacy SQLite DB into an
 * already-migrated, empty PostgreSQL database. This never drops/truncates data.
 *
 * SQLITE_SOURCE_URL=file:./db/custom.db
 * DATABASE_URL=postgresql://... (target database; never commit credentials)
 *
 * Target rows are inserted atomically in a transaction. The target must be
 * empty; use a fresh PostgreSQL database to avoid duplicate inserts/overwrites.
 */
const sourceUrl = process.env.SQLITE_SOURCE_URL ?? "file:./db/custom.db";
const targetUrl = process.env.DATABASE_URL;

if (!targetUrl || !/^postgres(?:ql)?:\/\//i.test(targetUrl)) {
  throw new Error("DATABASE_URL must be the target PostgreSQL URL.");
}

const source = new PrismaClient({ datasourceUrl: sourceUrl });
const contract = contractFromJson<Contract>(contractJson);
const target = postgres({ contract, url: targetUrl });

type SourceDelegate = {
  findMany: () => Promise<Record<string, unknown>[]>;
};

type TargetCollection = {
  limit: (count: number) => { all: () => Promise<unknown[]> };
  createAll: (rows: Record<string, unknown>[]) => Promise<unknown[]>;
};

const sourceTables = source as unknown as Record<string, SourceDelegate>;
const modelNames = [
  "User",
  "Session",
  "Article",
  "Ecosystem",
  "JourneyStep",
  "Roadmap",
  "Member",
  "MembershipApplication",
  "Tutorial",
  "ContactMessage",
  "Faq",
  "Testimonial",
  "Management",
  "RegionalBranch",
  "SiteSetting",
  "NusukConnection",
  "NusukPermit",
  "NusukSyncLog",
  "ContentTranslation",
  "WhatsAppSetting",
  "EmailSetting",
  "NotificationLog",
  "Gallery",
  "Event",
  "Resource",
  "Subscriber",
  "Complaint",
  "AuditLog",
] as const;

function sourceDelegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function normalizeForPostgres(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      value instanceof Date ? Temporal.Instant.from(value.toISOString()) : value,
    ]),
  );
}

async function main(): Promise<void> {
  const sourceRows: Record<string, Record<string, unknown>[]> = {};

  // Fully read the SQLite source before writing anything to PostgreSQL.
  for (const model of modelNames) {
    const delegate = sourceTables[sourceDelegateName(model)];
    if (!delegate || typeof delegate.findMany !== "function") {
      throw new Error(`Legacy SQLite delegate missing for model: ${model}`);
    }
    sourceRows[model] = (await delegate.findMany()).map(normalizeForPostgres);
  }

  const counts: Record<string, number> = {};
  await target.transaction(async (tx) => {
    const tables = tx.orm.public as unknown as Record<string, TargetCollection>;

    // Refuse to mix with any existing rows; never automatically wipe target.
    for (const model of modelNames) {
      if ((await tables[model].limit(1).all()).length > 0) {
        throw new Error(`Target table ${model} is not empty. Import aborted.`);
      }
    }

    // Insert parent rows before dependent rows to respect relations.
    for (const model of modelNames) {
      const rows = sourceRows[model];
      for (let offset = 0; offset < rows.length; offset += 250) {
        await tables[model].createAll(rows.slice(offset, offset + 250));
      }
      counts[model] = rows.length;
    }
  });

  console.log("SQLite → PostgreSQL import completed.");
  console.log(`Models imported: ${Object.keys(counts).length}`);
  console.log(`Rows imported: ${Object.values(counts).reduce((sum, value) => sum + value, 0)}`);
  for (const [model, count] of Object.entries(counts)) console.log(`  ${model}: ${count}`);
}

try {
  await main();
} catch (error) {
  console.error("SQLite → PostgreSQL import failed; the PostgreSQL transaction was rolled back.");
  console.error(error instanceof Error ? error.message : "Unknown migration error");
  process.exitCode = 1;
} finally {
  await source.$disconnect();
  await target.close();
}
