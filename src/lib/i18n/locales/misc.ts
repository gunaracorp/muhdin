/**
 * namespace "misc" — dikelola oleh agent Task 14-a (muhdin-app.tsx: LoadingSplash & NotFound).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const miscDict = {
  id: {
    misc: {
      loading: "Memuat portal MUHDIN…",
      notfound: {
        code: "404",
        title: "Halaman tidak ditemukan",
        body: "Halaman yang Anda cari tidak tersedia. Silakan kembali ke beranda untuk melanjutkan perjalanan.",
        cta: "Kembali ke Beranda",
      },
    },
  },
  en: {
    misc: {
      loading: "Loading the MUHDIN portal…",
      notfound: {
        code: "404",
        title: "Page not found",
        body: "The page you are looking for is not available. Please return to the home page to continue your journey.",
        cta: "Back to Home",
      },
    },
  },
  ar: {
    misc: {
      loading: "جار تحميل بوابة مهدين…",
      notfound: {
        code: "404",
        title: "الصفحة غير موجودة",
        body: "الصفحة التي تبحث عنها غير متاحة. يرجى العودة إلى الصفحة الرئيسية لمتابعة رحلتك.",
        cta: "العودة إلى الرئيسية",
      },
    },
  },
} as const;
