// ====== BRAND DATA MUHDIN (dari Infografis & Whitepaper) ======

export const BRAND = {
  name: "MUHDIN",
  fullName: "MUHDIN NUSANTARA",
  legalName: "Masyarakat Umroh Haji Digital Nusantara",
  positioning: "Trusted Pilgrim Ecosystem",
  tagline: "Bersama Melayani Tamu Allah",
  taglineEn: "One Ecosystem. One Data. One Standard. One Trust. One Journey.",
  taglineId: "Satu Ekosistem. Satu Data. Satu Standar. Satu Trust.",
  // Branding utama (wajib user, Task 35-b) — tampil di hero, finale, & SEO.
  promise: "EKOSISTEM UMROH HAJI DIGITAL TERMURAH BERGARANSI",
  poweredBy: "Powered by MHUTU Global Sistem",
  arabic: "\u0644\u0628\u064a\u0643 \u0627\u0644\u0644\u0647\u0645 \u0644\u0628\u064a\u0643",
  arabicMeaning: "Labbaik Allahumma Labbaik",
  motto: "Melayani dengan Amanah, Profesional, Terstandar dan Penuh Keberkahan",
  connecting: "Connecting Indonesia to The Holy Journey",
  // Kontak resmi (Task 40) — WhatsApp official & kantor-kantor MUHDIN.
  whatsappDisplay: "0811 1116 5165",
  whatsappIntl: "6281111165165",
  waGreeting: "Assalamu'alaikum, saya ingin bertanya tentang MUHDIN.",
  // ROLE 25 (Compliance): tanpa klaim "Operator Nusuk"/endorsement pemerintah.
  edition: "Ekosistem Penyelenggaraan Ibadah Terpercaya — Terhubung dengan jalur resmi Nusuk",
};

// ====== COUNTER PENDAFTAR GRATIS (Task 44 → 52; promo "200 anggota pertama" dihapus) ======
// Kuota promo live: dihitung dari pendaftar valid (status != REJECTED) di DB
// + baseTaken (seed opsional). Angka turun otomatis setiap formulir masuk.
export const PROMO_SLOTS = {
  total: 200,
  baseTaken: 0, // seed tampilan (mis. 3 → langsung "sisa 197"); 0 = murni hitungan nyata
  urgencyBelow: 20, // sisa ≤ ini → teks "segera habis"
  pollMs: 15_000,
} as const;

export interface PartnerDef {
  code: string;
  name: string;
  fullName: string;
  role: string;
  icon: string;
}

export const PARTNERS: PartnerDef[] = [
  {
    code: "PPIU",
    name: "PPIU",
    fullName: "Perusahaan Perjalanan Ibadah Umrah",
    role: "Pintu layanan utama jamaah umrah; penanggung jawab paket, itinerary, dan pengalaman jamaah end-to-end",
    icon: "building",
  },
  {
    code: "PIHK",
    name: "PIHK",
    fullName: "Penyelenggara Perjalanan Ibadah Haji Khusus",
    role: "Penyedia skema haji khusus bagi jamaah dengan waktu tunggu panjang; kepatuhan penuh terhadap kuota resmi",
    icon: "landmark",
  },
  {
    code: "KBIHU",
    name: "KBIHU",
    fullName: "Konsorsium Biro Perjalanan Ibadah Haji",
    role: "Jaringan distribusi layanan haji khusus di tingkat daerah dan penguatan kanal pemasaran yang etis",
    icon: "network",
  },
  {
    code: "IPHI",
    name: "IPHI",
    fullName: "Ikatan Persaudaraan Haji Indonesia",
    role: "Jaringan komunitas alumni haji; edukasi jamaah, penguatan literasi ibadah, dan pengawasan sosial",
    icon: "heart-handshake",
  },
  {
    code: "TW",
    name: "Travel Wisata",
    fullName: "Penyelenggara Perjalanan Wisata Halal & Ziarah",
    role: "Perluasan pasar produk ziarah-halal dan integrasi produk ekonomi syariah ke dalam ekosistem",
    icon: "plane",
  },
];

