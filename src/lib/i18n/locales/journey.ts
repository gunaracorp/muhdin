/**
 * namespace "journey" — dikelola oleh agent Task 14-b.
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const journeyDict = {
  id: {
    journey: {
      eyebrow: "End-to-End Journey",
      title: "Alur Perjalanan Jamaah 13 Tahap",
      subtitleBefore:
        "Setiap tahap menghasilkan rekaman digital yang menjadi dasar tahap berikutnya — prinsip ",
      handover: "zero-gap handover",
      subtitleAfter:
        ": tidak ada perpindahan tanggung jawab tanpa rekaman dan konfirmasi digital.",
      actorLabel: "Aktor Utama",
      outputLabel: "Output Digital",
      ownershipTitle: "Kepemilikan Masalah Jelas di Setiap Titik",
      ownershipSubtitle:
        "Tour leader bertanggung jawab atas kehadiran jamaah, handler atas mobilitas, mutawif atas pembinaan ibadah, dan command center atas keseluruhan orkestrasi.",
      cta: "Gabung dalam Ekosistem",
    },
  },
  en: {
    journey: {
      eyebrow: "End-to-End Journey",
      title: "The 13-Step Pilgrim Journey",
      subtitleBefore:
        "Every stage produces a digital record that becomes the basis for the next — the ",
      handover: "zero-gap handover",
      subtitleAfter:
        " principle: no transfer of responsibility without records and digital confirmation.",
      actorLabel: "Main Actor",
      outputLabel: "Digital Output",
      ownershipTitle: "Clear Ownership at Every Point",
      ownershipSubtitle:
        "Tour leaders are accountable for pilgrim attendance, handlers for mobility, mutawif for worship guidance, and the command center for the overall orchestration.",
      cta: "Join the Ecosystem",
    },
  },
  ar: {
    journey: {
      eyebrow: "الرحلة من طرف إلى طرف",
      title: "مسار رحلة الحجاج في 13 مرحلة",
      subtitleBefore:
        "تُنتج كل مرحلة سجلاً رقمياً يصبح أساساً للمرحلة التالية — مبدأ ",
      handover: "zero-gap handover",
      subtitleAfter:
        ": لا انتقال للمسؤولية دون سجلات وتأكيد رقمي.",
      actorLabel: "الجهة الرئيسية المسؤولة",
      outputLabel: "المخرج الرقمي",
      ownershipTitle: "وضوح المسؤولية في كل نقطة",
      ownershipSubtitle:
        "قائد الرحلة مسؤول عن حضور الحجاج، والمداخ عن التنقل، والمطوِّف عن الإرشاد العبادي، ومركز القيادة عن التنسيق الكامل.",
      cta: "انضم إلى المنظومة",
    },
  },
} as const;
