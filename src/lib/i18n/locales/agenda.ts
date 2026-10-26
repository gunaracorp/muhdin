/**
 * namespace "agenda" — dikelola oleh agent Task 18-c (portal publik).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 * Kategori konten (cat.*) mengikuti seed DB: Pelatihan, Rakernas, Safari, Kegiatan.
 * Kategori di luar daftar akan ditampilkan apa adanya (fallback di kode).
 */
export const agendaDict = {
  id: {
    agenda: {
      eyebrow: "Agenda",
      title: "Agenda Kegiatan",
      subtitle:
        "Kegiatan mendatang dan riwayat kegiatan ekosistem MUHDIN — pelatihan, rakernas, hingga safari silaturahmi.",
      sectionUpcoming: "Mendatang",
      sectionPast: "Telah Terlaksana",
      upcomingAria: "Daftar agenda mendatang",
      pastAria: "Daftar kegiatan yang telah terlaksana",
      badgeOngoing: "Berlangsung",
      ongoingAria: "Kegiatan sedang berlangsung",
      dateAria: "Tanggal kegiatan",
      locationAria: "Lokasi kegiatan",
      until: "s.d. {date}",
      emptyUpcoming: "Belum ada agenda mendatang. Pantau halaman ini untuk jadwal terbaru.",
      emptyPast: "Belum ada riwayat kegiatan.",
      catPelatihan: "Pelatihan",
      catRakernas: "Rakernas",
      catSafari: "Safari",
      catKegiatan: "Kegiatan",
    },
  },
  en: {
    agenda: {
      eyebrow: "Agenda",
      title: "Events Agenda",
      subtitle:
        "Upcoming events and the activity history of the MUHDIN ecosystem — trainings, national meetings, and goodwill visits.",
      sectionUpcoming: "Upcoming",
      sectionPast: "Past Events",
      upcomingAria: "List of upcoming events",
      pastAria: "List of past events",
      badgeOngoing: "Ongoing",
      ongoingAria: "Event is currently ongoing",
      dateAria: "Event date",
      locationAria: "Event location",
      until: "until {date}",
      emptyUpcoming: "No upcoming events yet. Watch this page for the latest schedule.",
      emptyPast: "No event history yet.",
      catPelatihan: "Training",
      catRakernas: "National Meeting",
      catSafari: "Visit",
      catKegiatan: "Activity",
    },
  },
  ar: {
    agenda: {
      eyebrow: "الفعاليات",
      title: "أجندة الأنشطة",
      subtitle: "الفعاليات القادمة وسجل أنشطة منظومة موهدين — دورات تدريبية واجتماعات وطنية وزيارات تواصل.",
      sectionUpcoming: "القادمة",
      sectionPast: "المنتهية",
      upcomingAria: "قائمة الفعاليات القادمة",
      pastAria: "قائمة الفعاليات المنتهية",
      badgeOngoing: "جارية الآن",
      ongoingAria: "الفعالية جارية حاليا",
      dateAria: "تاريخ الفعالية",
      locationAria: "موقع الفعالية",
      until: "حتى {date}",
      emptyUpcoming: "لا توجد فعاليات قادمة بعد. تابع هذه الصفحة لأحدث الجداول.",
      emptyPast: "لا يوجد سجل أنشطة بعد.",
      catPelatihan: "تدريب",
      catRakernas: "اجتماع وطني",
      catSafari: "زيارة",
      catKegiatan: "نشاط",
    },
  },
} as const;
