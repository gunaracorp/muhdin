import { PrismaClient } from "@prisma/client";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };

/**
 * One-time, backup-first import from the repository's legacy SQLite DB into an
 * already-migrated, empty PostgreSQL database. Does not drop or truncate data.
 *
 * Env:
 *   SQLITE_SOURCE_URL=file:./db/custom.db (or the path to a backup SQLite file)
 *   DATABASE_URL=postgresql://... (target PostgreSQL; never commit credentials)
 *
 * All target writes run in one PostgreSQL transaction. A non-empty target is
 * rejected to avoid duplicate inserts or accidental overwrites.
 */
const sourceUrl = process.env.SQLITE_SOURCE_URL ?? "file:./db/custom.db";
const targetUrl = process.env.DATABASE_URL;

if (!targetUrl || !/^postgres(?:ql)?:\/\//i.test(targetUrl)) {
  throw new Error(
    "DATABASE_URL must be the target PostgreSQL URL. Keep the SQLite source in SQLITE_SOURCE_URL.",
  );
}

const source = new PrismaClient({ datasourceUrl: sourceUrl });
const target = postgres<Contract>({ contractJson, url: targetUrl });

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
  "Session",
] as const;

function sourceDelegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function normalizeForPostgres(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value,
    ]),
  );
}

async function main(): Promise<void> {
  const counts: Record<string, number> = {};
  const targetTables = target.orm.public as unknown as Record<string, TargetCollection>;

  // Read the SQLite snapshot without modifying it.
  const sourceRows: Record<string, Record<string, unknown>[]> = {};
  for (const model of modelNames) {
    const delegate = sourceTables[sourceDelegateName(model)];
    if (!delegate || typeof delegate.findMany !== "function") {
      throw new Error(`Legacy SQLite model delegate is missing: ${model}`);
    }
    sourceRows[model] = (await delegate.findMany()).map(normalizeForPostgres);
  }

  // Single transaction means either every table imports or none of them do.
  await target.transaction(async (tx) => {
    const txTables = tx.orm.public as unknown as Record<string, TargetCollection>;

    for (const model of modelNames) {
      const existing = await txTables[model].limit(1).all();
      if (existing.length > 0) {
        throw new Error(
          `Target table ${model} is not empty. Import stopped without intentionally deleting or overwriting anything. Use a new empty PostgreSQL database.`,
        );
      }
    }

    for (const model of modelNames) {
      const rows = sourceRows[model];
      const collection = txTables[model];
      for (let start = 0; start < rows.length; start += 250) {
        await collection.createAll(rows.slice(start, start + 250));
      }
      counts[model] = rows.length;
    }
  });

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log("SQLite → PostgreSQL import completed.");
  console.log(`Models imported: ${Object.keys(counts).length}`);
  console.log(`Rows imported: ${total}`);
  for (const [model, count] of Object.entries(counts)) {
    console.log(`  ${model}: ${count}`);
  }
}

try {
  await main();
} catch (error) {
  // Never log connection strings. The thrown error is limited to operation
  // context; provider errors can still be useful for diagnosis.
  console.error("SQLite → PostgreSQL import failed; target transaction was rolled back.");
  console.error(error instanceof Error ? error.message : "Unknown migration error");
  process.exitCode = 1;
} finally {
  await source.$disconnect();
  await target.close();
}
