/**
 * Task 34 — Sinkronisasi DB HIDUP dengan Whitepaper MUHDIN Edisi 1.0 (Sept 2026).
 *
 * Menjalankan ulang perubahan seed tanpa reseed penuh (konten CMS admin tetap aman):
 * 1. Artikel press release "Resmi Dilantik sebagai Operator Nusuk Indonesia"
 *    -> ditulis ulang sesuai framing Whitepaper (titik koordinasi akses, tanpa
 *       klaim pengangkatan resmi oleh pihak eksternal).
 * 2. Tutorial & FAQ: frasa klaim "Operator Nusuk Indonesia" -> bahasa aman 4.3
 *    ("titik koordinasi tunggal akses platform Nusuk").
 * 3. Menambahkan Whitepaper sebagai Resource publik di halaman Unduhan.
 *
 * Jalankan: bun scripts/task34-whitepaper-sync.ts
 */
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

process.env.DATABASE_URL ||= `file:${path.join(process.cwd(), "db", "custom.db")}`;
if (process.env.DATABASE_URL.startsWith("file:")) {
  const p = process.env.DATABASE_URL.slice("file:".length);
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  if (!existsSync(abs)) {
    console.error("DB tidak ditemukan di", abs);
    process.exit(1);
  }
}

const prisma = new PrismaClient();

const NEW_ARTICLE_TITLE =
  "MUHDIN Diposisikan sebagai Titik Koordinasi Akses Nusuk bagi Industri Ibadah";
const NEW_ARTICLE_EXCERPT =
  "Whitepaper MUHDIN Edisi 1.0 (September 2026) menegaskan posisi MUHDIN sebagai titik koordinasi tunggal akses platform Nusuk bagi industri penyelenggara ibadah Indonesia — mengubah kompetisi kacau menjadi kompetisi mutu.";
