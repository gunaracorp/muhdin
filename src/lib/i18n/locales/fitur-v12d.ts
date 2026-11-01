/**
 * fitur-v12d.ts — kamus i18n v12.5 (root `help`).
 * Help Center #/bantuan (R-095): pencarian terpadu, kategori belajar,
 * tautan cepat layanan, dan CTA kontak.
 * Satu file berisi ketiga locale { id, en, ar } dengan key identik.
 */
export const helpDict = {
  id: {
    help: {
      eyebrow: "Pusat Bantuan",
      title: "Ada yang bisa kami bantu?",
      subtitle:
        "Satu pintu untuk semua jawaban: cari pertanyaan umum, jelajahi kategori belajar, atau hubungi tim kami langsung.",
      searchPlaceholder: "Cari bantuan… contoh: manasik, invoice, keanggotaan",
      searchAria: "Kotak pencarian pusat bantuan",
      popularLabel: "Pencarian populer:",
      learnTitle: "Kategori Belajar",
      learnDesc: "Mulai dari sini — panduan terstruktur per topik.",
      quickTitle: "Layanan Cepat",
      quickDesc: "Langsung ke fitur yang paling sering dicari.",
      faqTitle: "Pertanyaan yang Sering Diajukan",
      faqSeeAll: "Lihat semua FAQ",
      empty: "Tidak ada jawaban yang cocok. Coba kata kunci lain atau hubungi kami.",
      contactTitle: "Masih butuh bantuan?",
      contactDesc: "Tim MUHDIN siap membantu setiap hari pukul 08.00–21.00 WIB.",
      chips: ["manasik", "invoice", "keanggotaan", "KTA", "verifikasi"],
      cards: [
        { icon: "book-open", title: "Manasik & Ibadah", desc: "Panduan ihram, tawaf, sa'i hingga doa perjalanan.", href: "/berita" },
        { icon: "graduation-cap", title: "Akademi & Sertifikasi", desc: "Kelas muthowif, tour leader, dan standar layanan.", href: "/akademi" },
        { icon: "play-circle", title: "Tutorial Portal", desc: "Langkah demi langkah memakai fitur portal.", href: "/tutorial" },
        { icon: "shield-check", title: "Keamanan & Privasi", desc: "Hak subjek data, kebijakan PDP, dan keamanan akun.", href: "/privasi" },
      ],
      quick: [
        { icon: "package", title: "Cek Pesanan & Invoice", desc: "Lacak status pembayaran dan unduh invoice PDF.", href: "/pesanan" },
        { icon: "map", title: "Lacak Verifikasi Penyelenggara", desc: "Periksa legalitas PPIU/PIHK dalam direktori.", href: "/verifikasi" },
        { icon: "qr-code", title: "Paspor Haji Digital", desc: "Kartu QR pribadi untuk titik layanan.", href: "/paspor" },
        { icon: "help-circle", title: "Semua FAQ", desc: "Seluruh pertanyaan terjawab dalam satu halaman.", href: "/faq" },
      ],
    },
  },
  en: {
    help: {
      eyebrow: "Help Center",
      title: "How can we help you?",
      subtitle:
        "One door to every answer: search common questions, explore learning categories, or reach our team directly.",
      searchPlaceholder: "Search help… e.g. manasik, invoice, membership",
      searchAria: "Help center search box",
      popularLabel: "Popular searches:",
      learnTitle: "Learning Categories",
      learnDesc: "Start here — structured guides per topic.",
      quickTitle: "Quick Services",
      quickDesc: "Jump straight to the most-used features.",
      faqTitle: "Frequently Asked Questions",
      faqSeeAll: "See all FAQs",
      empty: "No matching answers. Try another keyword or contact us.",
      contactTitle: "Still need help?",
      contactDesc: "The MUHDIN team is ready every day, 08:00–21:00 WIB.",
      chips: ["manasik", "invoice", "membership", "KTA", "verification"],
      cards: [
        { icon: "book-open", title: "Manasik & Worship", desc: "Guides on ihram, tawaf, sa'i and travel prayers.", href: "/berita" },
        { icon: "graduation-cap", title: "Academy & Certification", desc: "Muthowif, tour leader classes and service standards.", href: "/akademi" },
        { icon: "play-circle", title: "Portal Tutorials", desc: "Step-by-step usage of portal features.", href: "/tutorial" },
        { icon: "shield-check", title: "Safety & Privacy", desc: "Data subject rights, PDP policy, account security.", href: "/privasi" },
      ],
      quick: [
        { icon: "package", title: "Check Order & Invoice", desc: "Track payment status and download PDF invoice.", href: "/pesanan" },
        { icon: "map", title: "Verify Organizers", desc: "Check PPIU/PIHK licenses in the directory.", href: "/verifikasi" },
        { icon: "qr-code", title: "Digital Hajj Passport", desc: "Personal QR card for service points.", href: "/paspor" },
        { icon: "help-circle", title: "All FAQs", desc: "Every answered question in one page.", href: "/faq" },
      ],
    },
  },
  ar: {
    help: {
      eyebrow: "مركز المساعدة",
      title: "كيف يمكننا مساعدتك؟",
      subtitle: "مدخل واحد لكل الأجوبة: ابحث في الأسئلة الشائعة، أو تصفح تصنيفات التعلم، أو تواصل مع فريقنا مباشرة.",
      searchPlaceholder: "ابحث… مثال: مناسك، فاتورة، عضوية",
      searchAria: "صندوق بحث مركز المساعدة",
      popularLabel: "الأكثر بحثًا:",
      learnTitle: "تصنيفات التعلم",
      learnDesc: "ابدأ من هنا — أدلة منظمة لكل موضوع.",
      quickTitle: "خدمات سريعة",
      quickDesc: "انتقل مباشرة إلى أكثر الميزات استخدامًا.",
      faqTitle: "الأسئلة المتكررة",
      faqSeeAll: "عرض كل الأسئلة",
      empty: "لا توجد إجابة مطابقة. جرّب كلمة أخرى أو تواصل معنا.",
      contactTitle: "ما زلت بحاجة إلى مساعدة؟",
      contactDesc: "فريق MUHDIN جاهز يوميًا من 8 صباحًا حتى 9 مساءً.",
      chips: ["مناسك", "فاتورة", "عضوية", "KTA", "تحقق"],
      cards: [
        { icon: "book-open", title: "المناسك والعبادة", desc: "أدلة الإحرام والطواف والسعي وأدعية السفر.", href: "/berita" },
        { icon: "graduation-cap", title: "الأكاديمية والاعتماد", desc: "دروس المرشد وقائد الرحلة ومعايير الخدمة.", href: "/akademi" },
        { icon: "play-circle", title: "دروس البوابة", desc: "خطوات استخدام ميزات البوابة.", href: "/tutorial" },
        { icon: "shield-check", title: "الأمان والخصوصية", desc: "حقوق صاحب البيانات وسياسة الحماية وأمان الحساب.", href: "/privasi" },
      ],
      quick: [
        { icon: "package", title: "فحص الطلب والفاتورة", desc: "تتبع حالة الدفع وتنزيل الفاتورة PDF.", href: "/pesanan" },
        { icon: "map", title: "التحقق من المنظمين", desc: "افحص تراخيص PPIU/PIHK في الدليل.", href: "/verifikasi" },
        { icon: "qr-code", title: "جواز الحج الرقمي", desc: "بطاقة QR شخصية لنقاط الخدمة.", href: "/paspor" },
        { icon: "help-circle", title: "كل الأسئلة", desc: "كل الأسئلة المجابة في صفحة واحدة.", href: "/faq" },
      ],
    },
  },
};
