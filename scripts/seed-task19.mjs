/**
 * Task 19 — Seed jaringan kepengurusan daerah (DPD & Branch Office).
 * Menambahkan DPD Jawa Barat + Branch Office MUHDIN JABAR.
 * Idempotent: cek duplikat berdasarkan code "DPD-JABAR" sebelum insert.
 *
 * Jalankan: bun scripts/seed-task19.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BRANCHES = [
  {
    code: "DPD-JABAR",
    name: "Dewan Pimpinan Daerah Jawa Barat",
    province: "Jawa Barat",
    city: "Tasikmalaya",
    officeName: "Branch Office MUHDIN JABAR",
    address:
      "Perumahan Andalusia Garden Cluster Granada No.11, Mangkubumi, Mangkubumi, Tasikmalaya, 46181, Jawa Barat, Indonesia",
    picName: "Tn. H. Muhammad Lutfi Azmi",
    picPhone: "+6281316516524",
    description:
      "Dewan Pimpinan Daerah MUHDIN Provinsi Jawa Barat — mengoordinasi keanggotaan, pembinaan penyelenggara, dan pelayanan jamaah di wilayah Jawa Barat.",
    published: true,
    order: 1,
  },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const b of BRANCHES) {
    const existing = await prisma.regionalBranch.findFirst({ where: { code: b.code } });
    if (existing) {
      skipped++;
      console.log(`⏭  Skip (sudah ada): ${b.name} [${b.code}]`);
      continue;
    }
    const row = await prisma.regionalBranch.create({ data: b });
    created++;
    console.log(`✅ Dibuat: ${row.name} [${row.code}] — PIC ${row.picName} (${row.picPhone})`);
  }
  const total = await prisma.regionalBranch.count();
  console.log(`\nRingkasan: ${created} dibuat, ${skipped} dilewati, total ${total} jaringan daerah.`);
}

main()
  .catch((e) => {
    console.error("Seed gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
