/**
 * Task 23 — Seed BERITA RESMI dari nusuk.sa, haj.gov.sa, GASTAT & Kemenag RI.
 * Meng-hidupkan halaman Berita dengan rilis resmi terkini (riset web nyata).
 * Idempotent: upsert berdasarkan slug unik.
 *
 * Jalankan: bun scripts/seed-task23.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ARTICLES = [
  {
    slug: "nusuk-masar-124-juta-visa-umrah-diterbitkan",
    title: "Kementerian Hajj & Umrah: 12,4 Juta Visa Umrah Diterbitkan via Platform Nusuk Masar",
    excerpt:
      "Transformasi digital Kerajaan Saudi kian nyata — platform Nusuk Masar resmi mencatat lebih dari 12,4 juta visa Umrah diterbitkan, membawa kemudahan izin bagi jutaan Tamu Allah.",
    category: "Berita",
    featured: true,
    content: `## 12,4 Juta Visa Umrah melalui Nusuk Masar

Kementerian Hajj dan Umrah Kerajaan Saudi Arabia mengumumkan capaian transformasi digital terbarunya: **lebih dari 12,4 juta visa Umrah telah diterbitkan melalui platform Nusuk Masar**.

Nusuk Masar (مسار نسك) menghadirkan lompatan kualitatif dalam pelayanan dengan fleksibilitas dan kecepatan lebih tinggi — alat inovatif untuk mengelola pemesanan, menerbitkan visa, dan memantau perjalanan Tamu Allah dari satu pintu.

## Makna bagi Penyelenggara Indonesia

- **Kepastian izin**: visa diterbitkan digital dengan status terlacak.
- **Satu pintu**: pemesanan paket, akomodasi, dan transportasi menyatu dengan izin.
- **Integrasi ekosistem**: penyelenggara terverifikasi MUHDIN tersambung langsung ke alur Nusuk.

> MUHDIN terus mengawal integrasi ini agar seluruh kanal yang terverifikasi menikmati kemudahan penerbitan visa yang sama — cepat, sah, dan transparan.

*Sumber: rilis resmi Kementerian Hajj & Umrah KSA (haj.gov.sa) · SPA.*`,
  },
  {
    slug: "aplikasi-nusuk-lampaui-40-juta-pengguna",
    title: "Aplikasi Nusuk Resmi Lampaui 40 Juta Pengguna di Seluruh Dunia",
    excerpt:
      "Aplikasi resmi Kementerian Hajj & Umrah kini dipercaya lebih dari 40 juta pengguna — satu gerbang ibadah untuk visa, izin Umrah, Rawdah Syarifah, hingga panduan perjalanan.",
    category: "Berita",
    featured: true,
    content: `## 40 Juta+ Pengguna dan Terus Bertumbuh

Aplikasi **Nusuk** — platform resmi tunggal Kementerian Hajj dan Umrah Kerajaan Saudi Arabia — resmi melampaui **40 juta pengguna**.

Sebagai aplikasi pemerintah terdaftar pada Otoritas Pemerintah Digital (DGA) Kerajaan Arab Saudi, Nusuk menempatkan seluruh kebutuhan Tamu Allah dalam satu aplikasi:

1. **Visa & Nusuk Masar** — penerbitan visa digital.
2. **Izin Umrah** — permit per tanggal dan jam.
3. **Izin Rawdah Syarifah** — slot shalat di "sebuah taman dari taman-taman surga".
4. **Paket Haji & Umrah** — penerbangan, akomodasi Makkah–Madinah, katering, transportasi.
5. **Transportasi & Mashaer** — kereta Mashaer, bus resmi, mobilitas terpandu.
6. **Panduan & Edukasi** — konten ibadah dan peta suci.

## MUHDIN dalam Ekosistem Ini

Sebagai asosiasi di atas asosiasi penyelenggara ibadah — titik koordinasi akses Nusuk bagi industri Indonesia — MUHDIN memastikan anggotanya mampu menemani jamaah Indonesia memanfaatkan seluruh layanan ini dengan amanah.

*Sumber: rilis resmi SPA (Saudi Press Agency) · nusuk.sa.*`,
  },
  {
    slug: "statistik-resmi-haji-1446h-1673230-jamaah",
    title: "Resmi: 1.673.230 Jamaah Haji 1446 H/2025 M — Musim Haji & Umrah Tembus 18,5 Juta",
    excerpt:
      "Statistik resmi GASTAT: 1.673.230 jamaah menunaikan Haji 1446 H/2025 M; sepanjang musim 2024–2025 total jamaah Haji & Umrah mencapai 18,5 juta orang.",
    category: "Berita",
    featured: false,
    content: `## Angka Resmi Musim Haji 1446 H / 2025 M

Hari Statistik Dunia dan data resmi **GASTAT (Authority Statistik Umum Arab Saudi)** mencatat:

- **Total jamaah Haji 1446 H/2025 M: 1.673.230 jamaah.**
- Jamaah luar negeri: ±1,5 juta (≈90%) — rekor kehadiran internasional.
- Jamaah internal: ±166 ribu (≈10%).

## Musim Penuh Haji & Umrah 2024–2025: 18,5 Juta Jamaah

Sepanjang musim 2024–2025, Kerajaan Saudi melayani total **±18,5 juta jamaah**:

| Jenis Ibadah | Jumlah Jamaah |
| --- | --- |
| Haji (1446 H) | ±1,61 juta |
| Umrah | ±16,92 juta |

## Pesan untuk Ekosistem MUHDIN

Angka ini membuktikan pemulihan dan pertumbuhan pesat perjalanan ibadah global. Target MUHDIN mengawal **1.000.000+ jamaah per tahun pada 2030** kini makin relevan — dengan tata kelola yang terstandar, terpantau GPS, dan terintegrasi Nusuk.

*Sumber: GASTAT (stats.gov.sa) · datasaudi.sa · SPA.*`,
  },
  {
    slug: "kuota-haji-indonesia-1447h-221000-jamaah",
    title: "Kuota Haji Indonesia 1447 H/2026 M: 221.000 Jamaah — 203.320 Reguler & 17.680 Khusus",
    excerpt:
      "Kemenag RI menetapkan kuota Haji Indonesia 1447 H/2026 M sebanyak 221.000 jamaah: 92% kanal reguler (203.320) dan 8% kanal khusus (17.680). MUHDIN mengawal kanal khusus agar tuntas dan transparan.",
    category: "Pengumuman",
    featured: false,
    content: `## Kuota Resmi Indonesia 1447 H / 2026 M

Berdasarkan paparan kebijakan Kementerian Agama RI, **Indonesia mendapat alokasi kuota Haji 1447 H/2026 M sebanyak 221.000 jamaah**, dengan rincian:

- **Kanal Reguler (92%): 203.320 jamaah**
- **Kanal Khusus (8%): 17.680 jamaah**

## Mandat Tata Kelola Kanal Khusus

Kanal khusus adalah ruang penyelenggara PPIHU terdaftar. MUHDIN mengawal agar:

1. **Transparansi penuh** — status alokasi, kontrak, dan jadwal terpantau di satu dashboard.
2. **Kepatuhan Nusuk** — seluruh izin jamaah kanal khusus tersinkron dengan platform resmi.
3. **Perlindungan jamaah** — verifikasi keaslian penyelenggara dan izin via Permit Checker publik.

Jamaah disarankan **selalu memverifikasi penyelenggara dan izinnya** sebelum bertransaksi — gratis melalui halaman Nusuk Hub di portal ini.

*Sumber: Kementerian Agama RI — kebijakan kuota Haji 1447 H/2026 M.*`,
  },
];

async function main() {
  let created = 0;
  let updated = 0;
  for (const a of ARTICLES) {
    const existing = await prisma.article.findUnique({ where: { slug: a.slug } });
    if (existing) {
      await prisma.article.update({ where: { slug: a.slug }, data: { ...a, status: "PUBLISHED" } });
      updated++;
    } else {
      await prisma.article.create({ data: { ...a, status: "PUBLISHED" } });
      created++;
    }
  }
  console.log(`[seed-task23] ✓ Selesai — ${created} artikel baru, ${updated} diperbarui.`);
}

main()
  .catch((e) => {
    console.error("[seed-task23] ✗ Gagal:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
