/**
 * namespace "downloads" — dikelola oleh agent Task 18-c (portal publik).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 * Kategori konten (group.*) mengikuti seed DB: Formulir, Panduan, Kebijakan, Lainnya.
 * Kategori di luar daftar akan ditampilkan apa adanya (fallback di kode).
 */
export const downloadsDict = {
  id: {
    downloads: {
      eyebrow: "Pusat Unduhan",
      title: "Pusat Unduhan",
      subtitle:
        "Formulir, panduan, dan kebijakan resmi ekosistem MUHDIN — bebas diunduh untuk jamaah dan penyelenggara.",
      groupFormulir: "Formulir",
      groupPanduan: "Panduan",
      groupKebijakan: "Kebijakan",
      groupLainnya: "Lainnya",
      groupAria: "Kelompok dokumen {name}",
      btnDownload: "Unduh",
      btnDownloadAria: "Unduh {title}",
      downloadsCount: "{n} kali diunduh",
      descEmpty: "Tidak ada keterangan.",
      loading: "Memuat dokumen…",
      emptyTitle: "Belum Ada Dokumen",
      emptyDesc: "Dokumen sedang disiapkan. Silakan kembali lagi nanti.",
      toastFailTitle: "Gagal memproses unduhan",
      kitTitle: "Kit Promosi — Asosiasi Haji Umroh Digital Pertama di Indonesia",
      kitDesc:
        "Banner siap pakai untuk WhatsApp & Instagram (feed, story, share link) — gratis diunduh dan dibagikan.",
      kitCta: "BUKA KIT PROMOSI",
    },
  },
  en: {
    downloads: {
      eyebrow: "Download Center",
      title: "Download Center",
      subtitle:
        "Official forms, guides, and policies of the MUHDIN ecosystem — free to download for pilgrims and providers.",
      groupFormulir: "Forms",
      groupPanduan: "Guides",
      groupKebijakan: "Policies",
      groupLainnya: "Others",
      groupAria: "Document group {name}",
      btnDownload: "Download",
      btnDownloadAria: "Download {title}",
      downloadsCount: "downloaded {n} times",
      descEmpty: "No description.",
      loading: "Loading documents…",
      emptyTitle: "No Documents Yet",
      emptyDesc: "Documents are being prepared. Please come back later.",
      toastFailTitle: "Failed to process the download",
      kitTitle: "Promo Kit — Indonesia\u2019s First Digital Hajj-Umrah Association",
      kitDesc:
        "Ready-to-share banners for WhatsApp & Instagram (feed, story, link preview) — free to download.",
      kitCta: "OPEN PROMO KIT",
    },
  },
  ar: {
    downloads: {
      eyebrow: "مركز التنزيلات",
      title: "مركز التنزيلات",
      subtitle: "النماذج والأدلة والسياسات الرسمية لمنظومة موهدين — متاحة مجانا للحجاج والمنظمين.",
      groupFormulir: "النماذج",
      groupPanduan: "الأدلة",
      groupKebijakan: "السياسات",
      groupLainnya: "أخرى",
      groupAria: "مجموعة مستندات {name}",
      btnDownload: "تنزيل",
      btnDownloadAria: "تنزيل {title}",
      downloadsCount: "تم تنزيله {n} مرة",
      descEmpty: "لا يوجد وصف.",
      loading: "جارٍ تحميل المستندات…",
      emptyTitle: "لا توجد مستندات بعد",
      emptyDesc: "المستندات قيد الإعداد. يرجى العودة لاحقا.",
      toastFailTitle: "فشل تجهيز التنزيل",
      kitTitle: "حزمة الدعاية — أول جمعية رقمية للحج والعمرة في إندونيسيا",
      kitDesc: "لافتات جاهزة للمشاركة على واتساب وإنستغرام (منشور وستوري ومعاينة الرابط) — تنزيل مجاني.",
      kitCta: "افتح حزمة الدعاية",
    },
  },
} as const;
