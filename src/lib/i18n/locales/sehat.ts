/**
 * namespace "sehat" — dikelola oleh agent Task 5-c (SehatView, route #/sehat).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const sehatDict = {
  id: {
    sehat: {
      hero: {
        eyebrow: "Proteksi Jamaah",
        title: "Pusat Kesehatan Jamaah",
        subtitle:
          "Sihat sebelum, selama, dan setelah perjalanan ibadah — vaksinasi, klinik rujukan Indonesia di Tanah Suci, dan kesiapan pribadi.",
      },
      vax: {
        title: "Vaksinasi Sebelum Keberangkatan",
        desc: "Lengkapi vaksinasi sesuai ketentuan otoritas kesehatan RI & Arab Saudi sebelum hari keberangkatan.",
        badge: {
          wajib: "Wajib",
          anjuran: "Anjuran",
          ketentuan: "Sesuai ketentuan",
          terkini: "Ketentuan terkini",
        },
        cta: "Detail layanan",
        items: {
          meningitis: {
            t: "Meningitis ACWY",
            d: "Wajib (kuartal meningitis), minimal 10 hari sebelum keberangkatan, dengan sertifikat vaksinasi internasional.",
          },
          flu: {
            t: "Influenza",
            d: "Dianjurkan — terutama menjelang musim dingin dan keramaian peziarah.",
          },
          polio: {
            t: "Polio",
            d: "Sesuai ketentuan terbaru untuk rute dan kelompok usia tertentu.",
          },
          covid: {
            t: "COVID-19",
            d: "Mengikuti ketentuan terkini otoritas Kesehatan RI dan Arab Saudi.",
          },
        },
      },
      kkh: {
        title: "Klinik Kesehatan Haji (KKH) Indonesia di Tanah Suci",
        desc: "Jaringan klinik Indonesia untuk jamaah — hadir di tiga kota utama perjalanan ibadah.",
        items: {
          jeddah: {
            t: "KKH Jeddah",
            d: "Gerbang kedatangan & pemulangan jamaah.",
          },
          makkah: {
            t: "KKH Makkah",
            d: "Dekat pusat ibadah — layanan selama manasik.",
          },
          madinah: {
            t: "KKH Madinah",
            d: "Layanan kesehatan jamaah di Madinah.",
          },
        },
        servicesLabel: "Layanan utama",
        services: {
          umum: "Poli umum & pemeriksaan dasar",
          rujuk: "Rujukan ke rumah sakit Saudi",
          assist: "Pendampingan jamaah sakit",
        },
        note: "Lokasi & jam layanan terkini selalu diumumkan resmi saat musim — hubungi Tour Leader atau PPIU Anda.",
      },
      ready: {
        title: "Kesiapan Pribadi Jamaah",
        desc: "Checklist pribadi sebelum berangkat — kerjakan bersama dokter Anda.",
        items: {
          meds: {
            t: "Obat pribadi",
            d: "Bawa obat dalam kemasan asli beserta surat dokter berbahasa Inggris.",
          },
          narcotics: {
            t: "Wajib tahu: obat terlarang",
            d: "Obat mengandung kodein/tramadol dilarang tanpa izin resmi — aturan ketat Arab Saudi.",
          },
          hydration: {
            t: "Hidrasi & cuaca",
            d: "Jaga asupan cairan dan kenali manajemen cuaca panas Tanah Suci.",
          },
          fitness: {
            t: "Kebugaran pra-keberangkatan",
            d: "Latih jalan kaki teratur 4–6 minggu sebelum keberangkatan.",
          },
          chronic: {
            t: "Kelola penyakit kronis",
            d: "Pastikan stok obat cukup dan jadwal minum obat teratur selama perjalanan.",
          },
          finances: {
            t: "Perlindungan finansial",
            d: "Aktifkan asuransi perjalanan sejak hari pertama keberangkatan.",
          },
        },
      },
      insurance: {
        title: "Asuransi & Jaminan Perjalanan",
        cardTitle: "Polis wajib diterima sebelum berangkat",
        cardDesc: "Pastikan polis asuransi dari PPIU Anda telah diterima dan dipahami sebelum hari keberangkatan. Pahami cakupannya:",
        cover: {
          inpatient: "Perawatan rawat inap & rawat jalan di Arab Saudi",
          repatriation: "Repatriasi medis & pengurusan jenasah",
          accident: "Kecelakaan diri & tanggung jawab pihak ketiga",
        },
        tjh: "Jamaah haji juga terlindungi TJH — asuransi khusus jamaah haji yang diselenggarakan otoritas Arab Saudi.",
      },
      disclaimer: {
        text: "Konten halaman ini bersifat edukasi dan bukan pengganti konsultasi medis. Keputusan kesehatan selalu diambil bersama dokter Anda.",
      },
      cta: {
        emergency: "Posko Darurat",
        vaksin: "Layanan Vaksin",
      },
    },
  },
  en: {
    sehat: {
      hero: {
        eyebrow: "Pilgrim Protection",
        title: "Pilgrim Health Centre",
        subtitle:
          "Healthy before, during, and after the journey of worship — vaccination, the Indonesian referral clinics in the Holy Land, and personal readiness.",
      },
      vax: {
        title: "Vaccination Before Departure",
        desc: "Complete vaccinations per the Indonesian & Saudi health authorities' requirements before departure day.",
        badge: {
          wajib: "Mandatory",
          anjuran: "Recommended",
          ketentuan: "Per regulations",
          terkini: "Latest rules",
        },
        cta: "Service details",
        items: {
          meningitis: {
            t: "ACWY Meningitis",
            d: "Mandatory (quadrivalent), at least 10 days before departure, with an international vaccination certificate.",
          },
          flu: {
            t: "Influenza",
            d: "Recommended — especially ahead of winter and peak pilgrim crowds.",
          },
          polio: {
            t: "Polio",
            d: "Per the latest regulations for certain routes and age groups.",
          },
          covid: {
            t: "COVID-19",
            d: "Following the latest rules of the Indonesian and Saudi health authorities.",
          },
        },
      },
      kkh: {
        title: "Indonesian Hajj Health Clinics (KKH) in the Holy Land",
        desc: "A network of Indonesian clinics for pilgrims — present in the three main cities of the journey.",
        items: {
          jeddah: {
            t: "KKH Jeddah",
            d: "The gateway for pilgrim arrivals & departures.",
          },
          makkah: {
            t: "KKH Makkah",
            d: "Near the centre of worship — service during the rites.",
          },
          madinah: {
            t: "KKH Madinah",
            d: "Health services for pilgrims in Madinah.",
          },
        },
        servicesLabel: "Main services",
        services: {
          umum: "General clinic & basic examinations",
          rujuk: "Referral to Saudi hospitals",
          assist: "Assistance for ill pilgrims",
        },
        note: "Current locations & service hours are officially announced each season — contact your Tour Leader or PPIU.",
      },
      ready: {
        title: "Personal Readiness",
        desc: "A personal checklist before departure — work through it with your doctor.",
        items: {
          meds: {
            t: "Personal medication",
            d: "Carry medicines in their original packaging with a doctor's letter in English.",
          },
          narcotics: {
            t: "Must know: prohibited drugs",
            d: "Medicines containing codeine/tramadol are prohibited without official permission — strictly enforced in Saudi Arabia.",
          },
          hydration: {
            t: "Hydration & weather",
            d: "Maintain fluid intake and learn to manage the Holy Land's heat.",
          },
          fitness: {
            t: "Pre-departure fitness",
            d: "Train with regular walks 4–6 weeks before departure.",
          },
          chronic: {
            t: "Manage chronic illness",
            d: "Ensure sufficient medicine stock and a regular dosing schedule during the trip.",
          },
          finances: {
            t: "Financial protection",
            d: "Activate travel insurance from the first day of departure.",
          },
        },
      },
      insurance: {
        title: "Travel Insurance & Coverage",
        cardTitle: "The policy must be received before departure",
        cardDesc: "Make sure the insurance policy from your PPIU has been received and understood before departure day. Understand its coverage:",
        cover: {
          inpatient: "Inpatient & outpatient care in Saudi Arabia",
          repatriation: "Medical repatriation & funeral arrangements",
          accident: "Personal accident & third-party liability",
        },
        tjh: "Hajj pilgrims are additionally covered by TJH — Saudi Arabia's dedicated hajj pilgrims insurance scheme.",
      },
      disclaimer: {
        text: "The content of this page is educational and not a substitute for medical consultation. Health decisions are always made together with your doctor.",
      },
      cta: {
        emergency: "Emergency Post",
        vaksin: "Vaccination Services",
      },
    },
  },
  ar: {
    sehat: {
      hero: {
        eyebrow: "حماية الحجاج",
        title: "مركز صحة الحجاج والمعتمرين",
        subtitle:
          "الصحة قبل رحلة العبادة وأثناءها وبعدها — التطعيمات، والعيادات الإندونيسية المُحيلة في الأرض المقدسة، والاستعداد الشخصي.",
      },
      vax: {
        title: "التطعيمات قبل السفر",
        desc: "أكمل التطعيمات وفق أنظمة الجهات الصحية الإندونيسية والسعودية قبل يوم المغادرة.",
        badge: {
          wajib: "إلزامي",
          anjuran: "مستحسن",
          ketentuan: "وفق الأنظمة",
          terkini: "أحدث الأنظمة",
        },
        cta: "تفاصيل الخدمة",
        items: {
          meningitis: {
            t: "الحمى الشوكية ACWY",
            d: "إلزامي (رباعية المصل)، قبل المغادرة بـ 10 أيام على الأقل، مع شهادة تطعيم دولية.",
          },
          flu: {
            t: "الإنفلونزا",
            d: "مستحسن — خصوصًا مع اقتراب فصل الشتاء وأوقات الازدحام.",
          },
          polio: {
            t: "الشلل الفتي (البوليو)",
            d: "وفق أحدث الأنظمة لمسارات وفئات عمرية معينة.",
          },
          covid: {
            t: "كوفيد-19",
            d: "وفق أحدث أنظمة الجهات الصحية في إندونيسيا والسعودية.",
          },
        },
      },
      kkh: {
        title: "العيادات الإندونيسية لصحة الحج (KKH) في الأرض المقدسة",
        desc: "شبكة عيادات إندونيسية للحجاج — حاضرة في المدن الرئيسة الثلاث للرحلة.",
        items: {
          jeddah: {
            t: "عيادة جدة",
            d: "بوابة وصول الحجاج وعودتهم.",
          },
          makkah: {
            t: "عيادة مكة",
            d: "قرب مركز العبادة — خدمة أثناء المناسك.",
          },
          madinah: {
            t: "عيادة المدينة",
            d: "خدمات صحة الحجاج في المدينة المنورة.",
          },
        },
        servicesLabel: "الخدمات الرئيسة",
        services: {
          umum: "عيادة عامة وفحوصات أساسية",
          rujuk: "إحالة إلى المستشفيات السعودية",
          assist: "مرافقة الحجاج المرضى",
        },
        note: "المواقع وأوقات العمل تُعلن رسميًا في كل موسم — تواصل مع قائد الرحلة أو شركة السفر.",
      },
      ready: {
        title: "الاستعداد الشخصي للحاج",
        desc: "قائمة تحقق شخصية قبل السفر — أنجزها مع طبيبك.",
        items: {
          meds: {
            t: "الأدوية الشخصية",
            d: "احمل الأدوية في عبوتها الأصلية مع خطاب طبي بالإنجليزية.",
          },
          narcotics: {
            t: "تنبيه: أدوية ممنوعة",
            d: "الأدوية المحتوية على كودايين أو ترامادول ممنوعة دون إذن رسمي — أنظمة سعودية صارمة.",
          },
          hydration: {
            t: "الترطيب والطقس",
            d: "حافظ على شرب الماء وتعرّف على التعامل مع حرارة الأرض المقدسة.",
          },
          fitness: {
            t: "اللياقة قبل السفر",
            d: "تدرّب على المشي بانتظام 4–6 أسابيع قبل المغادرة.",
          },
          chronic: {
            t: "إدارة الأمراض المزمنة",
            d: "احرص على كفاية مخزون الدواء وانتظام جدول تناوله أثناء الرحلة.",
          },
          finances: {
            t: "الحماية المالية",
            d: "فعّل تأمين السفر من اليوم الأول للمغادرة.",
          },
        },
      },
      insurance: {
        title: "التأمين وضمانات الرحلة",
        cardTitle: "البوليصة يجب استلامها قبل السفر",
        cardDesc: "تأكد من استلام بوليصة التأمين من شركة السفر وفهمها قبل يوم المغادرة. افحص نطاق التغطية:",
        cover: {
          inpatient: "الرعاية الداخلية والخارجية في السعودية",
          repatriation: "الإعادة الطبية إلى الوطن وإجراءات الجثمان",
          accident: "الحوادث الشخصية والمسؤولية تجاه الغير",
        },
        tjh: "يتمتع حجاج بيت الله بحماية إضافية عبر (TJH) — برنامج التأمين الخاص بالحجاج في المملكة العربية السعودية.",
      },
      disclaimer: {
        text: "محتوى هذه الصفحة تعليمي وليس بديلًا عن الاستشارة الطبية. تُتخذ القرارات الصحية دائمًا مع طبيبك.",
      },
      cta: {
        emergency: "نقطة الطوارئ",
        vaksin: "خدمات التطعيم",
      },
    },
  },
} as const;
