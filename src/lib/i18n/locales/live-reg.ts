/**
 * Task 53 — kamus i18n "Live Queue Engine" (Papan Slot Pendaftaran Realtime).
 * Namespace root: liveReg.* — dipakai live-slot-board.tsx + daftar-view + join-view.
 */
export const liveRegDict = {
  id: {
    liveReg: {
      // ---------- Header papan ----------
      boardEyebrow: "Realtime",
      boardTitle: "Papan Slot Pendaftaran",
      boardDesc:
        "Setiap pendaftar baru otomatis mendapat nomor urut dan langsung menyala di papan ini — untuk semua orang, tanpa perlu memuat ulang.",
      connected: "Terhubung realtime",
      syncing: "Menyinkronkan…",
      // ---------- Counter ----------
      totalLabel: "Pendaftar bergabung",
      waitingLabel: "Menunggu verifikasi",
      nextSlot: "Slot berikutnya",
      nextSlotYours: "Bisa jadi Anda",
      // ---------- Sel slot ----------
      slotFilled: "Terisi",
      slotFree: "Tersedia",
      slotYou: "Anda",
      slotMore: "+{n} slot lainnya",
      // ---------- Feed ----------
      feedTitle: "Aktivitas Terbaru",
      feedEmpty: "Belum ada aktivitas — jadilah pendaftar pertama!",
      feedJustNow: "baru saja",
      feedAgoSec: "{n} dtk lalu",
      feedAgoMin: "{n} mnt lalu",
      feedAgoHour: "{n} jam lalu",
      feedAgoDay: "{n} hri lalu",
      // ---------- Layar sukses daftar ----------
      queueLabel: "Nomor Urut Anda",
      queueDesc:
        "Slot #{n} atas nama Anda sudah terkunci di papan pendaftaran — live untuk dilihat semua orang.",
      queueLive: "Terpampang di papan slot",
      // ---------- Lacak ----------
      trackQueueLabel: "Nomor Urut",
      // ---------- Privasi ----------
      privacyNote: "Papan hanya menampilkan jenis pendaftar & kota — tanpa nama organisasi atau kontak (aman PDP).",
    },
  },
  en: {
    liveReg: {
      boardEyebrow: "Realtime",
      boardTitle: "Registration Slot Board",
      boardDesc:
        "Every new registrant automatically gets a sequence number and lights up on this board instantly — for everyone, no refresh needed.",
      connected: "Realtime connected",
      syncing: "Syncing…",
      totalLabel: "Registrants joined",
      waitingLabel: "Awaiting verification",
      nextSlot: "Next slot",
      nextSlotYours: "Could be you",
      slotFilled: "Filled",
      slotFree: "Available",
      slotYou: "You",
      slotMore: "+{n} more slots",
      feedTitle: "Latest Activity",
      feedEmpty: "No activity yet — be the first registrant!",
      feedJustNow: "just now",
      feedAgoSec: "{n}s ago",
      feedAgoMin: "{n}m ago",
      feedAgoHour: "{n}h ago",
      feedAgoDay: "{n}d ago",
      queueLabel: "Your Sequence Number",
      queueDesc:
        "Slot #{n} under your name is now locked on the registration board — live for everyone to see.",
      queueLive: "Displayed on the slot board",
      trackQueueLabel: "Sequence Number",
      privacyNote: "The board only shows registrant type & city — no organization names or contacts (PDP-safe).",
    },
  },
  ar: {
    liveReg: {
      boardEyebrow: "فوري",
      boardTitle: "لوحة أماكن التسجيل",
      boardDesc:
        "كل مسجل جديد يحصل تلقائيًا على رقم تسلسلي وينير مكانه على هذه اللوحة فورًا — أمام الجميع دون الحاجة إلى إعادة تحميل.",
      connected: "متصل في الوقت الفعلي",
      syncing: "جارٍ المزامنة…",
      totalLabel: "المسجلون المنضمون",
      waitingLabel: "في انتظار التحقق",
      nextSlot: "المكان التالي",
      nextSlotYours: "قد يكون أنت",
      slotFilled: "مشغول",
      slotFree: "متاح",
      slotYou: "أنت",
      slotMore: "+{n} أماكن أخرى",
      feedTitle: "أحدث النشاطات",
      feedEmpty: "لا يوجد نشاط بعد — كن أول المسجلين!",
      feedJustNow: "الآن",
      feedAgoSec: "قبل {n} ث",
      feedAgoMin: "قبل {n} د",
      feedAgoHour: "قبل {n} س",
      feedAgoDay: "قبل {n} ي",
      queueLabel: "رقمك التسلسلي",
      queueDesc: "المكان رقم #{n} باسمك أصبح مثبتًا على لوحة التسجيل — يراه الجميع مباشرة.",
      queueLive: "معروض على لوحة الأماكن",
      trackQueueLabel: "الرقم التسلسلي",
      privacyNote: "تعرض اللوحة نوع المسجل والمدينة فقط — دون أسماء المنظمات أو جهات الاتصال (آمنة وفق قانون PDP).",
    },
  },
} as const;
