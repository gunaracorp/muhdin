/**
 * seed-fitur-v5.ts — data demo v5.0: Marketplace Paket, Forum Jamaah, Kartu Jamaah.
 * Idempoten: hapus data fitur baru dahulu, lalu isi ulang.
 * Jalankan: bun prisma/seed-fitur-v5.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY);

async function main() {
  console.log("🧹 Membersihkan data fitur v5…");
  await prisma.forumReply.deleteMany();
  await prisma.forumThread.deleteMany();
  await prisma.packageBooking.deleteMany();
  await prisma.tourPackage.deleteMany();
  await prisma.pilgrimCard.deleteMany();

  // ---------- Anggota acuan ----------
  const members = await prisma.member.findMany({ where: { status: "TERVERIFIKASI" }, orderBy: { name: "asc" } });
  const byName = (needle: string) => members.find((m) => m.name.toLowerCase().includes(needle.toLowerCase()));
  const m1 = byName("Insan Barokah") ?? members[0];
  const m2 = byName("Mabrur") ?? members[1] ?? m1;
  const m3 = byName("Safar Madinah") ?? members[2] ?? m1;
  const m4 = members[3] ?? m1;
  const m5 = members[4] ?? m1;

  // ---------- PAKET ----------
  console.log("📦 Menyemai paket ibadah…");
  const packages = await prisma.$transaction([
    prisma.tourPackage.create({
      data: {
        memberId: m1.id, title: "Paket Umroh Reguler 9 Hari — Keberangkatan Jakarta",
        type: "UMROH", city: "Jakarta", price: 28500000, durationDays: 9,
        departureDate: at(21), slots: 45, slotsTaken: 38,
        hotelMakkah: "Hotel Swiss Belhotel Al Maqam (500 m dari Masjidil Haram)",
        hotelMadinah: "Hotel Taiba Front (300 m dari Masjid Nabawi)",
        airline: "Garuda Indonesia (direct)",
        description:
          "Paket umroh reguler dengan penerbangan langsung Jakarta–Jeddah. Termasuk: visa umroh, tiket PP, bagasi 40 kg, hotel bintang 4 dekat masjid, makan 3x sehari masakan Indonesia, bus AC full AC, tour leader & muthawif berpengalaman, manasik on the spot, air zamzam 5 liter/keluarga, SIM koper, perlengkapan (koper, sarung, mukena, peci).",
        status: "PUBLISHED", featured: true,
      },
    }),
    prisma.tourPackage.create({
      data: {
        memberId: m2.id, title: "Paket Umroh Plus Kairo 12 Hari",
        type: "UMROH", city: "Bekasi", price: 34900000, durationDays: 12,
        departureDate: at(35), slots: 40, slotsTaken: 12,
        hotelMakkah: "Hotel Al Shohada (150 m)",
        hotelMadinah: "Hotel Anwar Al Madinah Mövenpick",
        airline: "Egypt Airlines (transit Kairo)",
        description:
          "Ziarah duel tanah suci: 8 hari Makkah-Madinah + 3 hari Kairo (Piramida Giza, Musium Mesir, Gereja Gantung, Khan el-Khalili) + 1 hari perjalanan. Termasuk visa Mesir, makanan halal, pemandu berbahasa Indonesia, dokumentasi video perjalanan.",
        status: "PUBLISHED", featured: true,
      },
    }),
    prisma.tourPackage.create({
      data: {
        memberId: m3.id, title: "Paket Haji Khusus Furoda 2027 — Kuota Terbatas",
        type: "HAJI", city: "Medan", price: 285000000, durationDays: 40,
        departureDate: at(280), slots: 25, slotsTaken: 9,
        hotelMakkah: "Hotel Fairmont Clock Royal Tower (view Ka'bah)",
        hotelMadinah: "Hotel Intercontinental Darul Iman",
        airline: "Saudia Airlines (direct)",
        description:
          "Program haji furoda dengan akomodasi premium: appartemen Makkah view Ka'bah, catering Indonesia chef khusus, pendamping 24 jam rasio 1:10, bus VIP, dokumen Nusuk diurus penuh, edukasi manasik 6 bulan intensif sebelum berangkat. Kuota sangat terbatas — konfirmasi ketersediaan sebelum DP.",
        status: "PUBLISHED", featured: false,
      },
    }),
    prisma.tourPackage.create({
      data: {
        memberId: m4.id, title: "Ziarah Turki — Istanbul & Bursa 10 Hari",
        type: "ZIARAH", city: "Bandung", price: 25900000, durationDays: 10,
        departureDate: at(50), slots: 30, slotsTaken: 21,
        hotelMakkah: "—", hotelMadinah: "—",
        airline: "Turkish Airlines (direct)",
        description:
          "Menyusuri jejak peradaban Islam: Hagia Sophia, Blue Mosque, Topkapi Palace, Makam Abu Ayyub Al-Anshari, Masjid Ulucami Bursa, pegunungan Uludag. Termasuk visa elektronik, hotel bintang 4, makan sesuai menu Turki halal, pemandu lokal berbahasa Indonesia.",
        status: "PUBLISHED", featured: false,
      },
    }),
    prisma.tourPackage.create({
      data: {
        memberId: m5.id, title: "Umroh Keluarga — Program Nyaman Anak & Lansia",
        type: "UMROH", city: "Surabaya", price: 31500000, durationDays: 10,
        departureDate: at(60), slots: 30, slotsTaken: 28,
        hotelMakkah: "Hotel Jabal Omar Hyatt (in building Masjidil Haram)",
        hotelMadinah: "Hotel Dar Al Taqwa",
        airline: "Garuda Indonesia (direct)",
        description:
          "Dirancang khusus untuk keluarga dengan anak dan lansia: jarak hotel 0 meter ke masjid, wheelchair gratis, tempo ibadah santai, kelas manasik keluarga, playground anak, menu makanan ramah anak, dokter pendamping setiap keberangkatan.",
        status: "PUBLISHED", featured: false,
      },
    }),
    prisma.tourPackage.create({
      data: {
        memberId: m1.id, title: "Umroh Ramadhan Akhir — 10 Hari Itikaf",
        type: "UMROH", city: "Jakarta", price: 42500000, durationDays: 10,
        departureDate: at(160), slots: 35, slotsTaken: 35,
        hotelMakkah: "Hotel Raffles Makkah Palace",
        hotelMadinah: "Hotel Taiba Front",
        airline: "Garuda Indonesia (direct)",
        description:
          "Mengerjakan umroh di 10 hari terakhir Ramadhan: itikaf 3 malam di Masjidil Haram (tiket itikaf diurus), buka puasa paket Nusuk, sahur hotel, umroh setiap 2 hari sekali, kajian rutin bersama asatidz pendamping.",
        status: "PUBLISHED", featured: false,
      },
    }),
    prisma.tourPackage.create({
      data: {
        memberId: m3.id, title: "Wisata Islami Yaman & Hadramaut (Menunggu Keamanan)",
        type: "WISATA_ISLAMI", city: "Medan", price: 55000000, durationDays: 12,
        departureDate: at(300), slots: 20, slotsTaken: 0,
        hotelMakkah: "—", hotelMadinah: "—",
        airline: "Yemenia (transit Aden)",
        description:
          "Ziarah kota para wali: Tarim, Seiun, Habib Umar bin Hafidz, Ribath, lembah Dawan. Menunggu kondisi keamanan membaik — daftar menunggu dibuka dengan DP 10% yang dapat dibatalkan kapan pun.",
        status: "DRAFT", featured: false,
      },
    }),
    prisma.tourPackage.create({
      data: {
        memberId: m2.id, title: "Umroh Sensasi Kereta Cepat Makkah–Madinah",
        type: "UMROH", city: "Bekasi", price: 29900000, durationDays: 9,
        departureDate: at(45), slots: 40, slotsTaken: 40,
        hotelMakkah: "Hotel Anjum Makkah",
        hotelMadinah: "Hotel Al Eiman Taiba",
        airline: "Saudia Airlines (direct)",
        description:
          "Nikmati Haramain High Speed Railway Makkah–Madinah hanya 2 jam. Termasuk tiket kereta cepat kelas ekonomi, visa, hotel bintang 4, makan Indonesia, tour leader. SLOT PENUH — buka jadwal keberangkatan berikutnya.",
        status: "CLOSED", featured: false,
      },
    }),
  ]);
  const pkgReguler = packages[0];
  const pkgKairo = packages[1];

  // ---------- BOOKING ----------
  console.log("🧾 Menyemai booking paket…");
  await prisma.packageBooking.createMany({
    data: [
      { packageId: pkgReguler.id, name: "H. Ahmad Sutisna", phone: "081234567890", email: "ahmad.sutisna@mail.com", pilgrims: 2, note: "Kamar quadruple dengan keluarga, titip koper tambahan.", status: "CONFIRMED", createdAt: at(-9) },
      { packageId: pkgReguler.id, name: "Dewi Kartika", phone: "085712345678", email: null, pilgrims: 4, note: "Ada lansia 68 tahun, mohon wheelchair.", status: "CONTACTED", createdAt: at(-4) },
      { packageId: pkgReguler.id, name: "Muhammad Rizki", phone: "081299887766", email: "rizki@mail.com", pilgrims: 1, note: null, status: "NEW", createdAt: at(-1) },
      { packageId: pkgKairo.id, name: "Keluarga H. Bambang Wijaya", phone: "087811223344", email: "bwijaya@mail.com", pilgrims: 5, note: "Anak termuda 7 tahun, butuh menu makanan ramah anak.", status: "CONFIRMED", createdAt: at(-6) },
      { packageId: pkgKairo.id, name: "Siti Maryam", phone: "089655443322", email: null, pilgrims: 2, note: "Tanya perbedaan dengan paket 9 hari reguler.", status: "NEW", createdAt: at(-0.5) },
      { packageId: pkgKairo.id, name: "Abdul Ghofur", phone: "081377766655", email: null, pilgrims: 3, note: null, status: "CANCELLED", createdAt: at(-8) },
    ],
  });

  // ---------- FORUM ----------
  console.log("💬 Menyemai diskusi forum…");
  const th1 = await prisma.forumThread.create({
    data: {
      title: "Doa saat memasang miqat — urutan yang benar bagaimana?",
      body: "Assalamu'alaikum. Saya akan berangkat umroh bulan depan. Dari beberapa kitab, urutan niat umroh dan doa miqat berbeda-beda. Mohon penjelasan urutan yang benar: mandi, pakai ihram, shalat sunnah, niat, lalu talbiyah? Dan doa apa yang paling utama dibaca di miqat?",
      authorName: "Hidayatullah", authorContact: "hidayat@mail.com", category: "Manasik",
      status: "APPROVED", pinned: true, views: 214, reviewedBy: "Admin MUHDIN", reviewedAt: at(-12),
      createdAt: at(-13),
    },
  });
  await prisma.forumReply.createMany({
    data: [
      { threadId: th1.id, authorName: "Ust. Fauzi Abdillah", body: "Wa'alaikumsalam. Urutan sunnahnya: mandi di miqat → memakai kain ihram → shalat sunnah ihram 2 rakaat → niat umroh (labbaika 'umratan) → tinggalkan talbiyah setelah niat, bukan sebelum. Doa miqat yang utama adalah talbiyah, lalu diperbolehkan menambah shalawat dan doa hasanah lainnya. Wallahu a'lam.", status: "APPROVED", createdAt: at(-12.5) },
      { threadId: th1.id, authorName: "Nur Hidayah", body: "Alhamdulillah sangat jelas. Tambahannya, di pesawat biasanya diumumkan miqat ~1 jam sebelum lewat — siapkan wudhu lebih awal karena barisan toilet panjang sekali.", status: "APPROVED", createdAt: at(-12.2) },
      { threadId: th1.id, authorName: "Tim MUHDIN", body: "Terima kasih atas kontribusinya. Teman-teman jamaah juga bisa mengikuti kelas manasik gratis di menu Tutorial portal ini sebelum keberangkatan.", status: "APPROVED", createdAt: at(-12) },
    ],
  });

  const th2 = await prisma.forumThread.create({
    data: {
      title: "Pengalaman mengurus visa umroh untuk anak di bawah 5 tahun?",
      body: "Assalamu'alaikum, orang tua saya ingin berangkat umroh bersama cucu (3 tahun). Apakah paspor dan visa untuk balita prosesnya sama dengan orang dewasa? Dokumen apa saja yang perlu disiapkan dan apakah ada biaya khusus?",
      authorName: "Ratna Puspita", authorContact: "ratna.p@mail.com", category: "Dokumen",
      status: "APPROVED", views: 156, reviewedBy: "Admin MUHDIN", reviewedAt: at(-9), createdAt: at(-10),
    },
  });
  await prisma.forumReply.createMany({
    data: [
      { threadId: th2.id, authorName: "Panitia Safar Madinah Tour", body: "Wa'alaikumsalam Ibu Ratna. Untuk balita: paspor anak (pakai akta kelahiran & persetujuan ortu pada formulir imigrasi), foto sesuai ketentuan, dan visa umroh tarif setengah dari dewasa. Khusus Nusuk Taasir dikenakan penuh. Kami bantu urus penuh untuk jamaah keluarga.", status: "APPROVED", createdAt: at(-9.6) },
      { threadId: th2.id, authorName: "Andi Wijaya", body: "Pengalaman saya: bawa salinan akta + buku nikah ortu saat check-in bandara, kadang diminta petugas. Stroller bisa dibawa gratis sampai gate.", status: "APPROVED", createdAt: at(-9.2) },
    ],
  });

  const th3 = await prisma.forumThread.create({
    data: {
      title: "Hotel di Makkah: worth it kah bayar mahal untuk 'in building'?",
      body: "Selisih harga hotel dalam kompleks Masjidil Haram (Jabal Omar dll.) dengan hotel 800m-1km bisa 2-3 kali lipat per malam. Buat yang pernah merasakan keduanya, apakah jarak dekat benar-benar mengubah kenyamanan ibadah, terutama untuk lansia dan saat musim ramai?",
      authorName: "Dr. Hasan Basri", authorContact: "hasan.b@mail.com", category: "Akomodasi",
      status: "APPROVED", views: 302, reviewedBy: "Admin MUHDIN", reviewedAt: at(-7), createdAt: at(-8),
    },
  });
  await prisma.forumReply.createMany({
    data: [
      { threadId: th3.id, authorName: "Hj. Sumiati", body: "Untuk lansia & ibu membawa anak, jarak dekat sangat terasa. Saya bisa balik hotel untuk istirahat di antara shalat fardhu tanpa melewatkan jamaah. Kalau jamaah muda-muda dan kuat jalan, hotel 800m + shuttle cukup.", status: "APPROVED", createdAt: at(-7.5) },
      { threadId: th3.id, authorName: "Farhan Maulana", body: "Tips: yang lebih menentukan kenyamanan adalah jarak AKSES masuk ke masjid (pintu mana yang dekat dari hotel), bukan jarak garis lurus. Hotel 700m dekat King Fahd Gate bisa lebih cepat dari hotel 300m yang aksesnya ke pintu belakang.", status: "APPROVED", createdAt: at(-7.1) },
    ],
  });

  const th4 = await prisma.forumThread.create({
    data: {
      title: "Perbedaan uang pesiar (Saudi Riyal) berapa yang ideal dibawa?",
      body: "Banyak rekomendasi berbeda: 500 SR, 1000 SR, bahkan 1500 SR per orang. Mengingat sekarang banyak pembayaran QR/m-payment di Arab Saudi, berapa kebutuhan riil uang tunai untuk umroh 9 hari di luar paket?",
      authorName: "Bagus Prakoso", authorContact: "bagus.p@mail.com", category: "Biaya",
      status: "APPROVED", views: 188, reviewedBy: "Admin MUHDIN", reviewedAt: at(-5), createdAt: at(-6),
    },
  });
  await prisma.forumReply.createMany({
    data: [
      { threadId: th4.id, authorName: "Tim MUHDIN", body: "Rata-rata jamaah kami: 700–1000 SR cukup untuk makan di luar paket, buah kurma, air zamzam kecil, transportasi taksi, dan sedekah. Kartu debit/credit UnionPay/Visa diterima di toko besar, tapi pasar lokal (souq) tetap butuh tunai. Konversi terbaik di money changer Makkah area Ajyad, hindari tukar di bandara (kurs jelek).", status: "APPROVED", createdAt: at(-5.4) },
    ],
  });

  const th5 = await prisma.forumThread.create({
    data: {
      title: "Membawa obat pribadi ke Jeddah — perlu izin khusus?",
      body: "Saya penderita hipertensi rutin minum obat pagi-malam. Apakah obat resep pribadi dalam jumlah trip perlu dokumen khusus saat masuk bandara King Abdulaziz? Ada pengalaman obat disita di imigrasi?",
      authorName: "Ibu Wulan", authorContact: "wulan@mail.com", category: "Perjalanan",
      status: "APPROVED", views: 97, reviewedBy: "Admin MUHDIN", reviewedAt: at(-3), createdAt: at(-4),
    },
  });
  await prisma.forumReply.create({
    data: {
      threadId: th5.id, authorName: "dr. Lestari (Pendamping Medis)",
      body: "Wa'alaikumsalam. Obat pribadi dalam kemasan asli + surat resep dokter (boleh bahasa Indonesia) sudah cukup, tidak perlu izin khusus untuk obat non-psikotropik. SIMPAN dalam bagasi kabin, bukan bagasi utama. Hindari bentuk cair >100ml tanpa resep. Untuk obat psikotropika/narkotika memang perlu persetujuan SFDA — cek daftarnya sebelum terbang.",
      status: "APPROVED", createdAt: at(-3.5),
    },
  });

  const th6 = await prisma.forumThread.create({
    data: {
      title: "Rekomendasi jadwal shalat di Makkah saat musim panas (fajr terlalu dekat isya)?",
      body: "Saya bingung susunan ibadah saat i'tikaf karena di musim panas waktu shalat subuh sangat dekat dengan isya. Bagaimana menjadwalkan tidur dan ibadah agar tetap kuat sampai hari pulang?",
      authorName: "Zainal Abidin", authorContact: "zainal@mail.com", category: "Manasik",
      status: "PENDING", createdAt: at(-0.4),
    },
  });

  const th7 = await prisma.forumThread.create({
    data: {
      title: "[Promosi] Jasa titip titipan Tanah Suci murah meriah hubungi WA saya",
      body: "Buat yang mau titip kurma, minyak zaitun, dll saya layani murah banget, hubungi nomor pribadi saya di bawah ini, di luar travel resmi saja biar murah…",
      authorName: "Anonim Promosi", authorContact: "0812xxxx", category: "Lainnya",
      status: "REJECTED", reviewedBy: "Admin MUHDIN", reviewedAt: at(-2), createdAt: at(-2.5),
    },
  });

  // Balasan pending untuk demo moderasi
  await prisma.forumReply.createMany({
    data: [
      { threadId: th3.id, authorName: "Jamaah Baru", body: "Kalau untuk rombongan 20 orang ke atas biasanya dapat harga khusus hotel dekat masjid, tanya panitia saja.", status: "PENDING", createdAt: at(-0.3) },
      { threadId: th4.id, authorName: "Pertanyaan Lanjutan", body: "Kalau membawa Riyal sisa dari perjalanan sebelumnya (kondisi 2019, seri lama), masih diterima di Arab Saudi?", status: "PENDING", createdAt: at(-0.2) },
    ],
  });

  // ---------- KARTU JAMAAH ----------
  console.log("🪪 Menerbitkan kartu jamaah demo…");
  const issuedBy = "Admin MUHDIN";
  await prisma.pilgrimCard.createMany({
    data: [
      { cardNo: "MHD-JM-2026-0001", fullName: "H. Ahmad Sutisna", phone: "081234567890", type: "JAMAAH", memberId: m1.id, groupName: "Rombl. Bakti Madinah 01", status: "ACTIVE", validUntil: at(60), issuedBy, note: "Ketua rombongan", scans: 14, lastScanAt: at(-2) },
      { cardNo: "MHD-JM-2026-0002", fullName: "Hj. Aminah Rahmawati", phone: "081234567891", type: "JAMAAH", memberId: m1.id, groupName: "Rombl. Bakti Madinah 01", status: "ACTIVE", validUntil: at(60), issuedBy, scans: 8, lastScanAt: at(-2) },
      { cardNo: "MHD-JM-2026-0003", fullName: "Muhammad Rizki Ramadhan", phone: "081299887766", type: "JAMAAH", memberId: m2.id, groupName: "Rombl. Noor Zamzam 04", status: "ACTIVE", validUntil: at(90), issuedBy, scans: 3, lastScanAt: at(-1) },
      { cardNo: "MHD-JM-2026-0004", fullName: "Dewi Kartika Sari", phone: "085712345678", type: "PENDAMPING", memberId: m2.id, groupName: "Rombl. Noor Zamzam 04", status: "ACTIVE", validUntil: at(90), issuedBy, note: "Pendamping lansia", scans: 5, lastScanAt: at(-1) },
      { cardNo: "MHD-JM-2026-0005", fullName: "Ust. Kholid Ibrahim", phone: "082199911122", type: "PETUGAS", memberId: m3.id, groupName: "Pendamping Medis & Manasik", status: "ACTIVE", validUntil: at(120), issuedBy, scans: 21, lastScanAt: at(-0.5) },
      { cardNo: "MHD-JM-2026-0006", fullName: "Siti Maryam Ulfah", phone: "089655443322", type: "JAMAAH", memberId: m5.id, groupName: "Rombl. Keluarga Surabaya 02", status: "ACTIVE", validUntil: at(45), issuedBy, scans: 0, lastScanAt: null },
      { cardNo: "MHD-JM-2026-0007", fullName: "Abdul Ghofur Hidayat", phone: "081377766655", type: "JAMAAH", memberId: m4.id, groupName: "Rombl. Ziarah Nusantara", status: "SUSPENDED", validUntil: at(30), issuedBy, note: "Bekukan sementara — verifikasi pembayaran ulang", scans: 2, lastScanAt: at(-4) },
      { cardNo: "MHD-JM-2026-0008", fullName: "Hj. Halimah Zahra", phone: "085699887711", type: "JAMAAH", memberId: m5.id, groupName: "Rombl. Keluarga Surabaya 01", status: "ACTIVE", validUntil: at(-7), issuedBy, note: "Masa berlaku selesai — contoh kartu kedaluwarsa", scans: 11, lastScanAt: at(-10) },
    ],
  });

  const [pkgCount, bookingCount, threadCount, replyCount, cardCount] = await Promise.all([
    prisma.tourPackage.count(),
    prisma.packageBooking.count(),
    prisma.forumThread.count(),
    prisma.forumReply.count(),
    prisma.pilgrimCard.count(),
  ]);

  console.log("\n=== Verifikasi Seed v5.0 ===");
  console.log(`TourPackage   : ${pkgCount}`);
  console.log(`PackageBooking: ${bookingCount}`);
  console.log(`ForumThread   : ${threadCount}`);
  console.log(`ForumReply    : ${replyCount}`);
  console.log(`PilgrimCard   : ${cardCount}`);
  console.log("\nSeed v5.0 sukses. Bersama Melayani Tamu Allah.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seed v5.0 GAGAL:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