export interface ValueDef {
  name: string;
  meaning: string;
  icon: string;
}

export const CORE_VALUES: ValueDef[] = [
  {
    name: "Amanah",
    meaning: "Menepati janji layanan, menjaga dana jamaah dengan tata kelola yang dapat diaudit, dan menempatkan kepentingan jamaah di atas kepentingan sesaat.",
    icon: "scale",
  },
  {
    name: "Profesional",
    meaning: "Seluruh tenaga dan mitra bersertifikasi dengan kompetensi terukur, prosedur baku, dan penilaian mutu berkala.",
    icon: "badge-check",
  },
  {
    name: "Terintegrasi",
    meaning: "Satu data dan satu alur layanan dari registrasi hingga kepulangan, tersambung secara real time antar mitra.",
    icon: "workflow",
  },
  {
    name: "Transparan",
    meaning: "Harga, cakupan layanan, status kuota, dan rekam jejak penyelenggara terbuka bagi jamaah dan regulator.",
    icon: "eye",
  },
  {
    name: "Tepercaya",
    meaning: "Legalitas dan rekam jejak mitra diverifikasi, sanksi ditegakkan secara konsisten, dan mutu diaudit secara berkala.",
    icon: "shield-check",
  },
];

export interface PillarDef {
  name: string;
  description: string;
  icon: string;
}

export const TECH_PILLARS: PillarDef[] = [
  {
    name: "MUHDIN App",
    description: "Antarmuka tunggal jamaah untuk booking, itinerary, tracking, dan layanan 24/7.",
    icon: "smartphone",
  },
  {
    name: "GPS & IoT Tracking",
    description: "Pantau lokasi rombongan dan angkutan secara real time untuk keamanan dan efisiensi.",
    icon: "map-pin",
  },
  {
    name: "AI & Big Data",
    description: "Prediksi permintaan, pengelolaan kapasitas, dinamika harga, dan deteksi anomali keamanan.",
    icon: "brain-circuit",
  },
  {
    name: "Integrasi Nusuk",
    description: "Jantung sistem yang menyinkronkan data, jadwal, dan kuota resmi dengan pemerintah Saudi.",
    icon: "git-merge",
  },
  {
    name: "Dashboard Monitoring",
    description: "Melayani tiga kelas pengguna — pengusaha, agen, dan regulator — dengan akses berjenjang.",
    icon: "layout-dashboard",
  },
  {
    name: "Multi Bahasa",
    description: "Dukungan Indonesia, Arab, dan Inggris memastikan layanan dipahami seluruh pihak.",
    icon: "languages",
  },
];

export const BENEFITS: string[] = [
  "Ibadah lebih tenang dan nyaman",
  "Layanan terpadu satu pintu",
  "Kepastian jadwal dan kuota",
  "Efisiensi biaya dan waktu",
  "Keamanan dengan tracking real time",
  "Peningkatan kualitas layanan",
  "Keberkahan usaha yang berkelanjutan",
];

/* ====== TASK 34 — Whitepaper Edisi 1.0 (Sept 2026) sync ======
   Tabel 5 (Sumber Pendapatan & Dasar Akad) + Tabel 8 (Manfaat Stakeholder).
   Teks terlokalisasi tinggal di i18n: about.biz.r1..r6 & about.stake.s1..s7. */

export interface I18nItemDef {
  id: string;
  icon: string;
}

/** Sumber pendapatan MUHDIN — Bab 8 Whitepaper (akad syariah). */
export const REVENUE_SOURCES: I18nItemDef[] = [
  { id: "r1", icon: "wallet" }, // Iuran keanggotaan — Wakalah (perwakilan)
  { id: "r2", icon: "monitor" }, // Biaya teknologi & platform — Ijarah (sewa jasa)
  { id: "r3", icon: "trending-up" }, // Komisi ekosistem — Ju'alah (imbal hasil)
  { id: "r4", icon: "graduation-cap" }, // Sertifikasi & pelatihan — Muwakalah
  { id: "r5", icon: "bar-chart-3" }, // Layanan data & kepatuhan — Wakalah (jasa profesional)
  { id: "r6", icon: "handshake" }, // Kemitraan strategis — Musyarakah (kemitraan)
];

