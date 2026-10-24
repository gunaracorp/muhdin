/**
 * Task 51 — namespace "ppk": Dashboard PPIU & PPIHK (#/dashboard/ppiu-pihk).
 * Konsol operasional dua jenis penyelenggara ibadah:
 *   PPIU  = Perusahaan Perjalanan Ibadah Umrah
 *   PIHK  = Perusahaan Perjalanan Ibadah Haji Khusus (PPIHK)
 * Fitur inti: direktori perusahaan + sinkronisasi izin Nusuk (engine sandbox).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik ketiganya.
 */
export const ppiuPihkDict = {
  id: {
    ppk: {
      /* ---------- KARTU HUB (#/dashboard) ---------- */
      hubTag: "Untuk Penyelenggara Ibadah",
      hubTitle: "Dashboard PPIU & PPIHK",
      hubDesc:
        "Konsol operasional khusus Perusahaan Perjalanan Ibadah Umrah & Haji Khusus — pantau izin Nusuk tiap perusahaan dan jalankan sinkronisasi satu klik.",
      hubBtn: "Buka Dashboard",

      /* ---------- HERO ---------- */
      eyebrow: "Konsol Operasional Digital",
      title: "Dashboard PPIU & PPIHK",
      subtitle:
        "Satu konsol untuk seluruh Perusahaan Perjalanan Ibadah Umrah (PPIU) dan Haji Khusus (PPIHK) — direktori live, status izin Nusuk, dan sinkronisasi satu klik ke jembatan data Nusuk.sa.",
      connEnv: "Lingkungan",
      connStatus: "Koneksi",
      connSyncs: "Total sinkronisasi",
      connLast: "Sinkron terakhir",
      syncAll: "Sinkronkan Semua",
      syncing: "Menyinkronkan…",
      nusukHub: "Nusuk Hub",

      /* ---------- STATISTIK ---------- */
      statPpiu: "Perusahaan PPIU",
      statPpiuSub: "terverifikasi",
      statPihk: "Perusahaan PPIHK",
      statPihkSub: "terverifikasi",
      statActive: "Izin Aktif",
      statActiveSub: "dari {total} izin tersinkron",
      statCompliance: "Kepatuhan Ekosistem",
      statComplianceSub: "{n} dari {m} perusahaan memiliki izin aktif",
      statProvinces: "Provinsi Terjangkau",
      statVerified: "Semua Terverifikasi",

      /* ---------- DIREKTORI ---------- */
      dirTitle: "Direktori Perusahaan",
      dirSub: "Klik Sinkronkan pada kartu untuk memperbarui izin satu perusahaan.",
      searchPlaceholder: "Cari nama, kota, atau nomor izin…",
      tabAll: "Semua",
      tabPpiu: "PPIU",
      tabPihk: "PPIHK",
      empty: "Tidak ada perusahaan yang cocok",
      emptySub: "Ubah kata kunci atau filter jenis penyelenggara.",
      noPermit: "Belum ada izin tersinkron",
      license: "Izin",
      since: "Anggota sejak",
      permitsActive: "aktif",
      permitsPending: "proses",
      permitsExpired: "kedaluwarsa",
      lastSync: "Sinkron terakhir",
      never: "belum pernah",
      eligibility: "Lingkup izin Nusuk",
      syncBtn: "Sinkronkan",
      unverified: "Menunggu verifikasi",

      /* ---------- RIWAYAT SINKRONISASI ---------- */
      logTitle: "Riwayat Sinkronisasi",
      logSub: "8 aktivitas terakhir jembatan data Nusuk.",
      logEmpty: "Belum ada aktivitas sinkronisasi.",
      logRecords: "{n} record",
      logDuration: "{ms} ms",

      /* ---------- TOAST ---------- */
      syncOkTitle: "Sinkronisasi berhasil",
      syncOkDesc: "{created} izin baru, {updated} diperbarui, {expired} kedaluwarsa dalam {ms} ms.",
      syncFailTitle: "Sinkronisasi gagal",
      rateTitle: "Batas jumlah dicapai",
      rateDesc: "Tunggu satu menit sebelum sinkronisasi berikutnya.",

      /* ---------- BERSAMA ---------- */
      loading: "Memuat konsol…",
      loadError: "Gagal memuat data dashboard.",
      retry: "Coba Lagi",
    },
  },
  en: {
    ppk: {
      hubTag: "For Ibadah Operators",
      hubTitle: "PPIU & PPIHK Dashboard",
      hubDesc:
        "Operational console for Umrah & Special Hajj travel companies — monitor Nusuk permits per company and run one-click synchronization.",
      hubBtn: "Open Dashboard",

      eyebrow: "Digital Operations Console",
      title: "PPIU & PPIHK Dashboard",
      subtitle:
        "One console for all Umrah Travel Companies (PPIU) and Special Hajj Travel Companies (PPIHK) — live directory, Nusuk permit status, and one-click sync to the Nusuk.sa data bridge.",
      connEnv: "Environment",
      connStatus: "Connection",
      connSyncs: "Total syncs",
      connLast: "Last sync",
      syncAll: "Sync All",
      syncing: "Syncing…",
      nusukHub: "Nusuk Hub",

      statPpiu: "PPIU Companies",
      statPpiuSub: "verified",
      statPihk: "PPIHK Companies",
      statPihkSub: "verified",
      statActive: "Active Permits",
      statActiveSub: "of {total} synced permits",
      statCompliance: "Ecosystem Compliance",
      statComplianceSub: "{n} of {m} companies hold active permits",
      statProvinces: "Provinces Covered",
      statVerified: "All Verified",

      dirTitle: "Company Directory",
      dirSub: "Click Sync on a card to refresh one company's permits.",
      searchPlaceholder: "Search name, city, or license no…",
      tabAll: "All",
      tabPpiu: "PPIU",
      tabPihk: "PPIHK",
      empty: "No matching companies",
      emptySub: "Adjust the keyword or operator-type filter.",
      noPermit: "No synced permits yet",
      license: "License",
      since: "Member since",
      permitsActive: "active",
      permitsPending: "pending",
      permitsExpired: "expired",
      lastSync: "Last sync",
      never: "never",
      eligibility: "Nusuk permit scope",
      syncBtn: "Sync",
      unverified: "Awaiting verification",

      logTitle: "Sync History",
      logSub: "Latest 8 activities of the Nusuk data bridge.",
      logEmpty: "No sync activity yet.",
      logRecords: "{n} records",
      logDuration: "{ms} ms",

      syncOkTitle: "Sync successful",
      syncOkDesc: "{created} new permits, {updated} updated, {expired} expired in {ms} ms.",
      syncFailTitle: "Sync failed",
      rateTitle: "Rate limit reached",
      rateDesc: "Wait one minute before the next sync.",

      loading: "Loading console…",
      loadError: "Failed to load dashboard data.",
      retry: "Try Again",
    },
  },
  ar: {
    ppk: {
      hubTag: "لمشغّلي الحج والعمرة",
      hubTitle: "لوحة PPIU وPPIHK",
      hubDesc:
        "لوحة تشغيل لشركات ترحيلات العمرة والحج الخاص — متابعة تصاريح نسك لكل شركة ومزامنة بنقرة واحدة.",
      hubBtn: "فتح اللوحة",

      eyebrow: "منصّة العمليات الرقمية",
      title: "لوحة PPIU وPPIHK",
      subtitle:
        "منصّة واحدة لجميع شركات ترحيلات العمرة (PPIU) والحج الخاص (PPIHK) — دليل مباشر وحالة تصاريح نسك ومزامنة بنقرة واحدة مع جسر بيانات Nusuk.sa.",
      connEnv: "البيئة",
      connStatus: "الاتصال",
      connSyncs: "إجمالي المزامنات",
      connLast: "آخر مزامنة",
      syncAll: "مزامنة الكل",
      syncing: "جارٍ المزامنة…",
      nusukHub: "مركز نسك",

      statPpiu: "شركات PPIU",
      statPpiuSub: "موثّقة",
      statPihk: "شركات PPIHK",
      statPihkSub: "موثّقة",
      statActive: "تصاريح نشطة",
      statActiveSub: "من {total} تصريحًا متزامنًا",
      statCompliance: "التزام المنظومة",
      statComplianceSub: "{n} من {m} شركة لديها تصاريح نشطة",
      statProvinces: "المحافظات المشمولة",
      statVerified: "جميعها موثّقة",

      dirTitle: "دليل الشركات",
      dirSub: "انقر «مزامنة» على البطاقة لتحديث تصاريح شركة واحدة.",
      searchPlaceholder: "ابحث بالاسم أو المدينة أو رقم الترخيص…",
      tabAll: "الكل",
      tabPpiu: "PPIU",
      tabPihk: "PPIHK",
      empty: "لا توجد شركات مطابقة",
      emptySub: "عدّل كلمة البحث أو فلتر نوع المشغّل.",
      noPermit: "لا توجد تصاريح متزامنة بعد",
      license: "الترخيص",
      since: "عضو منذ",
      permitsActive: "نشط",
      permitsPending: "قيد المعالجة",
      permitsExpired: "منتهي",
      lastSync: "آخر مزامنة",
      never: "أبدًا",
      eligibility: "نطاق تصاريح نسك",
      syncBtn: "مزامنة",
      unverified: "بانتظار التوثيق",

      logTitle: "سجل المزامنة",
      logSub: "آخر 8 عمليات لجسر بيانات نسك.",
      logEmpty: "لا يوجد نشاط مزامنة بعد.",
      logRecords: "{n} سجل",
      logDuration: "{ms} ملّي ثانية",

      syncOkTitle: "تمت المزامنة بنجاح",
      syncOkDesc: "{created} تصريحًا جديدًا، و{updated} محدَّثًا، و{expired} منتهيًا خلال {ms} ملّي ثانية.",
      syncFailTitle: "فشلت المزامنة",
      rateTitle: "تم بلوغ حد الطلبات",
      rateDesc: "انتظر دقيقة واحدة قبل المزامنة التالية.",

      loading: "جارٍ تحميل اللوحة…",
      loadError: "فشل تحميل بيانات اللوحة.",
      retry: "حاول مجددًا",
    },
  },
};