const NEW_ARTICLE_CONTENT = [
  "Jakarta — Masyarakat Umroh Haji Digital Nusantara (MUHDIN) menegaskan posisi strategisnya sebagai titik koordinasi tunggal akses platform Nusuk bagi industri penyelenggara ibadah Indonesia. Penegasan ini tertuang dalam Whitepaper MUHDIN Edisi 1.0 — September 2026, kertas kerja strategis yang disusun sebagai dasar konsultasi pemangku kepentingan.",
  "## Posisi: Asosiasi di Atas Asosiasi",
  "MUHDIN didesain bukan sebagai pesaing pelaku industri, melainkan lapisan federasi yang menaungi PPIU, PIHK, KBIHU, IPHI, dan penyelenggara travel wisata halal-ziarah. Sebagaimana IATA bagi industri penerbangan, MUHDIN menyediakan infrastruktur bersama, standar interoperabilitas, dan penjaminan mutu — sementara setiap anggota tetap menjalankan bisnisnya masing-masing dengan identitasnya sendiri.",
  "Ketua Ummu MUHDIN, H. Ahmad Syaiful Bahri, S.E., M.M., menyatakan bahwa posisi federasi ini adalah amanah sekaligus tanggung jawab besar. Selama ini industri ibadah kita terfragmentasi: ribuan penyelenggara bekerja sendiri-sendiri, standar tidak seragam, dan jamaah kerap menjadi pihak yang paling rentan. Melalui MUHDIN, kami membangun satu tata kelola yang membuat jamaah tenang dan pelaku usaha tumbuh.",
  "## Tiga Pilar Akses Kolektif",
  "Integrasi kolektif terhadap Nusuk melalui satu entitas asosiasi berpijak pada tiga pilar utama:",
  "1. **Integrasi sistem.** Akses pengurusan visa, verifikasi akomodasi berstandar Nusuk, dan manajemen jadwal ibadah termasuk akses Raudah melalui platform Nusuk (umrah.nusuk.sa dan hajj.nusuk.sa).",
  "2. **Sertifikasi SDM.** Tour leader dan mutawif bersertifikasi menjadi standar layanan, dengan penilaian kompetensi, bahasa, dan akhlak yang melibatkan umpan balik jamaah.",
  "3. **Perlindungan jamaah.** Transparansi harga, kontrak elektronik, escrow, dan takaful menjadi syarat keanggotaan untuk memastikan dana jamaah terlindungi.",
  "## Manfaat bagi Jamaah dan Industri",
  "Bagi jamaah, akses kolektif berarti kepastian: status visa dapat dipantau dari aplikasi, penerimaan di bandara Jeddah dan Madinah terkonfirmasi real time oleh command center, dan setiap tahap perjalanan — 13 tahap lengkap dari registrasi hingga oleh-oleh — memiliki aktor dan standar yang jelas. Bagi industri, daya tawar kolektif menghasilkan efisiensi biaya serta persaingan yang bergeser dari perang harga menuju perang mutu layanan.",
  "## Status Kesepakatan dan Peta Jalan",
  "Kesepakatan formal dengan pemangku kepentingan — termasuk MoU dengan Nusuk — merupakan deliverable Fase Fondasi (2026) sebagaimana peta jalan Whitepaper. Fase Integrasi (2027) menghadirkan onboarding gelombang pertama mitra, GPS tracking, dan command center 24/7. Fase Skala (2028) meluncurkan marketplace 13 ekosistem penuh dan modul kecerdasan data. Fase Keunggulan (2029-2030) menargetkan akreditasi mutu eksternal dan layanan lebih dari satu juta jamaah per tahun. Kemajuan kesepakatan akan dilaporkan secara transparan melalui kanal resmi MUHDIN.",
  "Sekretaris Jenderal Drs. H. Ridwan Kamil Hasyim menutup rangkaian penegasan dengan ajakan: undangan ini terbuka bagi seluruh penyelenggara yang bersedia tunduk pada standar. Semakin rapi barisannya, semakin tenang langkah jamaah. Bersama Melayani Tamu Allah.",
  "Whitepaper MUHDIN Edisi 1.0 dapat diperoleh melalui halaman Unduhan di muhdin.web.id. Informasi keanggotaan dan verifikasi penyelenggara tersedia pada kanal resmi MUHDIN atau email info@muhdin.web.id.",
].join("\n\n");

/** Pasangan [frasa lama, frasa baru] — urutan penting, spesifik dulu. */
const PHRASE_MAP: Array<[string, string]> = [
  [
    "asosiasi payung penyelenggara ibadah Indonesia yang berperan sebagai Operator Nusuk Indonesia.",
    "asosiasi payung penyelenggara ibadah Indonesia yang diposisikan sebagai titik koordinasi tunggal akses platform Nusuk.",
  ],
  [
    "yang berperan sebagai Operator Nusuk Indonesia. MUHDIN memayungi",
    "yang diposisikan sebagai titik koordinasi tunggal akses platform Nusuk bagi industri. MUHDIN memayungi",
  ],
  [
    "Sebagai Operator Nusuk Indonesia, MUHDIN menghubungkan seluruh anggotanya ke layanan Nusuk untuk",
    "Melalui program akses kolektif Nusuk, MUHDIN menghubungkan seluruh anggotanya ke layanan Nusuk untuk",
  ],
  [
    "kredibilitas MUHDIN sebagai Operator Nusuk Indonesia di mata",
    "kredibilitas MUHDIN sebagai titik koordinasi akses Nusuk di mata",
  ],
  [
    "integrasi resmi dengan Nusuk (visa, kuota, jadwal)",
    "program akses kolektif Nusuk (visa, kuota, jadwal)",
  ],
];

const FAQ_EXTRA =
  " Status kesepakatan formal mengikuti peta jalan Whitepaper dan dilaporkan transparan melalui kanal resmi MUHDIN.";

