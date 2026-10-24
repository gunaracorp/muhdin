/**
 * namespace "ecosystem" — dikelola oleh agent Task 14-b.
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const ecosystemDict = {
  id: {
    ecosystem: {
      eyebrow: "Arsitektur 13 Ekosistem",
      title: "Ekosistem Layanan Terintegrasi",
      subtitle:
        "Tiga belas ekosistem membentuk satu rangkaian utuh perjalanan Tamu Allah. Setiap ekosistem dikelola mitra terverifikasi, dibingkai standar MUHDIN, dan terhubung pada satu tulang punggung data.",
      filterAll: "Semua ({count})",
      searchPlaceholder: "Cari ekosistem…",
      searchAria: "Cari ekosistem",
      empty: "Tidak ada ekosistem yang cocok dengan pencarian.",
      detail: "Detail",
      detailEyebrow: "Ekosistem {number} — {cluster}",
      aboutTitle: "Tentang Ekosistem",
      scopeTitle: "Ruang Lingkup",
      standardTitle: "Standar MUHDIN",
      commitmentTitle: "Komitmen Mutu",
      commitmentText:
        "Layanan pada ekosistem ini diaudit berkala dan hasilnya terintegrasi ke dashboard monitoring — reputasi menjadi mata uang kolektif ekosistem.",
      cluster: {
        access: "Akses & Mobilitas",
        worship: "Pengalaman Ibadah",
        quality: "Nilai Tambah & Jaminan Mutu",
      },
    },
  },
  en: {
    ecosystem: {
      eyebrow: "The 13-Ecosystem Architecture",
      title: "Integrated Service Ecosystem",
      subtitle:
        "Thirteen ecosystems form one unbroken chain of the Guests of Allah's journey. Each ecosystem is managed by verified partners, framed by MUHDIN standards, and connected to a single data backbone.",
      filterAll: "All ({count})",
      searchPlaceholder: "Search ecosystems…",
      searchAria: "Search ecosystems",
      empty: "No ecosystems match your search.",
      detail: "Details",
      detailEyebrow: "Ecosystem {number} — {cluster}",
      aboutTitle: "About This Ecosystem",
      scopeTitle: "Scope",
      standardTitle: "MUHDIN Standard",
      commitmentTitle: "Quality Commitment",
      commitmentText:
        "Services in this ecosystem are audited regularly and the results feed into the monitoring dashboard — reputation is the ecosystem's collective currency.",
      cluster: {
        access: "Access & Mobility",
        worship: "Worship Experience",
        quality: "Value-Added & Quality Assurance",
      },
    },
  },
  ar: {
    ecosystem: {
      eyebrow: "معمارية 13 منظومة",
      title: "منظومة خدمات متكاملة",
      subtitle:
        "تشكل ثلاث عشرة منظومة سلسلة واحدة متكاملة لرحلة ضيوف الرحمن. تُدار كل منظومة على يد شركاء موثقين، ووفق معايير مُهدين، ومرتبطة بعمود بيانات واحد.",
      filterAll: "الكل ({count})",
      searchPlaceholder: "ابحث عن منظومة…",
      searchAria: "البحث عن منظومة",
      empty: "لا توجد منظومات مطابقة للبحث.",
      detail: "التفاصيل",
      detailEyebrow: "المنظومة {number} — {cluster}",
      aboutTitle: "عن المنظومة",
      scopeTitle: "نطاق الخدمة",
      standardTitle: "معيار مُهدين",
      commitmentTitle: "الالتزام بالجودة",
      commitmentText:
        "تخضع خدمات هذه المنظومة لتدقيق دوري وتُدمج نتائجه في لوحة المراقبة — فالسمعة هي العملة الجماعية للمنظومة.",
      cluster: {
        access: "الوصول والتنقل",
        worship: "تجربة العبادة",
        quality: "القيمة المضافة وضمان الجودة",
      },
    },
  },
} as const;
