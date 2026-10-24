/**
 * seed-task18.mjs — data demo untuk fitur Task 18 (idempotent: bersihkan lalu isi).
 * Galeri memakai gambar lokal yang sudah ada di public/images/.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  // ---- GALERI ----
  await db.gallery.deleteMany({});
  await db.gallery.createMany({
    data: [
      { title: "Keberangkatan Jamaah Pertama 2026", caption: "Parsean jamaah di Bandara Soekarno-Hatta sebelum penerbangan ke Tanah Suci.", category: "Kegiatan", imageUrl: "/images/hero-kaaba.jpg", order: 1 },
      { title: "Pelayanan Jamaah di Bandara", caption: "Tim handling MUHDIN mendampingi proses imigrasi dan bagasi jamaah.", category: "Perjalanan", imageUrl: "/images/jamaah-handling.jpg", order: 2 },
      { title: "Bimbingan Manasik Bersama", caption: "Kelas manasik umrah rutin bagi calon jamaah bersama pembina berpengalaman.", category: "Manasik", imageUrl: "/images/manasik.jpg", order: 3 },
      { title: "Penginapan Jamaah di Makkah", caption: "Fasilitas hotel bintang empat berjarak nyaman dari Masjidil Haram.", category: "Fasilitas", imageUrl: "/images/hotel-makkah.jpg", order: 4 },
      { title: "Ziarah Masjid Nabawi", caption: "Rombongan jamaah di Masjid Nabawi, Madinah Al-Munawwarah.", category: "Perjalanan", imageUrl: "/images/masjid-nabawi.jpg", order: 5 },
      { title: "Komando Pusat Layanan 24 Jam", caption: "Command center pemantauan keberangkatan dan layanan darurat jamaah.", category: "Fasilitas", imageUrl: "/images/command-center.jpg", order: 6 },
      { title: "Kereta Cepat Haramain", caption: "Perjalanan Makkah-Madinah menggunakan kereta cepat Haramain.", category: "Perjalanan", imageUrl: "/images/haramain-train.jpg", order: 7 },
      { title: "Rakernas Anggota 2026", caption: "Rapat kerja nasional anggota MUHDIN menyusun peta jalan layanan.", category: "Kegiatan", imageUrl: "/images/hero-kaaba.jpg", order: 8 },
    ],
  });

  // ---- AGENDA ----
  await db.event.deleteMany({});
  await db.event.createMany({
    data: [
      { title: "Pelatihan Verifikator Keanggotaan", description: "Pelatihan tim verifikator: menilai legalitas izin, memeriksa dokumen, dan menulis catatan verifikasi yang baik.", location: "Kantor Sekretariat, Jakarta", startsAt: days(9), endsAt: days(10), category: "Pelatihan" },
      { title: "Rapat Kerja Nasional 2026", description: "Rakernas seluruh anggota: evaluasi layanan, target mutu, dan peta jalan integrasi Nusuk.", location: "Balai Kartini, Jakarta", startsAt: days(24), endsAt: days(25), category: "Rakernas" },
      { title: "Safari Ramadhan Anggota", description: "Safari kunjungan ke seluruh anggota wilayah Jawa Barat untuk silaturahmi dan audit lapangan ringan.", location: "Bandung, Jawa Barat", startsAt: days(45), category: "Safari" },
      { title: "Bimbingan Manasik Gabungan", description: "Manasik gabungan bagi jamaah anggota — terbuka untuk pendaftaran publik.", location: "Masjid Agung Al-Azhar, Jakarta", startsAt: days(-14), category: "Kegiatan" },
      { title: "Sosialisasi Integrasi Nusuk", description: "Sosialisasi koneksi Nusuk Connect 360° kepada seluruh anggota (sudah terlaksana).", location: "Daring — Zoom", startsAt: days(-40), category: "Kegiatan" },
    ],
  });

  // ---- PUSAT UNDUHAN ----
  await db.resource.deleteMany({});
  await db.resource.createMany({
    data: [
      { title: "Formulir Pendaftaran Keanggotaan", description: "Formulir resmi pendaftaran anggota baru MUHDIN (bisa juga daftar online via halaman Gabung).", category: "Formulir", fileUrl: "/dokumen/formulir-pendaftaran-anggota.pdf", fileType: "PDF" },
      { title: "Panduan Verifikasi Penyelenggara", description: "Panduan jamaah memeriksa legalitas penyelenggara sebelum bertransaksi.", category: "Panduan", fileUrl: "/dokumen/panduan-verifikasi-penyelenggara.pdf", fileType: "PDF" },
      { title: "Contoh Surat Keputusan Keanggotaan", description: "Format SK penerimaan anggota baru sebagai referensi administrasi.", category: "Lainnya", fileUrl: "/dokumen/sk-keanggotaan-demo.pdf", fileType: "PDF" },
      { title: "Kode Etik Anggota", description: "Kode etik yang wajib dipatuhi seluruh anggota MUHDIN.", category: "Kebijakan", fileUrl: "/dokumen/kode-etik-anggota.pdf", fileType: "PDF" },
    ],
  });

  // ---- PELANGGAN NEWSLETTER ----
  await db.subscriber.deleteMany({});
  await db.subscriber.createMany({
    data: [
      { email: "haji.aminah@example.com" },
      { email: "sulaiman.travel@example.com" },
      { email: "fatimah.rahayu@example.com" },
      { email: "admin@pihkjaya.example.com" },
      { email: "jamaah.mandiri@example.com", isActive: false },
    ],
  });

  // ---- PENGADUAN DEMO ----
  await db.complaint.deleteMany({});
  await db.complaint.createMany({
    data: [
      { name: "Ahmad Fauzi", email: "ahmad.fauzi@example.com", phone: "0812-9988-7766", targetMember: "Travel Barokah", category: "Itinerary", content: "Rundown perjalanan berubah tanpa pemberitahuan, kunjungan ziarah Madinah dipotong satu hari. Mohon klarifikasi dan pengawasan dari MUHDIN.", status: "UNREAD" },
      { name: "Siti Rohmah", email: "siti.rohmah@example.com", phone: "0857-1122-3344", targetMember: "PT Cahaya Thaqalain Tour", category: "Pelayanan", content: "Pendampingan di bandara kurang, jamaah lansia kesulitan saat check-in. Alhamdulillah setelah dihubungi panitia sudah diperbaiki di keberangkatan berikutnya.", status: "PROCESSED", responseNote: "Telah menghubungi penyelenggara; komitmen perbaikan handling lansia disampaikan tertulis.", respondedBy: "Admin MUHDIN", respondedAt: days(-3) },
    ],
  });

  const counts = {
    gallery: await db.gallery.count(),
    events: await db.event.count(),
    resources: await db.resource.count(),
    subscribers: await db.subscriber.count(),
    complaints: await db.complaint.count(),
  };
  console.log("Seed Task 18:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
