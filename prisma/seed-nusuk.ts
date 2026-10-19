/**
 * Seed Nusuk Integration — koneksi sandbox, izin (permit), log sinkronisasi,
 * tutorial, FAQ, dan pengaturan situs terkait Nusuk. Idempoten (aman diulang).
 * Jalankan: bun prisma/seed-nusuk.ts
 */
import { PrismaClient } from "@prisma/client";
import { ensureConnection, buildPermitNo, ELIGIBILITY, PERMIT_CATALOG } from "../src/lib/nusuk-engine";

const db = new PrismaClient();
const DAY = 86400000;

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  console.log("🔌 Seeding Nusuk Integration…");
  const now = new Date();

  // 0) Bersihkan data Nusuk lama (urutan aman FK)
  await db.nusukSyncLog.deleteMany();
  await db.nusukPermit.deleteMany();
  await db.nusukConnection.deleteMany();

  // 1) Koneksi sandbox terhubung
  const conn = await ensureConnection();
  const connected = await db.nusukConnection.update({
    where: { id: conn.id },
    data: {
      status: "CONNECTED",
      environment: "SANDBOX",
      lastSyncAt: new Date(now.getTime() - 6 * 60000),
      totalSyncs: 128,
    },
  });
  console.log(`  ✓ Koneksi Nusuk SANDBOX: ${connected.status} (key ${connected.apiKey.slice(0, 12)}…)`);

  // 2) Izin (permit) untuk seluruh anggota terverifikasi
  const members = await db.member.findMany({ where: { status: "TERVERIFIKASI" } });
  let permitCount = 0;
  let i = 0;
  for (const member of members) {
    const types = ELIGIBILITY[member.type] ?? ["VISA"];
    for (const type of types) {
      const spec = PERMIT_CATALOG[type];
      if (!spec) continue;
      const permitNo = buildPermitNo(member.licenseNo, type);
      const roll = i % 11;
      const status = roll === 4 ? "PENDING" : roll === 7 ? "EXPIRED" : roll === 9 ? "REJECTED" : "ACTIVE";
      const issuedAt = new Date(now.getTime() - (10 + (i % 45)) * DAY);
      const expiresAt =
        status === "EXPIRED"
          ? new Date(now.getTime() - 3 * DAY)
          : new Date(now.getTime() + spec.validityDays * DAY);
      const quota = 12 + ((i * 7) % 38);
      await db.nusukPermit.upsert({
        where: { permitNo },
        update: { status, expiresAt, syncedAt: now },
        create: {
          memberId: member.id,
          type,
          permitNo,
          holderName: member.name,
          meta: `${spec.label} · quota ${quota} jamaah`,
          status,
          issuedAt,
          expiresAt,
          syncedAt: now,
        },
      });
      permitCount += 1;
      i += 1;
    }
  }
  console.log(`  ✓ ${permitCount} izin Nusuk dibuat untuk ${members.length} anggota`);

  // 3) Log sinkronisasi & webhook realistis
  const logs: { type: string; status: string; message: string; recordsAffected: number; durationMs: number; minutesAgo: number }[] = [
    { type: "FULL_SYNC", status: "SUCCESS", message: "Sinkronisasi SANDBOX: 41 izin baru, 9 diperbarui, 2 kedaluwarsa dari 12 anggota.", recordsAffected: 52, durationMs: 742, minutesAgo: 6 },
    { type: "WEBHOOK", status: "SUCCESS", message: "PERMIT.RENEWED → NSK-HTL-2026-118207 status menjadi ACTIVE. Catatan: perpanjangan kontrak hotel Makkah musim Ramadan.", recordsAffected: 1, durationMs: 31, minutesAgo: 42 },
    { type: "WEBHOOK", status: "SUCCESS", message: "PERMIT.EXPIRED → NSK-RDH-2026-330411 status menjadi EXPIRED.", recordsAffected: 1, durationMs: 18, minutesAgo: 96 },
    { type: "FULL_SYNC", status: "SUCCESS", message: "Sinkronisasi SANDBOX: 38 izin baru, 12 diperbarui, 1 kedaluwarsa dari 12 anggota.", recordsAffected: 51, durationMs: 689, minutesAgo: 245 },
    { type: "CONNECTION", status: "SUCCESS", message: "Terhubung ke Nusuk SANDBOX — handshake berhasil.", recordsAffected: 0, durationMs: 122, minutesAgo: 2880 },
    { type: "FULL_SYNC", status: "FAILED", message: "Timeout gateway Nusuk sandbox (504) — percobaan otomatis ke-2 berhasil pada siklus berikutnya.", recordsAffected: 0, durationMs: 30400, minutesAgo: 3100 },
    { type: "FULL_SYNC", status: "SUCCESS", message: "Sinkronisasi SANDBOX: 29 izin baru, 17 diperbarui, 3 kedaluwarsa dari 12 anggota.", recordsAffected: 49, durationMs: 705, minutesAgo: 4320 },
    { type: "WEBHOOK", status: "SUCCESS", message: "PERMIT.ISSUED → NSK-MTW-2026-907122 status menjadi ACTIVE. Catatan: lisensi mutawif baru kloter Februari.", recordsAffected: 1, durationMs: 27, minutesAgo: 5760 },
  ];
  for (const { minutesAgo, ...l } of logs) {
    await db.nusukSyncLog.create({
      data: { ...l, connectionId: connected.id, createdAt: new Date(now.getTime() - minutesAgo * 60000) },
    });
  }
  console.log(`  ✓ ${logs.length} log sinkronisasi ditulis`);

  // 4) Tutorial Nusuk
  const tutorials = [
    {
      title: "Menghubungkan Portal MUHDIN ke Platform Nusuk (Panduan Admin)",
      category: "CMS",
      level: "Menengah",
      duration: 15,
      summary:
        "Langkah lengkap mengaktifkan jembatan Nusuk: memilih environment, menghubungkan koneksi, rotasi kredensial API, menjalankan sinkronisasi, hingga memantau log audit.",
      content: `## Mengapa Integrasi Nusuk Penting?

Nusuk adalah platform resmi Kementerian Hajj dan Umrah Kerajaan Saudi Arabia yang menjadi tulang punggung digital perjalanan ibadah: visa, izin Rawdah, kontrak hotel, transportasi, hingga lisensi mutawif. Dengan menghubungkan portal MUHDIN ke Nusuk, seluruh izin anggota asosiasi terpusat, teraudit, dan dapat diverifikasi publik dalam hitungan detik.

## Langkah 1 — Masuk ke Modul Integrasi

1. Buka portal dan masuk ke **CMS Admin** (menu *Portal Mitra*).
2. Pilih menu **Integrasi Nusuk** pada sidebar.
3. Perhatikan kartu **Status Koneksi** di bagian atas: lingkungan aktif, sinkronisasi terakhir, dan tingkat keberhasilan.

## Langkah 2 — Pilih Environment

- **SANDBOX** — lingkungan uji resmi. Gunakan untuk pelatihan operator dan validasi alur tanpa risiko.
- **PRODUCTION** — lingkungan langsung. Aktifkan hanya setelah seluruh prosedur lolos uji sandbox.

Pilih lingkungan pada pengalih di kartu koneksi, lalu klik **Hubungkan Nusuk**. Sistem melakukan *handshake* dan mencatatnya ke log audit.

## Langkah 3 — Kelola Kredensial API

Setiap koneksi memiliki **API Key** dan **Webhook Secret**. Kunci ditampilkan tersamar; klik ikon mata untuk menampilkan sementara, dan gunakan tombol **Rotasi Kredensial** secara berkala (disarankan tiap 90 hari) agar kunci lama otomatis dicabut.

## Langkah 4 — Jalankan Sinkronisasi

Klik **Sinkronkan Sekarang**. Mesin sinkronisasi akan:

1. Mengambil seluruh anggota berstatus TERVERIFIKASI.
2. Menerbitkan/memperbarui izin sesuai kelayakan jenis anggota (PPIU, PIHK, KBIHU, IPHI, Travel Wisata).
3. Kedaluwarsakan izin yang melewati masa berlaku.
4. Menulis log audit berisi jumlah rekaman dan durasi.

Aktifkan **Auto-Sync** agar sinkronisasi berjalan terjadwal tanpa sentuhan tangan.

## Langkah 5 — Pantau dan Audit

Gunakan tab **Log Sinkronisasi** untuk melihat riwayat: sinkronisasi penuh, event webhook, dan perubahan koneksi. Setiap baris mencatat durasi serta jumlah rekaman terdampak — satu sumber kebenaran untuk auditinternal maupun eksternal.

> **Tips:** jika sinkronisasi gagal (misal gateway Nusuk sibuk), sistem mencatat status FAILED beserta penyebabnya — cukup jalankan ulang; proses bersifat idempoten sehingga tidak ada data ganda.`,
      order: 11,
    },
    {
      title: "Memahami 6 Jenis Izin Nusuk dalam Ekosistem MUHDIN",
      category: "Mitra",
      level: "Menengah",
      duration: 12,
      summary:
        "VSA, HDL, MTW, HTL, TRN, RDH — kenali enam jenis izin Nusuk, masa berlaku, ekosistem terkait, dan siklus hidupnya dari terbit hingga kedaluwarsa.",
      content: `## Enam Jenis Izin Nusuk

MUHDIN menerjemahkan layanan Nusuk menjadi enam jenis izin (permit). Setiap izin memiliki kode unik format \`NSK-XXX-TAHUN-NOMOR\`.

| Kode | Jenis | Masa Berlaku | Ekosistem |
|------|-------|--------------|-----------|
| VSA | **Visa Authorization** — persetujuan visa umroh/haji | 90 hari | 01 Visa Umroh & Haji |
| HDL | **Handling Clearance** — izin penanganan di bandara Indonesia & Saudi | 180 hari | 02 & 04 Handling |
| MTW | **Mutawif License** — lisensi pembimbing ibadah bersertifikasi | 365 hari | 03 Tour Leader & 05 Mutawif |
| HTL | **Hotel Contract** — kontrak akomodasi berstandar Nusuk | 365 hari | 06 Akomodasi Hotel |
| TRN | **Transport Permit** — izin armada bus antar kota suci | 120 hari | 07 Transportasi |
| RDH | **Rawdah Permit** — jadwal ziarah Rawdah di Masjid Nabawi | 30 hari | 08 Raudah |

## Kelayakan Berdasarkan Jenis Anggota

- **PPIU** — VSA, HDL, HTL, TRN, RDH
- **PIHK** — VSA, HTL, TRN, RDH
- **KBIHU** — VSA, HDL
- **IPHI** — MTW
- **Travel Wisata** — TRN, HTL

## Siklus Hidup Izin

1. **ACTIVE** — izin berlaku dan dapat digunakan.
2. **PENDING** — menunggu persetujuan gateway Nusuk.
3. **EXPIRED** — melewati masa berlaku; perlu perpanjangan.
4. **REJECTED** — dicabut; ajukan izin baru.

Perubahan status dapat terjadi otomatis lewat **webhook** \`PERMIT.ISSUED\`, \`PERMIT.RENEWED\`, \`PERMIT.EXPIRED\`, dan \`PERMIT.REVOKED\` — tersinkron dalam hitungan detik.

## Skor Kepatuhan Anggota

Setiap anggota memiliki **skor kepatuhan** = persentase izin ACTIVE terhadap total izin. Skor tinggi menandakan penyelenggara yang tertib administrasi — ditampilkan di Nusuk Hub publik sebagai bentuk transparansi asosiasi.`,
      order: 12,
    },
    {
      title: "Cek Keaslian Izin Nusuk Secara Publik — Panduan Jamaah",
      category: "Jamaah",
      level: "Pemula",
      duration: 5,
      summary:
        "Sebelum berangkat, pastikan izin penyelenggara Anda asli. Masukkan nomor NSK pada Nusuk Hub dan baca hasil verifikasinya dalam empat detik.",
      content: `## Kenapa Jamaah Perlu Memeriksa Izin?

Setiap penyelenggara yang tergabung MUHDIN memegang izin digital Nusuk untuk visa, hotel, transportasi, hingga ziarah Rawdah. Memeriksa izin berarti memastikan perjalanan ibadah Anda ditangani penyelenggara yang legal dan terdaftar resmi.

## Cara Memeriksa — 60 Detik Selesai

1. Buka halaman **Nusuk Hub** dari menu navigasi.
2. Gulir ke kartu **Cek Izin Nusuk**.
3. Masukkan nomor izin yang Anda terima dari travel, contoh: \`NSK-VSA-2026-482913\`.
4. Klik **Verifikasi Sekarang**.

## Membaca Hasil Verifikasi

- **ACTIVE** — izin berlaku. Wajib haji/umroh Anda dilindungi standar Nusuk.
- **PENDING** — izin sedang diproses; minta penyelenggara memantau persetujuan.
- **EXPIRED** — masa berlaku habis; minta bukti perpanjangan sebelum berangkat.
- **REJECTED** — izin dicabut; segera hubungi MUHDIN.

Hasil juga menampilkan pemilik izin (nama penyelenggara, kota, nomor lisensi Kemenag) sehingga Anda bisa mencocokkan dengan dokumen yang Anda pegang.

## Tips Keamanan

- Nomor izin asli selalu berformat \`NSK-XXX-TAHUN-NOMOR\` tanpa spasi.
- Jangan membayar di luar invoice resmi penyelenggara terverifikasi.
- Jika hasil verifikasi berbeda dengan klaim travel, laporkan melalui halaman **Kontak**.`,
      order: 13,
    },
  ];
  for (const t of tutorials) {
    await db.tutorial.upsert({
      where: { slug: slugify(t.title) },
      update: { ...t, published: true },
      create: { ...t, slug: slugify(t.title), published: true },
    });
  }
  console.log(`  ✓ ${tutorials.length} tutorial Nusuk ditambahkan`);

  // 5) FAQ Nusuk
  const faqs = [
    {
      question: "Apa itu Nusuk dan bagaimana MUHDIN terhubung dengannya?",
      answer:
        "Nusuk adalah platform resmi Kementerian Hajj dan Umrah Kerajaan Saudi Arabia untuk seluruh layanan perjalanan ibadah. MUHDIN terhubung melalui jembatan API (Nusuk Connect) yang menyinkronkan izin anggota — visa, hotel, transportasi, mutawif, hingga Rawdah — secara real-time, teraudit penuh, dan dapat diverifikasi publik di Nusuk Hub.",
      category: "Umum",
      order: 11,
    },
    {
      question: "Bagaimana cara memverifikasi izin Nusuk yang saya terima dari penyelenggara?",
      answer:
        "Buka menu Nusuk Hub, masukkan nomor izin berformat NSK-XXX-TAHUN-NOMOR pada kartu Cek Izin Nusuk, lalu klik Verifikasi. Sistem menampilkan status izin (ACTIVE/PENDING/EXPIRED/REJECTED), pemilik izin, dan masa berlaku langsung dari registri.",
      category: "Jamaah",
      order: 12,
    },
    {
      question: "Apa perbedaan environment SANDBOX dan PRODUCTION pada integrasi Nusuk?",
      answer:
        "SANDBOX adalah lingkungan uji resmi untuk pelatihan operator dan validasi alur tanpa risiko data produksi. PRODUCTION adalah lingkungan langsung yang terhubung ke gateway Nusuk sesungguhnya. MUHDIN menyediakan pengalih environment di CMS dengan log audit terpisah dan rotasi kredensial otomatis.",
      category: "Mitra",
      order: 13,
    },
  ];
  for (const f of faqs) {
    const exists = await db.faq.findFirst({ where: { question: f.question } });
    if (!exists) await db.faq.create({ data: f });
  }
  console.log(`  ✓ ${faqs.length} FAQ Nusuk ditambahkan`);

  // 6) Pengaturan situs terkait Nusuk
  const settings: [string, string][] = [
    ["nusuk_tagline", "Terhubung Langsung dengan Platform Nusuk"],
    [
      "nusuk_desc",
      "Nusuk Connect — jembatan data resmi antara ekosistem MUHDIN dan Kementerian Hajj & Umrah KSA: izin tersinkron otomatis, teraudit penuh, dan dapat diverifikasi publik dalam hitungan detik.",
    ],
    ["nusuk_api_note", "Endpoint sandbox: api.nusuk.sa/v1 · Webhook: /api/nusuk/webhook · Rotasi kredensial 90 hari"],
  ];
  for (const [key, value] of settings) {
    await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log(`  ✓ ${settings.length} pengaturan situs Nusuk ditulis`);

  console.log("🏁 Seed Nusuk selesai.");
}

main()
  .catch((e) => {
    console.error("Seed gagal:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
