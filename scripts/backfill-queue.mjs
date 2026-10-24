/**
 * Task 53 — Backfill nomor urut pendaftaran (queueNumber).
 *
 * Menomori semua baris MembershipApplication berdasarkan createdAt ASC
 * (urutan kedatangan sebenarnya). Aman dijalankan berulang: hanya baris
 * dengan queueNumber NULL yang diisi, nomor mulai dari (max terpakai + 1).
 *
 * Jalankan: bun scripts/backfill-queue.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const pending = await db.membershipApplication.findMany({
    where: { queueNumber: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (!pending.length) {
    console.log("Tidak ada baris tanpa queueNumber — selesai.");
    return;
  }

  const agg = await db.membershipApplication.aggregate({ _max: { queueNumber: true } });
  let next = (agg._max.queueNumber ?? 0) + 1;

  for (const row of pending) {
    await db.membershipApplication.update({
      where: { id: row.id },
      data: { queueNumber: next },
    });
    console.log(`#${next} → ${row.orgName} (${row.ticketCode || row.id})`);
    next++;
  }
  console.log(`Selesai — ${pending.length} baris diberi nomor urut.`);
}

main()
  .catch((e) => {
    console.error("Backfill gagal:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
