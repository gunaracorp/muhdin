/**
 * update-management.mjs — Susunan Pengurus MUHDIN resmi (Task 28).
 * Idempoten: aman dijalankan berulang (replace Management, upsert Bakorwil JABAR).
 * Jalankan: bun scripts/update-management.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Susunan pengurus inti — data resmi dari pengurus (Task 28). */
const PENGURUS = [
  {
    name: "Prof. Dr. Anwar Sanusi",
    position: "Pembina",
    order: 1,
    bio: "Memberikan arahan dan pembinaan keorganisasian serta nilai-nilai keislaman dalam perjalanan MUHDIN.",
  },
  {
    name: "KH. Qosim Saleh, Lc., M.Si.",
    position: "Penasehat",
    order: 2,
    bio: "Memberikan nasihat keagamaan dan strategis kepada kepengurusan MUHDIN.",
  },
  {
    name: "Drs. Arif Racman Hakim",
    position: "Ketua Umum",
    order: 3,
    bio: "Memimpin MUHDIN, menetapkan arah strategis, dan mewakili organisasi di tingkat nasional maupun internasional.",
  },
  {
    name: "Gugun Gunara",
    position: "Sekretaris Jenderal",
    order: 4,
    bio: "Menjalankan sekretariat, keanggotaan, dan tata kelola operasional MUHDIN.",
  },
  {
    name: "Jonaedi, M.Pd.",
    position: "BEMDUM",
    order: 5,
    bio: "Mengemban amanah kepengurusan MUHDIN sesuai AD/ART organisasi.",
  },
];

try {
  // ---------- 1. Ganti susunan pengurus ----------
  const removed = await db.management.deleteMany({});
  await db.management.createMany({ data: PENGURUS });

  // Bersihkan terjemahan lama (id lama tak lagi berlaku)
  await db.contentTranslation.deleteMany({ where: { entity: "Management" } });

  // ---------- 2. Selaraskan jaringan daerah dengan struktur resmi ----------
  // Struktur resmi: Pengurus Pusat → (penunjukan) → Bakorwil Provinsi → Bakorcab Kab/Kota.
  const jabar = await db.regionalBranch.findFirst({ where: { code: { in: ["BAKORWIL-JABAR", "DPD-JABAR"] } } });
  if (jabar) {
    await db.regionalBranch.update({
      where: { id: jabar.id },
      data: {
        name: "Badan Koordinator Wilayah Provinsi Jawa Barat",
        code: "BAKORWIL-JABAR",
        description:
          "Badan Koordinator Wilayah (Bakorwil) MUHDIN Provinsi Jawa Barat — mengoordinasi Bakorcab kabupaten/kota, keanggotaan, pembinaan penyelenggara, dan pelayanan jamaah di Jawa Barat. Dibentuk melalui penunjukan oleh Pengurus Pusat.",
      },
    });
    console.log("RegionalBranch JABAR diselaraskan → BAKORWIL-JABAR");
  } else {
    console.log("RegionalBranch JABAR tidak ditemukan (dilewati).");
  }

  // ---------- Verifikasi ----------
  const rows = await db.management.findMany({ orderBy: { order: "asc" } });
  console.log(`Management: -${removed.count} lama, +${rows.length} baru:`);
  for (const m of rows) console.log(`  ${m.order}. [${m.position}] ${m.name}`);

  console.log("✅ Susunan pengurus resmi MUHDIN terpasang.");
} catch (e) {
  console.error("❌ Gagal:", e.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
