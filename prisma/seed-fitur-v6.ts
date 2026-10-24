/**
 * seed-fitur-v6.ts — data demo v6.0: Ekosistem Hulu-Hilir.
 * Vendor, Compliance Hub, Bursa Kursi, Kolam Muthowif, Brankas Jamaah,
 * Ulasan Terverifikasi, Direktori Darurat.
 * Idempoten: bersihkan tabel fitur v6 dahulu, lalu isi ulang.
 * Memakai member/paket/kartu yang sudah ada dari seed-fitur-v5.
 * Jalankan: bun prisma/seed-fitur-v6.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY);

async function main() {
  console.log("🧹 Membersihkan data fitur v6…");
  await prisma.pilgrimReview.deleteMany();
  await prisma.jamaahDoc.deleteMany();
  await prisma.seatListing.deleteMany();
  await prisma.complianceDoc.deleteMany();
  await prisma.muthowif.deleteMany();
  await prisma.sosPoint.deleteMany();
  await prisma.vendor.deleteMany();

  // ---------- Referensi dari seed v5 ----------
  const members = await prisma.member.findMany({ where: { status: "TERVERIFIKASI" }, orderBy: { name: "asc" } });
  if (members.length < 2) throw new Error("Butuh minimal 2 anggota terverifikasi — jalankan seed utama & seed-fitur-v5 dahulu.");
  const byName = (needle: string) => members.find((m) => m.name.toLowerCase().includes(needle.toLowerCase()));
  const m1 = byName("Insan Barokah") ?? members[0];
  const m2 = byName("Mabrur") ?? members[1] ?? m1;
  const m3 = byName("Safar Madinah") ?? members[2] ?? m1;
  const m4 = members[3] ?? m1;

  const packages = await prisma.tourPackage.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "asc" } });
  const pkg = (i: number) => packages[i % Math.max(1, packages.length)] ?? null;

  const cards = await prisma.pilgrimCard.findMany({ orderBy: { cardNo: "asc" } });
  const card = (i: number) => cards[i % Math.max(1, cards.length)] ?? null;

  // ---------- VENDOR (hulu) ----------
  console.log("🏢 Menyemai jaringan vendor…");
  const vendors = await prisma.$transaction([
    prisma.vendor.create({ data: { name: "Anjum Hotel Makkah", category: "HOTEL_MAKKAH", city: "Makkah", country: "SA", contact: "Ahmad Al-Qurashi", phone: "+966 12 571 5000", email: "reservation@anjum.example", services: "Hotel 5★ 800 kamar, 300 m dari Masjidil Haram, khusus melayani grup Indonesia, catering Asia tersedia.", rating: 4.7, verified: true } }),
    prisma.vendor.create({ data: { name: "Swissôtel Al Maqam Makkah", category: "HOTEL_MAKKAH", city: "Makkah", country: "SA", contact: "Sara Mansour", phone: "+966 12 577 7000", services: "Hotel 5★ di Abraj Al Bait, akses langsung ke Haram, ballroom grup 500 pax.", rating: 4.6, verified: true } }),
    prisma.vendor.create({ data: { name: "InterContinental Dar Al Iman", category: "HOTEL_MADINAH", city: "Madinah", country: "SA", contact: "Yusuf Barakat", phone: "+966 14 826 8888", services: "Hotel 5★ tepat di depan Pintu 357 Masjid Nabawi, 180 kamar grup.", rating: 4.8, verified: true } }),
    prisma.vendor.create({ data: { name: "Sapta Trans Umrah Fleet", category: "TRANSPORT", city: "Jakarta", country: "ID", contact: "Budi Santoso", phone: "+62 21 555 0123", services: "45 bus big bus & medium bus AC, armada tahun baru, driver terlatih rute Makkah–Madinah–Jeddah.", rating: 4.4, verified: true } }),
    prisma.vendor.create({ data: { name: "Al-Rahma Halal Catering", category: "CATERING", city: "Jeddah", country: "SA", contact: "Kholilur Rohman", phone: "+966 55 123 4567", services: "Katering masakan Indonesia 5.000 pax/hari, menu ramadhan & sahur, HACCP certified.", rating: 4.5, verified: true } }),
    prisma.vendor.create({ data: { name: "Al-Mashaer Umrah Handler", category: "HANDLER", city: "Jeddah", country: "SA", contact: "Faisal Al-Harbi", phone: "+966 12 666 8800", services: "Handler bandara King Abdulaziz, visa processing, mokimah permit, ambulans standby grup.", rating: 4.3, verified: true } }),
    prisma.vendor.create({ data: { name: "Haramain Train Group Desk", category: "TRANSPORT", city: "Makkah", country: "SA", contact: "Naif Al-Otaibi", phone: "+966 9200 88888", services: "Group booking kereta cepat Makkah–Madinah (Haramain), charter coach per gerbong.", rating: 4.6, verified: true } }),
    prisma.vendor.create({ data: { name: "Garuda Indonesia Group Sales", category: "AVIATION", city: "Jakarta", country: "ID", contact: "Rina Adisti", phone: "+62 21 2560 9800", services: "Charter & group fare Jeddah/Madinah, extra baggage 10 kg jamaah, program reschedule khusus.", rating: 4.5, verified: true } }),
    prisma.vendor.create({ data: { name: "Takaful Umrah Insurance (TPA)", category: "TPA", city: "Jakarta", country: "ID", contact: "Dewi Kartika", phone: "+62 21 777 4567", services: "Asuransi perjalanan ibadah syariah, claim bengkak-penyakit, asuransi kecelakaan diri sampai 500 jt.", rating: 4.2, verified: false } }),
    prisma.vendor.create({ data: { name: "Bank Syariah Indonesia — Segment Haji", category: "FINANCE", city: "Jakarta", country: "ID", contact: "Hasan Basri", phone: "+62 21 1500777", services: "Pembiayaan umrah murabahah, escrow DP jamaah, zakat management rombongan.", rating: 4.4, verified: true } }),
    prisma.vendor.create({ data: { name: "Zamzam Souvenir & Ekorodam", category: "CATERING", city: "Madinah", country: "SA", contact: "Abdul Ghani", phone: "+966 59 222 3344", services: "Paket ekorodam jamaah, air zamzam 5L packing, kurma ajwa grosir.", rating: 4.0, verified: false, status: "SUSPENDED", note: "Sementara ditunda — pengecekan legalitas ulang." } }),
    prisma.vendor.create({ data: { name: "Madinah Mobility Care", category: "TRANSPORT", city: "Madinah", country: "SA", contact: "Omar Siddiq", phone: "+966 56 777 8899", services: "Kursi roda & gurney listrik, pendampingan lansia dari hotel ke Haram, 200 unit armada.", rating: 4.7, verified: true } }),
  ]);
  console.log(`   → ${vendors.length} vendor`);

  // ---------- COMPLIANCE HUB (hulu) ----------
  console.log("🛡️ Menyemai dokumen kepatuhan…");
  const docsData: { memberId: string; kind: string; docNo: string; issuedBy: string; issuedAt: Date; expiresAt: Date; verified: boolean; note?: string }[] = [
    { memberId: m1.id, kind: "SIUJK", docNo: "SIUJK-2023/0451", issuedBy: "Kemenag RI", issuedAt: at(-720), expiresAt: at(400), verified: true },
    { memberId: m1.id, kind: "COP", docNo: "COP-UMROH/2026/112", issuedBy: "Kemenag RI — IHR", issuedAt: at(-300), expiresAt: at(65), verified: true, note: "Perpanjangan COP diproses sejak bulan lalu." },
    { memberId: m1.id, kind: "ASURANSI", docNo: "POL-TKF/2026/8891", issuedBy: "Takaful Umrah Insurance", issuedAt: at(-90), expiresAt: at(275), verified: true },
    { memberId: m2.id, kind: "SIUJK", docNo: "SIUJK-2024/1102", issuedBy: "Kemenag RI", issuedAt: at(-400), expiresAt: at(700), verified: true },
    { memberId: m2.id, kind: "PTA", docNo: "PTA/2026/3021", issuedBy: "Kemenag RI — BPHI", issuedAt: at(-120), expiresAt: at(80), verified: false },
    { memberId: m3.id, kind: "SIUJK", docNo: "SIUJK-2021/0312", issuedBy: "Kemenag RI", issuedAt: at(-1600), expiresAt: at(-12), verified: true, note: "Sedang dalam proses perpanjangan — SLO diberikan sementara." },
    { memberId: m3.id, kind: "RENCANA_KERJA", docNo: "RK-2026/077", issuedBy: "Kemenag RI", issuedAt: at(-60), expiresAt: at(305), verified: true },
    { memberId: m4.id, kind: "SKAI", docNo: "SKAI/2026/5510", issuedBy: "Bank Indonesia", issuedAt: at(-150), expiresAt: at(215), verified: false },
  ];
  for (const d of docsData) await prisma.complianceDoc.create({ data: d });
  console.log(`   → ${docsData.length} dokumen (2 segera berakhir, 1 kedaluwarsa)`);

  // ---------- BURSA KURSI (hulu — diferensiasi) ----------
  console.log("🔀 Menyemai bursa kursi…");
  const p0 = pkg(0), p1 = pkg(1), p2 = pkg(2);
  await prisma.seatListing.create({ data: { memberId: m1.id, packageId: p0?.id, side: "OFFER", seats: 8, pricePerSeat: 26500000, departureDate: at(14), route: "Jakarta – Jeddah", note: "Sisa kursi rombongan CP Jakarta — transfer 70% DP. Kompetitor tidak punya mekanisme ini!", status: "OPEN" } });
  await prisma.seatListing.create({ data: { memberId: m2.id, packageId: p1?.id, side: "OFFER", seats: 5, pricePerSeat: 33000000, departureDate: at(21), route: "Bekasi – Jeddah (Plus Kairo)", note: "Kursi bagian depan bus, hotel 150 m dari Haram.", status: "OPEN" } });
  await prisma.seatListing.create({ data: { memberId: m3.id, packageId: p2?.id, side: "OFFER", seats: 12, pricePerSeat: 0, departureDate: at(30), route: "Surabaya – Madinah", note: "Fleksibel harga — prioritas anggota MUHDIN Jatim.", status: "OPEN" } });
  const taker1 = await prisma.seatListing.create({ data: { memberId: m4.id, packageId: p0?.id, side: "OFFER", seats: 6, pricePerSeat: 27500000, departureDate: at(18), route: "Jakarta – Madinah", note: "1 bus 44 kursi kurang 6 jamaah.", status: "RESERVED", takerMemberId: m1.id, takerNote: "Ambil 6 kursi — ada rombongan arisan Kelapa Gading." } });
  void taker1;
  const deal1 = await prisma.seatListing.create({ data: { memberId: m2.id, side: "WANTED", seats: 10, pricePerSeat: 0, departureDate: at(45), route: "Bekasi – Jeddah", note: "Mencari kursi semester ini untuk korporat BUMN.", status: "DEAL", takerMemberId: m3.id, takerNote: "Deal — gabung rombongan Safar Madinah batch Maret." } });
  void deal1;
  await prisma.seatListing.create({ data: { memberId: m1.id, side: "WANTED", seats: 4, pricePerSeat: 0, departureDate: at(60), route: "Medan – Madinah", note: "Keluarga satu mahram butuh 4 kursi batch April.", status: "OPEN" } });
  console.log("   → 6 listing (3 OPEN offer, 1 WANTED, 1 RESERVED, 1 DEAL)");

  // ---------- KOLAM MUTHOWIF (hulu) ----------
  console.log("🌙 Menyemai kolam muthowif…");
  const muthowifsData = [
    { fullName: "Ust. H. Abdullah Siddik", certNo: "MUT-KEM/2024/0912", agency: "Lembaga Manasik Kemenag", languages: "ID,AR", specialties: "Manasik reguler, fikih haji wanita", experienceYears: 12, rating: 4.8, availability: "AVAILABLE", memberId: m1.id },
    { fullName: "Ustzh. Fatimah Az-Zahra", certNo: "MUT-KEM/2025/2210", agency: "Pesantren Hajar Aswad", languages: "ID,AR", specialties: "Pendampingan jamaah wanita & lansia", experienceYears: 8, rating: 4.9, availability: "AVAILABLE", memberId: m2.id },
    { fullName: "H. Muhammad Ridwan, S.H.I.", certNo: "MUT-KEM/2022/0443", agency: "IPHI Jakarta", languages: "ID,EN", specialties: "Rombongan korporat, first-timer", experienceYears: 15, rating: 4.6, availability: "ASSIGNED", memberId: m1.id },
    { fullName: "Ust. Karim Belhaj", certNo: "SA-HAJJ/3312", agency: "Al-Mashaer Group (native)", languages: "AR,EN", specialties: "Tours arkeologi islamik, sejarah Haramain", experienceYears: 10, rating: 4.5, availability: "AVAILABLE", memberId: null },
    { fullName: "Ust. Syafiq Abdul Aziz", certNo: "MUT-KEM/2023/1567", agency: "Lembaga Manasik Kemenag", languages: "ID,AR,EN", specialties: "Trilingual, rombongan muallaf", experienceYears: 6, rating: 4.7, availability: "AVAILABLE", memberId: m3.id },
    { fullName: "Ustzh. Aisyah Humaira", certNo: "MUT-KEM/2025/3301", agency: "IIQ Jakarta", languages: "ID", specialties: "Manasik anak & keluarga, teen camp ibadah", experienceYears: 4, rating: 4.4, availability: "AVAILABLE", memberId: m2.id },
    { fullName: "H. Ahmad Zainuddin", certNo: "MUT-KEM/2019/0102", agency: "PHI Heritage", languages: "ID,AR", specialties: "Haji khusus, pendampingan medis ringan", experienceYears: 20, rating: 4.9, availability: "UNAVAILABLE", memberId: m4.id, note: "Assigned haji musim 2026 — buka slot lagi Desember." },
  ];
  for (const m of muthowifsData) {
    const { note, ...data } = m;
    // Catatan opsional dilebur ke spesialisasi (model Muthowif tidak punya kolom note).
    const specialties = note ? `${data.specialties} — ${note}` : data.specialties;
    await prisma.muthowif.create({ data: { ...data, specialties, phone: "+62 811 0000 000" } });
  }
  console.log(`   → ${muthowifsData.length} muthowif`);

  // ---------- BRANKAS JAMAAH (proses) ----------
  console.log("🗄️ Menyemai brankas dokumen jamaah…");
  const c1 = card(0), c2 = card(1), c3 = card(2), c4 = card(3), c5 = card(4), c6 = card(5);
  const vaultRows: { cardId: string | null; kind: string; docNo: string; issue: number; expiry: number; status: string; note?: string }[] = [
    { cardId: c1?.id, kind: "PASPOR", docNo: "C12884567", issue: -600, expiry: 765, status: "VERIFIED" },
    { cardId: c1?.id, kind: "VAKSIN", docNo: "MEN-IHV/2026/0231", issue: -40, expiry: 690, status: "VERIFIED" },
    { cardId: c2?.id, kind: "PASPOR", docNo: "X77219045", issue: -300, expiry: 465, status: "VERIFIED" },
    { cardId: c2?.id, kind: "VISA", docNo: "UMR-SA-77120", issue: -20, expiry: 40, status: "PENDING", note: "Unggah ulang scan visa — halaman pertama terpotong." },
    { cardId: c3?.id, kind: "PASPOR", docNo: "C55120987", issue: -1500, expiry: 45, status: "VERIFIED", note: "Paspor hampir habis — sudah daftar e-passport pembaruan." },
    { cardId: c3?.id, kind: "ASURANSI", docNo: "POL-TKF/2026/9001", issue: -10, expiry: 355, status: "VERIFIED" },
    { cardId: c4?.id, kind: "TIKET", docNo: "GA-856/JKT-JED", issue: -5, expiry: 21, status: "PENDING" },
    { cardId: c5?.id, kind: "PASPOR", docNo: "Z90112233", issue: -1800, expiry: -5, status: "VERIFIED", note: "Kedaluwarsa — jamaah diminta perbarui sebelum keberangkatan." },
    { cardId: c6?.id, kind: "VAKSIN", docNo: "MEN-IHV/2024/1188", issue: -700, expiry: 30, status: "VERIFIED", note: "Booster meningitis diproses Puskesmas." },
    { cardId: c6?.id, kind: "LAINNYA", docNo: "SKMM/2026/77", issue: -30, expiry: 0, status: "REJECTED", note: "Surat keterangan mahram — mahram tidak satu pesawat." },
  ];
  for (const r of vaultRows) {
    if (!r.cardId) continue;
    await prisma.jamaahDoc.create({
      data: {
        pilgrimCardId: r.cardId, kind: r.kind, docNo: r.docNo,
        issueDate: at(r.issue), expiryDate: r.expiry === 0 ? null : at(r.expiry),
        verifyStatus: r.status, note: r.note ?? null,
      },
    });
  }
  console.log(`   → ${vaultRows.filter((r) => r.cardId).length} dokumen (1 kedaluwarsa, 2 segera)`);

  // ---------- ULASAN TERVERIFIKASI (hilir) ----------
  console.log("⭐ Menyemai ulasan jamaah…");
  const reviewsData = [
    { cardIdx: 0, pkgIdx: 0, rating: 5, hotel: 5, transport: 5, guide: 5, body: "Alhamdulillah hotel 300 meter dari Haram, makanan Indonesia enak, muthowif sabar banget bimbing manasik. Anak saya yang 9 tahun paham tata umrah sekarang.", status: "APPROVED" },
    { cardIdx: 1, pkgIdx: 1, rating: 4, hotel: 5, transport: 4, guide: 4, body: "Hotel top, tapi bus dari Kairo ke Piramida agak lama nunggu. Overall tetap memuaskan, tim panitia responsif di grup WhatsApp rombongan.", status: "APPROVED" },
    { cardIdx: 2, pkgIdx: 2, rating: 5, hotel: 4, transport: 5, guide: 5, body: "Untuk harga segitu, melebihi ekspektasi. Muthowifnya hafal sejarah setiap titik ziarah — jam sholang jadi kelas sejarah berjalan.", status: "APPROVED" },
    { cardIdx: 3, pkgIdx: 0, rating: 4, hotel: 4, transport: 4, guide: 4, body: "Slot boarding diab strip panjang, tapi crew membantu lansia satu-satu. Air zamzam 5 liter benar diberikan seperti dijanjikan.", status: "APPROVED" },
    { cardIdx: 4, pkgIdx: 1, rating: 3, hotel: 4, transport: 2, guide: 3, body: "Kekurangan di transportasi — bus AC kurang dingin saat siang. Hotel dan makanan baik. Semoga diperbaiki batch berikutnya.", status: "APPROVED" },
    { cardIdx: 5, pkgIdx: 2, rating: 5, hotel: 5, transport: 5, guide: 5, body: "Pengalaman sekali seumur hidup. Manasik on the spot di depan Makam Nabi — nangis, subhanallah. Terima kasih MUHDIN, penyelenggara terverifikasi memang beda.", status: "APPROVED" },
    { cardIdx: 6, pkgIdx: 0, rating: 5, hotel: 5, transport: 4, guide: 5, body: "Kedua kalinya dengan penyelenggara yang sama. Konsisten bagus. Kartu jamaah QR-nya juga memudahkan panitia saat check-in hotel.", status: "APPROVED" },
    { cardIdx: 7, pkgIdx: 1, rating: 4, hotel: 4, transport: 4, guide: 4, body: "Perjalanan lancar, muthowif ramah dengan anak-anak. Menunggu dokumentasi videonya dirilis.", status: "PENDING" },
  ];
  for (const r of reviewsData) {
    const c = card(r.cardIdx);
    const p = pkg(r.pkgIdx);
    if (!c || !p) continue;
    await prisma.pilgrimReview.create({
      data: {
        packageId: p.id, cardNo: c.cardNo, authorName: c.fullName,
        rating: r.rating, hotelRate: r.hotel, transportRate: r.transport, guideRate: r.guide,
        body: r.body, status: r.status, reviewedBy: r.status === "APPROVED" ? "admin@muhdin.web.id" : null,
        reviewedAt: r.status === "APPROVED" ? at(-1) : null,
      },
    });
  }
  console.log(`   → ${reviewsData.length} ulasan (7 approved, 1 pending)`);

  // ---------- DIREKTORI DARURAT (proses) ----------
  console.log("🚨 Menyemai direktori darurat…");
  const sosData = [
    { category: "EMERGENCY", name: "Darurat Nasional Saudi (911)", city: "Nasional", country: "SA", address: "Seluruh wilayah KSA", phone: "911", hours: "24 jam", featured: true, note: "Satu nomor untuk polisi, ambulans, dan pemadam di Makkah/Madinah/Riyadh." },
    { category: "POLICE", name: "Polisi (999)", city: "Nasional", country: "SA", address: "Seluruh wilayah KSA", phone: "999", hours: "24 jam" },
    { category: "EMERGENCY", name: "Ambulans Saudi Red Crescent (997)", city: "Nasional", country: "SA", address: "Seluruh wilayah KSA", phone: "997", hours: "24 jam", note: "Ambulans gratis di seluruh Saudi." },
    { category: "EMBASSY", name: "Kedutaan Besar RI Riyadh", city: "Riyadh", country: "SA", address: "Diplomatic Quarter, Riyadh 11693", phone: "+966 11 488 1100", hours: "08:00–16:00", featured: true },
    { category: "CONSULATE", name: "Konsulat RI (KJRI) Jeddah", city: "Jeddah", country: "SA", address: "Hay Al Zaher District, Jeddah 23425", phone: "+966 12 669 4412", hours: "07:30–15:30", featured: true, note: "Layanan darurat warga Indonesia aktif 24 jam via petugas piket." },
    { category: "CONSUL_HAJJ", name: "Konsul Konsuler Haji Jeddah", city: "Jeddah", country: "SA", address: "Kompleks KJRI Jeddah", phone: "+966 12 669 4412 ext. 202", hours: "24 jam (musim haji)", note: "Penanganan kendala paspor, kehilangan tasik, dan jamna haji." },
    { category: "CONSUL_HAJJ", name: "Konsul Konsuler Haji Madinah", city: "Madinah", country: "SA", address: "Jl. Khalid Bin Walid, Madinah", phone: "+966 14 848 1234", hours: "24 jam (musim haji)" },
    { category: "KKI", name: "Klinik Kesehatan Indonesia (KKI) Jeddah", city: "Jeddah", country: "SA", address: "Jl. Al Andalus, dekat KJRI Jeddah", phone: "+966 12 669 4412 ext. 305", hours: "07:00–20:00", note: "Pemeriksaan kesehatan jamaah, koordinasi rumah sakit rujukan." },
    { category: "HOSPITAL", name: "RS Ajyad Makkah", city: "Makkah", country: "SA", address: "Ajyad Al Masafi, 300 m dari Masjidil Haram", phone: "+966 12 545 5555", hours: "24 jam" },
    { category: "HOSPITAL", name: "RS Al Noor Makkah", city: "Makkah", country: "SA", address: "Jl. Ibrahim Al Khalil, Makkah 24241", phone: "+966 12 554 0000", hours: "24 jam" },
    { category: "HOSPITAL", name: "RS King Fahd Madinah", city: "Madinah", country: "SA", address: "King Abdullah Rd, Madinah 42351", phone: "+966 14 838 8888", hours: "24 jam" },
    { category: "HOSPITAL", name: "RS King Abdulaziz Jeddah", city: "Jeddah", country: "SA", address: "Al Sulaimaniyah District, Jeddah 21441", phone: "+966 12 665 3333", hours: "24 jam" },
    { category: "CLINIC", name: "Klinik Bintang Madinah", city: "Madinah", country: "SA", address: "Central Area, dekat Masjid Nabawi", phone: "+966 14 826 5555", hours: "08:00–23:00" },
    { category: "EMERGENCY", name: "Pemadam Kebakaran (998)", city: "Nasional", country: "SA", address: "Seluruh wilayah KSA", phone: "998", hours: "24 jam" },
  ];
  for (const s of sosData) await prisma.sosPoint.create({ data: { ...s, phone2: null } });
  console.log(`   → ${sosData.length} titik darurat`);

  console.log("✅ Seed fitur v6 selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