function replaceAll(text: string): { text: string; changed: boolean; touched: string[] } {
  let out = text;
  const touched: string[] = [];
  for (const [from, to] of PHRASE_MAP) {
    if (out.includes(from)) {
      out = out.split(from).join(to);
      touched.push(from.slice(0, 42) + "…");
    }
  }
  // Pelengkap FAQ "terintegrasi dengan Nusuk" — tambah kalimat status kesepakatan.
  if (out.startsWith("Melalui program akses kolektif Nusuk, MUHDIN menghubungkan") && !out.includes("peta jalan Whitepaper")) {
    out += FAQ_EXTRA;
    touched.push("+kalimat status kesepakatan");
  }
  return { text: out, changed: out !== text, touched };
}

async function main() {
  console.log("=== Task 34 — Sinkronisasi Whitepaper ke DB ===");

  // 1. Artikel press release -> rewrite
  const art = await prisma.article.updateMany({
    where: { title: "MUHDIN Resmi Dilantik sebagai Operator Nusuk Indonesia" },
    data: { title: NEW_ARTICLE_TITLE, excerpt: NEW_ARTICLE_EXCERPT, content: NEW_ARTICLE_CONTENT },
  });
  console.log(`1. Artikel press release ditulis ulang: ${art.count} record`);

  // 2. Tutorial
  const tutorials = await prisma.tutorial.findMany();
  let tCount = 0;
  for (const t of tutorials) {
    const { text, changed, touched } = replaceAll(t.content);
    if (changed) {
      await prisma.tutorial.update({ where: { id: t.id }, data: { content: text } });
      tCount++;
      console.log(`   tutorial "${t.title}": ${touched.join("; ")}`);
    }
  }
  console.log(`2. Tutorial diperbarui: ${tCount} dari ${tutorials.length}`);

  // 3. FAQ
  const faqs = await prisma.faq.findMany();
  let fCount = 0;
  for (const f of faqs) {
    const { text, changed, touched } = replaceAll(f.answer);
    if (changed) {
      await prisma.faq.update({ where: { id: f.id }, data: { answer: text } });
      fCount++;
      console.log(`   faq "${f.question}": ${touched.join("; ")}`);
    }
  }
  console.log(`3. FAQ diperbarui: ${fCount} dari ${faqs.length}`);

  // 4. Whitepaper sebagai Resource publik
  const existing = await prisma.resource.findFirst({
    where: { fileUrl: "/dokumen/whitepaper-muhdin-2026.pdf" },
  });
  if (existing) {
    await prisma.resource.update({
      where: { id: existing.id },
      data: { title: "Whitepaper MUHDIN — Edisi 1.0 (September 2026)", published: true },
    });
    console.log("4. Resource whitepaper sudah ada — diperbarui.");
  } else {
    await prisma.resource.create({
      data: {
        title: "Whitepaper MUHDIN — Edisi 1.0 (September 2026)",
        description:
          "Kertas kerja strategis MUHDIN: arsitektur 13 ekosistem layanan umroh-haji terintegrasi, lima mitra utama, enam pilar teknologi, model bisnis berakar akad syariah, dan peta jalan 2026-2030. Dokumen konsultasi pemangku kepentingan.",
        category: "Panduan",
        fileUrl: "/dokumen/whitepaper-muhdin-2026.pdf",
        fileType: "PDF",
        published: true,
      },
    });
    console.log("4. Resource whitepaper DITAMBAHKAN.");
  }

  // 5. Sisa klaim (informasional)
  const [leftArt, leftTut, leftFaq] = await Promise.all([
    prisma.article.count({ where: { content: { contains: "Operator Nusuk" } } }),
    prisma.tutorial.count({ where: { content: { contains: "Operator Nusuk" } } }),
    prisma.faq.count({ where: { answer: { contains: "Operator Nusuk" } } }),
  ]);
  console.log(`5. Sisa frasa "Operator Nusuk" — article: ${leftArt}, tutorial: ${leftTut}, faq: ${leftFaq}`);
  console.log("=== Sinkronisasi selesai. Bersama Melayani Tamu Allah. ===");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Sinkronisasi GAGAL:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
