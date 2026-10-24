/**
 * namespace "gallery" — dikelola oleh agent Task 18-c (portal publik).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 * Kategori konten (cat.*) mengikuti seed DB: Kegiatan, Perjalanan, Manasik, Fasilitas.
 * Kategori di luar daftar akan ditampilkan apa adanya (fallback di kode).
 */
export const galleryDict = {
  id: {
    gallery: {
      eyebrow: "Galeri",
      title: "Galeri Kegiatan",
      subtitle:
        "Dokumentasi perjalanan layanan ekosistem MUHDIN — dari keberangkatan jamaah hingga kegiatan keanggotaan.",
      filterAll: "Semua",
      countLabel: "{n} foto",
      loading: "Memuat galeri…",
      emptyTitle: "Belum Ada Foto",
      emptyDesc: "Galeri sedang dalam persiapan. Silakan kunjungi kembali halaman ini nanti.",
      openAria: "Buka foto {title}",
      ariaFilter: "Filter galeri berdasarkan kategori",
      catKegiatan: "Kegiatan",
      catPerjalanan: "Perjalanan",
      catManasik: "Manasik",
      catFasilitas: "Fasilitas",
    },
  },
  en: {
    gallery: {
      eyebrow: "Gallery",
      title: "Activity Gallery",
      subtitle:
        "Documenting the service journey of the MUHDIN ecosystem — from pilgrim departures to member activities.",
      filterAll: "All",
      countLabel: "{n} photos",
      loading: "Loading the gallery…",
      emptyTitle: "No Photos Yet",
      emptyDesc: "The gallery is being prepared. Please visit this page again later.",
      openAria: "Open photo {title}",
      ariaFilter: "Filter gallery by category",
      catKegiatan: "Activities",
      catPerjalanan: "Travel",
      catManasik: "Manasik",
      catFasilitas: "Facilities",
    },
  },
  ar: {
    gallery: {
      eyebrow: "معرض الصور",
      title: "معرض الأنشطة",
      subtitle: "توثيق رحلة خدمات منظومة موهدين — من وداع الحجاج إلى أنشطة الأعضاء.",
      filterAll: "الكل",
      countLabel: "{n} صورة",
      loading: "جارٍ تحميل المعرض…",
      emptyTitle: "لا توجد صور بعد",
      emptyDesc: "المعرض قيد الإعداد. يرجى زيارة هذه الصفحة لاحقا.",
      openAria: "فتح صورة {title}",
      ariaFilter: "تصفية المعرض حسب الفئة",
      catKegiatan: "أنشطة",
      catPerjalanan: "رحلات",
      catManasik: "مناسك",
      catFasilitas: "مرافق",
    },
  },
} as const;
