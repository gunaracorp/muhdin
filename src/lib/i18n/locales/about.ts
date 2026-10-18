/**
 * namespace "about" — dikelola oleh agent Task 14-b.
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 * Teks statis + konten lib/constants.ts (mitra, nilai, prinsip, KPI) dipetakan di sini.
 * Visi/misi/roadmap/management dari settings & API tidak diterjemahkan di frontend.
 */
export const aboutDict = {
  id: {
    about: {
      eyebrow: "Tentang MUHDIN",
      title: "Asosiasi di Atas Asosiasi",
      subtitle:
        "MUHDIN bukan pesaing pelaku industri — melainkan lapisan federasi yang menetapkan standar mutu, menyatukan akses Nusuk, mengelola teknologi bersama, dan mengawal kualitas layanan secara menyeluruh.",
      visionTitle: "Visi",
      visionFallback:
        "Menjadi jaringan ekosistem layanan umroh dan haji paling tepercaya, terstandar, dan terdigitalisasi dari dan menuju Indonesia pada tahun 2030.",
      missionTitle: "Lima Misi",
      missions: {
        m1: "Mengonsolidasikan penyelenggara jasa ibadah Indonesia dalam satu payung tata kelola standar mutu dan etika bersama.",
        m2: "Mengintegrasikan seluruh rantai layanan jamaah melalui platform digital real-time dengan Nusuk dan regulator.",
        m3: "Meningkatkan profesionalisme SDM ibadah melalui sertifikasi tour leader dan mutawif yang seragam.",
        m4: "Melindungi jamaah melalui transparansi harga, kepastian layanan, dan mekanisme perlindungan finansial.",
        m5: "Meningkatkan daya saing industri Indonesia dalam kemitraan dengan pemerintah dan penyedia layanan Arab Saudi.",
      },
      heritage: {
        eyebrow: "Warisan Sejarah",
        title: "Dari Pelopor Tradisi menuju Pelopor Digital",
        subtitle: "Garis darah penyelenggaraan ibadah Nusantara — lahir sebelum negara menata, kini lahir kembali dalam wajah digital.",
        era1Label: "Sebelum 1946",
        era1Title: "PHI & IPHI",
        era1Desc: "Perjalanan Haji Indonesia (PHI) dan Ikatan Persaudaraan Haji Indonesia (IPHI) — penyelenggara haji & umrah pertama di Nusantara, jauh sebelum Kementerian Agama RI berdiri.",
        era2Label: "Era Blueprint",
        era2Title: "Blueprint Haji & Umrah Indonesia",
        era2Desc: "Para tokoh yang kini duduk di Pengurus Pusat MUHDIN adalah arsitek blueprint penyelenggaraan haji & umrah Indonesia — karya abadi yang lahir sebelum ada payung hukum.",
        era3Label: "Kini · 2026",
        era3Title: "MUHDIN — Pertama di Dunia",
        era3Desc: "Garis pelopor itu berlanjut: MUHDIN menjadi asosiasi haji & umrah digital pertama di dunia — warisan tradisi, wajah teknologi.",
      },
      fedEyebrow: "Arsitektur Kelembagaan",
      fedTitle: "Prinsip Federasi: Menghubungkan, Bukan Menggantikan",
      fedSubtitle:
        "Sebagaimana IATA bagi industri penerbangan — MUHDIN menyediakan infrastruktur bersama, standar interoperabilitas, dan penjaminan mutu yang tidak efisien bila dibangun setiap pelaku secara terpisah.",
      principles: {
        p1Title: "Sertifikasi & Rating Mutu",
        p1Desc: "Dinilai dari kepatuhan operasional, kepuasan jamaah, dan integritas keuangan.",
        p2Title: "Dewan Etik & Sanksi Berjenjang",
        p2Desc: "Teguran, penghentian sementara, hingga pemberhentian keanggotaan dan pelaporan regulator.",
        p3Title: "Audit Mutu Berkala",
        p3Desc: "Hasil audit terintegrasi ke dashboard monitoring dan menjadi dasar peringkat publik.",
      },
      partners: {
        PPIU: "Perusahaan Perjalanan Ibadah Umrah",
        PIHK: "Penyelenggara Perjalanan Ibadah Haji Khusus",
        KBIHU: "Konsorsium Biro Perjalanan Ibadah Haji",
        IPHI: "Ikatan Persaudaraan Haji Indonesia",
        TW: "Penyelenggara Perjalanan Wisata Halal & Ziarah",
      },
      valuesEyebrow: "Nilai Utama",
      valuesTitle: "Lima Nilai, Satu Standar Kerja",
      values: {
        Amanah: {
          name: "Amanah",
          meaning:
            "Menepati janji layanan, menjaga dana jamaah dengan tata kelola yang dapat diaudit, dan menempatkan kepentingan jamaah di atas kepentingan sesaat.",
        },
        Profesional: {
          name: "Profesional",
          meaning:
            "Seluruh tenaga dan mitra bersertifikasi dengan kompetensi terukur, prosedur baku, dan penilaian mutu berkala.",
        },
        Terintegrasi: {
          name: "Terintegrasi",
          meaning:
            "Satu data dan satu alur layanan dari registrasi hingga kepulangan, tersambung secara real time antar mitra.",
        },
        Transparan: {
          name: "Transparan",
          meaning:
            "Harga, cakupan layanan, status kuota, dan rekam jejak penyelenggara terbuka bagi jamaah dan regulator.",
        },
        Tepercaya: {
          name: "Tepercaya",
          meaning:
            "Legalitas dan rekam jejak mitra diverifikasi, sanksi ditegakkan secara konsisten, dan mutu diaudit secara berkala.",
        },
      },
      mgmtEyebrow: "Struktur Organisasi",
      mgmtTitle: "Dewan Pengurus MUHDIN",
      mgmtSubtitle: "Kepengurusan yang berintegritas memastikan standar ekosistem ditegakkan secara konsisten.",
      org: {
        pp: "Pengurus Pusat",
        ppFull: "Pimpinan tertinggi MUHDIN di tingkat nasional",
        appoint: "Penunjukan",
        bakorwil: "Bakorwil Provinsi",
        bakorwilFull: "Badan Koordinator Wilayah Provinsi",
        bakorcab: "Bakorcab Kab/Kota",
        bakorcabFull: "Badan Koordinasi Kabupaten/Kota",
        note: "Bakorwil dan Bakorcab diangkat melalui penunjukan oleh Pengurus Pusat.",
        seePengurus: "Lihat Susunan Pengurus Lengkap",
        credibility: "Pengurus Pusat MUHDIN adalah tokoh nasional dan internasional yang berpengaruh di bidang haji & umrah — termasuk para arsitek blueprint haji & umrah Indonesia.",
      },
      roadmapEyebrow: "Peta Jalan 2026-2030",
      roadmapTitle: "Implementasi Bertahap Berbasis Bukti",
      deliverablesLabel: "Deliverables Kunci",
      kpi: {
        title: "Indikator Keberhasilan 2030",
        subtitle:
          "Dilaporkan tahunan kepada Dewan Pengurus dan regulator — ambisius, terukur, dan dikalibrasi bersama asosiasi mitra.",
        colIndicator: "Indikator",
        colBaseline: "Baseline 2026",
        colTarget: "Target 2030",
        rows: {
          r1: { indicator: "Jamaah terlayani kanal terverifikasi", baseline: "Pilot 50.000", target: "1.000.000+ / tahun" },
          r2: { indicator: "Mitra aktif bersertifikasi", baseline: "100 anggota pendiri", target: "1.000+ penyelenggara" },
          r3: { indicator: "Rasio jamaah terlacak GPS real time", baseline: "60%", target: "100%" },
          r4: { indicator: "Kepuasan jamaah (NPS)", baseline: "Min. 40", target: "Min. 70" },
          r5: { indicator: "Insiden penipuan anggota", baseline: "0", target: "0 (nol toleransi)" },
          r6: { indicator: "SLA handling keberangkatan tepat waktu", baseline: "Min. 90%", target: "Min. 98%" },
          r7: { indicator: "SDM ibadah bersertifikasi", baseline: "1.000 orang", target: "10.000 orang" },
        },
      },
      cta: "Bergabung Bersama MUHDIN",
      tech: {
        eyebrow: "Tumpuan Teknologi Digital",
        title: "Enam Pilar Teknologi Terpadu",
        subtitle:
          "Seluruh pilar berjalan di atas satu arsitektur data — profil jamaah sebagai entitas tunggal dari registrasi hingga kepulangan, dengan perlindungan data pribadi sesuai regulasi Indonesia.",
        p1: { name: "MUHDIN App", desc: "Antarmuka tunggal jamaah untuk booking, itinerary, tracking, dan layanan 24/7." },
        p2: { name: "GPS & IoT Tracking", desc: "Memantau lokasi rombongan dan angkutan secara real time untuk keamanan dan efisiensi operasional." },
        p3: { name: "AI & Big Data", desc: "Prediksi permintaan, pengelolaan kapasitas, dinamika harga, dan deteksi anomali keamanan." },
        p4: { name: "Integrasi Nusuk", desc: "Menyinkronkan data, jadwal, dan kuota secara resmi dengan pemerintah Arab Saudi." },
        p5: { name: "Dashboard Monitoring", desc: "Tiga kelas pengguna — pengusaha, agen, dan regulator — dengan tingkat akses berbeda sesuai kewenangan." },
        p6: { name: "Multi Bahasa", desc: "Indonesia, Arab, dan Inggris — memastikan layanan dipahami oleh seluruh pihak yang terlibat." },
      },
      stake: {
        eyebrow: "Distribusi Nilai Ekosistem",
        title: "Manfaat bagi Pemangku Kepentingan",
        subtitle:
          "Tidak ada pihak yang menanggung biaya tanpa memperoleh nilai, dan tidak ada nilai yang diciptakan tanpa kontribusi yang terukur.",
        s1: { who: "Jamaah", benefit: "Ibadah lebih tenang dan nyaman; layanan terpadu satu pintu; kepastian jadwal dan kuota; keamanan dengan tracking real time; perlindungan dana." },
        s2: { who: "PPIU & PIHK", benefit: "Akses kolektif ke Nusuk; efisiensi biaya teknologi; kredibilitas melalui rating mutu; aliran jamaah dari kanal terverifikasi." },
        s3: { who: "KBIHU & IPHI", benefit: "Kanal layanan terstandar; program edukasi jamaah; perlindungan reputasi industri." },
        s4: { who: "Travel Wisata Halal-Ziarah", benefit: "Integrasi produk ziarah-halal ke ekosistem; akses pasar yang lebih luas." },
        s5: { who: "Regulator", benefit: "Data mutu dan kepatuhan real time; penurunan insiden; efektivitas pembinaan dan perlindungan jamaah." },
        s6: { who: "Pemerintah Saudi & Nusuk", benefit: "Satu pintu kepatuhan bagi industri dari negara pengirim jamaah terbesar; kualitas dan keterpantauan jamaah terjamin." },
        s7: { who: "UMKM & Masyarakat", benefit: "Akses pasar pada segmen retail, konsumsi, dan rantai pasok halal di sekitar ekosistem." },
      },
      biz: {
        eyebrow: "Keberlanjutan Finansial",
        title: "Model Bisnis Berakar Akad Syariah",
        subtitle:
          "Keberlanjutan MUHDIN dirancang dari kontribusi ekosistem, bukan dari pungutan yang memberatkan jamaah — setiap sumber pendapatan berakar pada akad yang jelas.",
        colSource: "Sumber Pendapatan",
        colDesc: "Deskripsi",
        colAkad: "Dasar Akad",
        r1: { name: "Iuran Keanggotaan", desc: "Iuran tahunan berjenjang bagi mitra sesuai kelas layanan dan skala operasi.", akad: "Wakalah (perwakilan)" },
        r2: { name: "Biaya Teknologi & Platform", desc: "Langganan penggunaan MUHDIN App, dashboard, dan API bagi mitra.", akad: "Ijarah (sewa jasa)" },
        r3: { name: "Komisi Ekosistem", desc: "Komisi transaksi hotel, transportasi, konsumsi, dan retail dalam marketplace.", akad: "Ju'alah (imbal hasil)" },
        r4: { name: "Sertifikasi & Pelatihan", desc: "Program sertifikasi tour leader, mutawif, dan pengembangan SDM ibadah.", akad: "Muwakalah (jasa profesional)" },
        r5: { name: "Layanan Data & Kepatuhan", desc: "Laporan mutu, audit, dan riset industri bagi mitra serta regulator.", akad: "Wakalah (jasa profesional)" },
        r6: { name: "Kemitraan Strategis", desc: "Program kolaborasi, sponsorship, dan aliansi layanan ekosistem.", akad: "Musyarakah (kemitraan)" },
        note:
          "Prinsip dasarnya lugas: MUHDIN menghasilkan dari efisiensi dan nilai tambah yang diciptakan bagi mitra, sedangkan dana jamaah dikelola dengan mekanisme perlindungan seperti escrow dan takaful agar tidak terjadi dana jamaah hangus.",
        refNote:
          "Landasan kepatuhan: UU No. 8 Tahun 2019 tentang Penyelenggaraan Ibadah dan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Akses Nusuk merujuk platform resmi umrah.nusuk.sa dan hajj.nusuk.sa.",
      },
    },
  },
  en: {
    about: {
      eyebrow: "About MUHDIN",
      title: "An Association Above Associations",
      subtitle:
        "MUHDIN is not a competitor to industry players — it is a federation layer that sets quality standards, unifies Nusuk access, manages shared technology, and safeguards service quality end to end.",
      visionTitle: "Vision",
      visionFallback:
        "To become the most trusted, standardized, and digitalized ecosystem network for Umrah and Hajj services from and toward Indonesia by 2030.",
      missionTitle: "Five Missions",
      missions: {
        m1: "Consolidate Indonesian pilgrimage service providers under one governance umbrella of shared quality standards and ethics.",
        m2: "Integrate the entire pilgrim service chain through a real-time digital platform connected with Nusuk and regulators.",
        m3: "Raise the professionalism of pilgrimage personnel through uniform certification of tour leaders and mutawif.",
        m4: "Protect pilgrims through price transparency, service certainty, and financial protection mechanisms.",
        m5: "Enhance the competitiveness of Indonesia's industry in partnership with the government and service providers in Saudi Arabia.",
      },
      heritage: {
        eyebrow: "Historical Legacy",
        title: "From Tradition Pioneers to Digital Pioneers",
        subtitle: "The bloodline of the Archipelago's worship travel industry — born before the state organized it, reborn today in digital form.",
        era1Label: "Before 1946",
        era1Title: "PHI & IPHI",
        era1Desc: "Perjalanan Haji Indonesia (PHI) and Ikatan Persaudaraan Haji Indonesia (IPHI) — the first hajj & umrah organizers in the Archipelago, long before Indonesia's Ministry of Religious Affairs was established.",
        era2Label: "The Blueprint Era",
        era2Title: "The Indonesian Hajj & Umrah Blueprint",
        era2Desc: "The figures now serving on MUHDIN's Central Board are the architects of Indonesia's hajj & umrah blueprint — an enduring work created before any legal framework existed.",
        era3Label: "Today · 2026",
        era3Title: "MUHDIN — First in the World",
        era3Desc: "The pioneer lineage continues: MUHDIN becomes the world's first digital hajj & umrah association — heritage of tradition, face of technology.",
      },
      fedEyebrow: "Institutional Architecture",
      fedTitle: "The Federation Principle: Connecting, Not Replacing",
      fedSubtitle:
        "As IATA is to the airline industry — MUHDIN provides shared infrastructure, interoperability standards, and quality assurance that would be inefficient to build separately for every player.",
      principles: {
        p1Title: "Certification & Quality Rating",
        p1Desc: "Rated on operational compliance, pilgrim satisfaction, and financial integrity.",
        p2Title: "Ethics Council & Graduated Sanctions",
        p2Desc: "From warnings and temporary suspension to termination of membership and reporting to regulators.",
        p3Title: "Periodic Quality Audit",
        p3Desc: "Audit results feed into the monitoring dashboard and form the basis of public rankings.",
      },
      partners: {
        PPIU: "Umrah Travel Service Company",
        PIHK: "Organizer of Special Hajj Travel Services",
        KBIHU: "Consortium of Hajj Travel Bureaus",
        IPHI: "Indonesian Hajj Brotherhood Association",
        TW: "Halal & Ziarah Tour Operator",
      },
      valuesEyebrow: "Core Values",
      valuesTitle: "Five Values, One Standard of Work",
      values: {
        Amanah: {
          name: "Trustworthy",
          meaning:
            "Fulfilling service promises, safeguarding pilgrim funds with auditable governance, and placing the pilgrims' interests above momentary ones.",
        },
        Profesional: {
          name: "Professional",
          meaning:
            "All staff and partners are certified with measurable competence, standard procedures, and periodic quality assessments.",
        },
        Terintegrasi: {
          name: "Integrated",
          meaning:
            "One data set and one service flow from registration to departure, connected in real time across partners.",
        },
        Transparan: {
          name: "Transparent",
          meaning:
            "Prices, service scope, quota status, and provider track records are open to pilgrims and regulators.",
        },
        Tepercaya: {
          name: "Trusted",
          meaning:
            "Partner legality and track records are verified, sanctions are consistently enforced, and quality is audited periodically.",
        },
      },
      mgmtEyebrow: "Organizational Structure",
      mgmtTitle: "The MUHDIN Board",
      mgmtSubtitle: "A management team of integrity ensures ecosystem standards are consistently upheld.",
      org: {
        pp: "Central Board",
        ppFull: "MUHDIN's highest national leadership",
        appoint: "Appointed",
        bakorwil: "Provincial Bakorwil",
        bakorwilFull: "Provincial Regional Coordinating Board",
        bakorcab: "Regency/City Bakorcab",
        bakorcabFull: "Branch Coordinating Board (Regency/City)",
        note: "Bakorwil and Bakorcab are appointed by the Central Board.",
        seePengurus: "View the Full Leadership Structure",
        credibility: "MUHDIN's Central Board consists of influential national and international figures in the hajj & umrah sector — including the architects of Indonesia's hajj & umrah blueprint.",
      },
      roadmapEyebrow: "Roadmap 2026-2030",
      roadmapTitle: "Evidence-Based Phased Implementation",
      deliverablesLabel: "Key Deliverables",
      kpi: {
        title: "2030 Success Indicators",
        subtitle:
          "Reported annually to the Board and regulators — ambitious, measurable, and calibrated together with partner associations.",
        colIndicator: "Indicator",
        colBaseline: "2026 Baseline",
        colTarget: "2030 Target",
        rows: {
          r1: { indicator: "Pilgrims served through verified channels", baseline: "Pilot 50,000", target: "1,000,000+ / year" },
          r2: { indicator: "Active certified partners", baseline: "100 founding members", target: "1,000+ providers" },
          r3: { indicator: "Real-time GPS-tracked pilgrim ratio", baseline: "60%", target: "100%" },
          r4: { indicator: "Pilgrim satisfaction (NPS)", baseline: "Min. 40", target: "Min. 70" },
          r5: { indicator: "Fraud incidents by members", baseline: "0", target: "0 (zero tolerance)" },
          r6: { indicator: "On-time departure handling SLA", baseline: "Min. 90%", target: "Min. 98%" },
          r7: { indicator: "Certified pilgrimage personnel", baseline: "1,000 people", target: "10,000 people" },
        },
      },
      cta: "Join Together with MUHDIN",
      tech: {
        eyebrow: "Digital Technology Foundation",
        title: "Six Integrated Technology Pillars",
        subtitle:
          "All pillars run on one data architecture — the pilgrim profile as a single entity from registration to return, with personal data protection in line with Indonesian regulation.",
        p1: { name: "MUHDIN App", desc: "The pilgrim's single interface for booking, itinerary, tracking, and 24/7 services." },
        p2: { name: "GPS & IoT Tracking", desc: "Monitors group and vehicle locations in real time for safety and operational efficiency." },
        p3: { name: "AI & Big Data", desc: "Demand prediction, capacity management, price dynamics, and security anomaly detection." },
        p4: { name: "Nusuk Integration", desc: "Officially synchronizes data, schedules, and quotas with the Government of Saudi Arabia." },
        p5: { name: "Monitoring Dashboard", desc: "Three user classes — business owners, agents, and regulators — with tiered access per authority." },
        p6: { name: "Multilingual", desc: "Indonesian, Arabic, and English — ensuring the service is understood by all parties involved." },
      },
      stake: {
        eyebrow: "Ecosystem Value Distribution",
        title: "Benefits for Stakeholders",
        subtitle:
          "No party bears costs without gaining value, and no value is created without measurable contribution.",
        s1: { who: "Pilgrims", benefit: "Calmer, more comfortable worship; one-door integrated services; schedule and quota certainty; real-time tracking security; fund protection." },
        s2: { who: "PPIU & PIHK", benefit: "Collective access to Nusuk; technology cost efficiency; credibility through quality ratings; pilgrim flow from verified channels." },
        s3: { who: "KBIHU & IPHI", benefit: "Standardized service channels; pilgrim education programs; protection of industry reputation." },
        s4: { who: "Halal-Ziarah Tour Operators", benefit: "Integration of ziarah-halal products into the ecosystem; access to a wider market." },
        s5: { who: "Regulators", benefit: "Real-time quality and compliance data; incident reduction; more effective supervision and pilgrim protection." },
        s6: { who: "Government of Saudi Arabia & Nusuk", benefit: "A single compliance gateway for the industry of the largest pilgrim-sending country; assured quality and traceability." },
        s7: { who: "MSMEs & Society", benefit: "Market access in retail, catering, and the halal supply chain around the ecosystem." },
      },
      biz: {
        eyebrow: "Financial Sustainability",
        title: "A Business Model Rooted in Sharia Contracts",
        subtitle:
          "MUHDIN's sustainability is designed from ecosystem contributions, not from levies that burden pilgrims — every revenue source is rooted in a clear contract.",
        colSource: "Revenue Source",
        colDesc: "Description",
        colAkad: "Contract Basis",
        r1: { name: "Membership Dues", desc: "Tiered annual dues for partners according to service class and scale of operations.", akad: "Wakalah (representation)" },
        r2: { name: "Technology & Platform Fees", desc: "Subscription for MUHDIN App, dashboard, and API usage by partners.", akad: "Ijarah (service lease)" },
        r3: { name: "Ecosystem Commission", desc: "Commission on hotel, transportation, catering, and retail transactions within the marketplace.", akad: "Ju'alah (reward)" },
        r4: { name: "Certification & Training", desc: "Certification programs for tour leaders, mutawif, and pilgrimage personnel development.", akad: "Muwakalah (professional services)" },
        r5: { name: "Data & Compliance Services", desc: "Quality reports, audits, and industry research for partners and regulators.", akad: "Wakalah (professional services)" },
        r6: { name: "Strategic Partnership", desc: "Collaboration programs, sponsorships, and ecosystem service alliances.", akad: "Musyarakah (partnership)" },
        note:
          "The underlying principle is straightforward: MUHDIN earns from the efficiency and added value it creates for partners, while pilgrim funds are managed under protection mechanisms such as escrow and takaful so that pilgrim funds are never lost.",
        refNote:
          "Compliance foundation: Law No. 8 of 2019 on the Organization of Worship and Law No. 27 of 2022 on Personal Data Protection. Nusuk access refers to the official platforms umrah.nusuk.sa and hajj.nusuk.sa.",
      },
    },
  },
  ar: {
    about: {
      eyebrow: "عن مُهدين",
      title: "اتحاد فوق الاتحادات",
      subtitle:
        "مُهدين ليس منافساً لفاعلي القطاع — بل طبقة اتحادية تضع معايير الجودة، وتوحّد الوصول إلى نوسك، وتدير التقنية المشتركة، وتراقب جودة الخدمة من بدايتها إلى نهايتها.",
      visionTitle: "الرؤية",
      visionFallback:
        "أن نصبح شبكة منظومات خدمات العمرة والحج الأكثر موثوقية وتوحيماً ورقمنةً، من إندونيسيا وإليها، بحلول عام 2030.",
      missionTitle: "خمس رسالات",
      missions: {
        m1: "توحيد منظمي خدمات العبادة في إندونيسيا تحت مظلة حوكمة واحدة لمعايير الجودة والأخلاق المشتركة.",
        m2: "تكامل سلسلة خدمات الحجاج بالكامل عبر منصة رقمية لحظية متصلة بنوسك والجهات التنظيمية.",
        m3: "رفع مستوى احترافية الكوادر العبادية من خلال توحيد اعتماد قادة الرحلات والمطوِّفين.",
        m4: "حماية الحجاج من خلال شفافية الأسعار وضمان الخدمة وآليات الحماية المالية.",
        m5: "تعزيز تنافسية القطاع الإندونيسي في شراكة مع الحكومة ومقدمي الخدمات في المملكة العربية السعودية.",
      },
      heritage: {
        eyebrow: "الإرث التاريخي",
        title: "من روّاد التقليد إلى روّاد الرقمنة",
        subtitle: "سلالة أصيلة لتنظيم رحلات العبادة في الأرخبيل — وُلدت قبل أن تنظمها الدولة، وتعود اليوم في هيئة رقمية.",
        era1Label: "قبل عام 1946",
        era1Title: "PHI و IPHI",
        era1Desc: "جمعية رحلات الحج الإندونيسية (PHI) ورابطة أخوية الحج الإندونيسية (IPHI) — أول منظمي الحج والعمرة في الأرخبيل، قبل وقت طويل من تأسيس وزارة الشؤون الدينية الإندونيسية.",
        era2Label: "عصر المخطط الاستراتيجي",
        era2Title: "المخطط الاستراتيجي للحج والعمرة الإندونيسي",
        era2Desc: "الشخصيات التي تتبوأ اليوم مجلس إدارة مُهدين هم مهندسو المخطط الاستراتيجي لتنظيم الحج والعمرة الإندونيسي — عمل خالد وُلد قبل وجود الإطار القانوني.",
        era3Label: "اليوم · 2026",
        era3Title: "مُهدين — الأول عالمياً",
        era3Desc: "تستمر سلالة الروّاد: مُهدين تصبح أول جمعية رقمية للحج والعمرة في العالم — إرث التقليد بوجه التقنية.",
      },
      fedEyebrow: "البنية المؤسسية",
      fedTitle: "مبدأ الاتحاد: الربط لا الإحلال",
      fedSubtitle:
        "كما أن إياتا بالنسبة لصناعة الطيران — توفر مُهدين بنية تحتية مشتركة ومعايير قابلية للتشغيل البيني وضماناً للجودة، وهو ما لا يكون بناؤه من كل فاعل على حدة مجدياً.",
      principles: {
        p1Title: "الاعتماد وتصنيف الجودة",
        p1Desc: "يُقيَّم الأعضاء وفق الالتزام التشغيلي ورضا الحجاج والسلامة المالية.",
        p2Title: "مجلس الأخلاقيات والعقوبات المتدرجة",
        p2Desc: "من الإنذار والإيقاف المؤقت إلى إنهاء العضوية والإبلاغ للجهات التنظيمية.",
        p3Title: "تدقيق دوري للجودة",
        p3Desc: "تُدمج نتائج التدقيق في لوحة المراقبة وتشكل أساس التصنيف العام.",
      },
      partners: {
        PPIU: "شركة خدمات الرحلات العمرة",
        PIHK: "منظم الرحلات الحجية الخاصة",
        KBIHU: "اتحاد مكاتب رحلات الحج",
        IPHI: "رابطة الأخوة الحجية الإندونيسية",
        TW: "منظم الرحلات الحلال والزيارة",
      },
      valuesEyebrow: "القيم الأساسية",
      valuesTitle: "خمس قيم، معيار عمل واحد",
      values: {
        Amanah: {
          name: "الأمانة",
          meaning: "الوفاء بوعود الخدمة، وحفظ أموال الحجاج بحوكمة قابلة للتدقيق، وتقديم مصلحة الحجاج على المصالح اللحظية.",
        },
        Profesional: {
          name: "الاحترافية",
          meaning: "جميع الكوادر والشركاء حاصلون على الاعتماد بكفاءة قابلة للقياس وإجراءات موحدة وتقييم دوري للجودة.",
        },
        Terintegrasi: {
          name: "التكامل",
          meaning: "بيانات واحدة ومسار خدمة واحد من التسجيل حتى العودة، متصلة لحظياً بين الشركاء.",
        },
        Transparan: {
          name: "الشفافية",
          meaning: "الأسعار ونطاق الخدمة وحالة الحصص وسجل مقدمي الخدمة متاحة أمام الحجاج والجهات التنظيمية.",
        },
        Tepercaya: {
          name: "الموثوقية",
          meaning: "الجدارة القانونية وسجل أداء الشركاء موثقة، والعقوبات مطبقة بثبات، والجودة تخضع للتدقيق دورياً.",
        },
      },
      mgmtEyebrow: "الهيكل التنظيمي",
      mgmtTitle: "مجلس إدارة مُهدين",
      mgmtSubtitle: "إدارة راسخة النزاهة تضمن تطبيق معايير المنظومة بثبات.",
      org: {
        pp: "المجلس المركزي",
        ppFull: "الهيئة القيادية العليا لمنظمة مهدين على المستوى الوطني",
        appoint: "بالتعيين",
        bakorwil: "مجلس التنسيق الإقليمي للمقاطعة",
        bakorwilFull: "هيئة التنسيق الإقليمية على مستوى المقاطعة",
        bakorcab: "مجلس التنسيق الفرعي للمناطق والمدن",
        bakorcabFull: "هيئة التنسيق على مستوى الوحدة الإدارية/المدينة",
        note: "يتم تعيين مجلسي التنسيق الإقليمي والفرعي من قبل المجلس المركزي.",
        seePengurus: "عرض الهيكل التنظيمي الكامل",
        credibility: "يتألف المجلس المركزي لمُهدين من شخصيات وطنية ودولية مؤثرة في مجال الحج والعمرة — ومن بينهم مهندسو المخطط الاستراتيجي للحج والعمرة الإندونيسي.",
      },
      roadmapEyebrow: "خارطة الطريق 2026-2030",
      roadmapTitle: "تنفيذ مرحلي قائم على الأدلة",
      deliverablesLabel: "المخرجات الرئيسية",
      kpi: {
        title: "مؤشرات النجاح لعام 2030",
        subtitle: "يُرفع تقرير سنوي إلى مجلس الإدارة والجهات التنظيمية — طموح وقابل للقياس ويُعايَر بالتشاور مع الاتحادات الشريكة.",
        colIndicator: "المؤشر",
        colBaseline: "خط الأساس 2026",
        colTarget: "مستهدف 2030",
        rows: {
          r1: { indicator: "الحجاج المخدومون عبر القنوات الموثقة", baseline: "تجريبي 50,000", target: "أكثر من مليون / سنوياً" },
          r2: { indicator: "الشركاء النشطون المعتمدون", baseline: "100 عضو مؤسس", target: "أكثر من 1,000 منظمة" },
          r3: { indicator: "نسبة الحجاج المتتبعين عبر GPS لحظياً", baseline: "60%", target: "100%" },
          r4: { indicator: "رضا الحجاج (NPS)", baseline: "40 على الأقل", target: "70 على الأقل" },
          r5: { indicator: "حالات احتيال من الأعضاء", baseline: "0", target: "0 (لا تسامح مطلقاً)" },
          r6: { indicator: "اتفاقية مستوى الخدمة لانطلاقات في موعدها", baseline: "90% على الأقل", target: "98% على الأقل" },
          r7: { indicator: "الكوادر العبادية المعتمدة", baseline: "1,000 شخص", target: "10,000 شخص" },
        },
      },
      cta: "انضم إلى صفوف مُهدين",
      tech: {
        eyebrow: "الأساس التقني الرقمي",
        title: "ستة أعمدة تقنية متكاملة",
        subtitle:
          "تعمل جميع الأعمدة فوق بنية بيانات واحدة — ملف الحاج ككيان واحد من التسجيل حتى العودة، مع حماية البيانات الشخصية وفق الأنظمة الإندونيسية.",
        p1: { name: "تطبيق مُهدين", desc: "واجهة واحدة للحاج للحجز والبرنامج والتتبع والخدمة على مدار الساعة." },
        p2: { name: "تتبع GPS وإنترنت الأشياء", desc: "مراقبة مواقع المجموعات والمركبات لحظياً من أجل السلامة والكفاءة التشغيلية." },
        p3: { name: "الذكاء الاصطناعي والبيانات الضخمة", desc: "التنبؤ بالطلب وإدارة الطاقة الاستيعابية وديناميكية الأسعار وكشف الحالات الأمنية الشاذة." },
        p4: { name: "التكامل مع نوسك", desc: "مزامنة رسمية للبيانات والجداول والحصص مع حكومة المملكة العربية السعودية." },
        p5: { name: "لوحة المراقبة", desc: "ثلاث فئات من المستخدمين — أصحاب الأعمال والوكلاء والجهات التنظيمية — بصلاحيات متدرجة حسب الصلاحية." },
        p6: { name: "تعدد اللغات", desc: "الإندونيسية والعربية والإنجليزية — لضمان فهم الخدمة من قبل جميع الأطراف." },
      },
      stake: {
        eyebrow: "توزيع قيمة المنظومة",
        title: "الفوائد لأصحاب المصلحة",
        subtitle: "لا يتحمل أي طرف تكاليف دون أن يحصل على قيمة، ولا تُخلق قيمة دون مساهمة قابلة للقياس.",
        s1: { who: "الحجاج", benefit: "عبادة أكثر هدوءاً وارتياحاً؛ خدمات متكاملة بمسار واحد؛ يقينية الجداول والحصص؛ أمان بالتتبع اللحظي؛ حماية الأموال." },
        s2: { who: "PPIU و PIHK", benefit: "وصول جماعي إلى نوسك؛ كفاءة تكاليف التقنية؛ مصداقية عبر تصنيف الجودة؛ تدفق الحجاج من قنوات موثقة." },
        s3: { who: "KBIHU و IPHI", benefit: "قنوات خدمة موحدة؛ برامج تثقيف الحجاج؛ حماية سمعة القطاع." },
        s4: { who: "منظمو الرحلات الحلال والزيارة", benefit: "إدماج منتجات الزيارة والحلال في المنظومة؛ وصول إلى سوق أوسع." },
        s5: { who: "الجهات التنظيمية", benefit: "بيانات جودة والتزام لحظية؛ انخفاض الحوادث؛ رقابة وحماية أكثر فاعلية للحجاج." },
        s6: { who: "حكومة السعودية ونوسك", benefit: "بوابة التزام واحدة لقطاع أكبر دولة مُرسلة للحجاج؛ جودة مضمونة وقابلية تتبع للحجاج." },
        s7: { who: "المشاريع الصغيرة والمجتمع", benefit: "وصول إلى سوق التجزئة والتموين وسلاسل إمداد الحلال حول المنظومة." },
      },
      biz: {
        eyebrow: "الاستدامة المالية",
        title: "نموذج عمل متجذر في العقود الشرعية",
        subtitle: "صُممت استدامة مُهدين من مساهمات المنظومة، لا من رسوم تُثقل كاهل الحجاج — وكل مصدر دخل متجذر في عقد واضح.",
        colSource: "مصدر الدخل",
        colDesc: "الوصف",
        colAkad: "العقد الأساس",
        r1: { name: "اشتراكات العضوية", desc: "اشتراك سنوي متدرج للشركاء حسب فئة الخدمة وحجم العمليات.", akad: "الوكالة" },
        r2: { name: "رسوم التقنية والمنصة", desc: "اشتراك استخدام تطبيق مُهدين ولوحة التحكم وواجهات API للشركاء.", akad: "الإجارة (كراء الخدمة)" },
        r3: { name: "عمولة المنظومة", desc: "عمولة على معاملات الفنادق والنقل والتموين والتجزئة داخل السوق.", akad: "الجعالة (مكافأة)" },
        r4: { name: "الاعتماد والتدريب", desc: "برامج اعتماد قادة الرحلات والمطوِّفين وتطوير الكوادر العبادية.", akad: "المواكلة (خدمات مهنية)" },
        r5: { name: "خدمات البيانات والامتثال", desc: "تقارير الجودة والتدقيق والبحوث القطاعية للشركاء والجهات التنظيمية.", akad: "الوكالة (خدمات مهنية)" },
        r6: { name: "الشراكة الاستراتيجية", desc: "برامج التعاون والرعاية وتحالفات خدمات المنظومة.", akad: "المشاركة (شراكة)" },
        note:
          "المبدأ واضح: تكسب مُهدين من الكفاءة والقيمة المضافة التي تخلقها للشركاء، بينما تُدار أموال الحجاج بآليات حماية مثل الضمان والتكافل حتى لا تضيع أموال الحجاج أبداً.",
        refNote:
          "الأساس القانوني: القانون رقم 8 لسنة 2019 بشأن تنظيم العبادة والقانون رقم 27 لسنة 2022 بشأن حماية البيانات الشخصية. الوصول إلى نوسك يشير إلى المنصتين الرسميتين umrah.nusuk.sa و hajj.nusuk.sa.",
      },
    },
  },
} as const;