/** Manfaat bagi 7 kelompok pemangku kepentingan — Bab 11 Whitepaper. */
export const STAKEHOLDER_GROUPS: I18nItemDef[] = [
  { id: "s1", icon: "heart-handshake" }, // Jamaah
  { id: "s2", icon: "building" }, // PPIU & PIHK
  { id: "s3", icon: "network" }, // KBIHU & IPHI
  { id: "s4", icon: "plane" }, // Travel wisata halal-ziarah
  { id: "s5", icon: "scale" }, // Regulator
  { id: "s6", icon: "landmark" }, // Pemerintah Saudi & Nusuk
  { id: "s7", icon: "boxes" }, // UMKM & masyarakat
];

export const CLUSTERS = [
  {
    name: "Akses & Mobilitas",
    range: "Ekosistem 1-5",
    description: "Memastikan jamaah bergerak secara legal, cepat, dan terpandu — dari visa hingga pembimbingan ibadah.",
    icon: "plane-takeoff",
  },
  {
    name: "Pengalaman Ibadah",
    range: "Ekosistem 6-10",
    description: "Kualitas inti pengalaman ibadah — akomodasi, transportasi, ziarah, Raudah, dan konsumsi.",
    icon: "moon-star",
  },
  {
    name: "Nilai Tambah & Jaminan Mutu",
    range: "Ekosistem 11-13",
    description: "Nilai ekonomi dan jaminan mutu — retail UMKM, layanan satu pintu, dan command center 24/7.",
    icon: "award",
  },
];

export const MEMBER_TYPES = ["PPIU", "PIHK", "KBIHU", "IPHI", "TRAVEL_WISATA"] as const;

export const MEMBER_TYPE_LABEL: Record<string, string> = {
  PPIU: "PPIU",
  PIHK: "PIHK",
  KBIHU: "KBIHU",
  IPHI: "IPHI",
  TRAVEL_WISATA: "Travel Wisata",
};

export const MEMBER_STATUSES = ["TERVERIFIKASI", "PENDING", "SUSPENDED"] as const;

export const ARTICLE_CATEGORIES = ["Berita", "Pengumuman", "Artikel", "Press Release"] as const;

export const TUTORIAL_CATEGORIES = ["Umum", "CMS", "Jamaah", "Mitra"] as const;

export const TUTORIAL_LEVELS = ["Pemula", "Menengah", "Mahir"] as const;

export const FAQ_CATEGORIES = ["Umum", "Keanggotaan", "Jamaah", "Teknologi"] as const;

export const STATS_HIGHLIGHT = [
  { value: "1.000.000+", label: "Target Jamaah / Tahun 2030", icon: "users" },
  { value: "1.000+", label: "Target Mitra Terverifikasi", icon: "handshake" },
  { value: "10.000", label: "SDM Ibadah Bersertifikasi", icon: "badge-check" },
  { value: "24/7", label: "Command Center Pengawalan", icon: "shield-check" },
];

export const KPI_ROWS = [
  { indicator: "Jamaah terlayani kanal terverifikasi", baseline: "Pilot 50.000", target: "1.000.000+ / tahun" },
  { indicator: "Mitra aktif bersertifikasi", baseline: "100 anggota pendiri", target: "1.000+ penyelenggara" },
  { indicator: "Rasio jamaah terlacak GPS real time", baseline: "60%", target: "100%" },
  { indicator: "Kepuasan jamaah (NPS)", baseline: "Min. 40", target: "Min. 70" },
  { indicator: "Insiden penipuan anggota", baseline: "0", target: "0 (nol toleransi)" },
  { indicator: "SLA handling keberangkatan tepat waktu", baseline: "Min. 90%", target: "Min. 98%" },
  { indicator: "SDM ibadah bersertifikasi", baseline: "1.000 orang", target: "10.000 orang" },
];
