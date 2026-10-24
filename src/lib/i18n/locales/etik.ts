/**
 * namespace "etik" — dikelola oleh agent Task 5-b-2 (EtikView, route #/etik).
 * Kode Etik & Papan Sanksi Publik MUHDIN.
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const etikDict = {
  id: {
    etik: {
      hero: {
        eyebrow: "INTEGRITAS INDUSTRI",
        title: "Kode Etik & Papan Sanksi",
        subtitle:
          "Kepercayaan jamaah dibangun oleh anggota yang jujur — dan dijaga oleh penegakan aturan yang konsisten. Di sinilah MUHDIN menarik garisnya.",
      },
      prinsip: {
        title: "Enam Prinsip Kode Etik Anggota",
        desc: "Setiap anggota MUHDIN menandatangani komitmen pada enam prinsip ini — melanggarnya berarti mempertaruhkan keanggotaan itu sendiri.",
        items: {
          honesty: {
            t: "Kejujuran penawaran",
            d: "Tanpa klaim menyesatkan dan tanpa biaya tersembunyi — apa yang dijanjikan harus sesuai kenyataan.",
          },
          contract: {
            t: "Kontrak tertulis dengan jamaah",
            d: "Perjanjian tertulis sesuai regulasi, dibaca dan dipahami jamaah sebelum tanda tangan.",
          },
          funds: {
            t: "Perlindungan dana jamaah",
            d: "Dana jamaah dipisahkan dari kas usaha, dikelola transparan, dan tidak disalahgunakan dalam bentuk apa pun.",
          },
          service: {
            t: "Mutu layanan di Tanah Suci",
            d: "Maktab, hotel, dan transport sesuai kontrak — bukan janji brosur yang berubah saat tiba di Haramain.",
          },
          privacy: {
            t: "Kerahasiaan data jamaah",
            d: "Data pribadi jamaah dijaga ketat dan tidak dibagikan tanpa izin — termasuk setelah perjalanan usai.",
          },
          cooperation: {
            t: "Kerja sama industri yang sehat",
            d: "Bersaing secara sportif tanpa fitnah dan kampanye hitam antar-anggota.",
          },
        },
      },
      alur: {
        title: "Alur Penegakan",
        desc: "Empat tahap berjelas — dari laporan masuk hingga sanksi dipublikasikan.",
        steps: {
          report: {
            t: "Laporan masuk",
            d: "Dari publik maupun anggota — identitas pelapor dilindungi penuh.",
          },
          investigate: {
            t: "Investigasi Dewan Etik",
            d: "Maksimal 14 hari kerja; kedua pihak didengar beserta buktinya.",
          },
          trial: {
            t: "Sidang & putusan",
            d: "Majelis dewan etik memutus berdasarkan berkas audit dan pembelaan kedua pihak.",
          },
          sanction: {
            t: "Sanksi & publikasi",
            d: "Papan sanksi diperbarui; regulator diinformasikan bila diperlukan.",
          },
        },
      },
      sanksi: {
        title: "Jenis Sanksi",
        desc: "Tiga tingkat sanksi yang sesuai bobot pelanggaran — semuanya tercatat dan dapat dipublikasikan.",
        items: {
          teguran: {
            t: "Teguran Tertulis",
            d: "Peringkatan ringan dengan kewajiban perbaikan dalam 30 hari, dipantau hingga tuntas.",
          },
          suspend: {
            t: "Penangguhan (Suspend)",
            d: "Dihapus dari pencarian publik, diberi badge verifikasi merah, dan dilarang memakai nama MUHDIN.",
            badge: "DITANGGUHKAN",
          },
          cabut: {
            t: "Pencabutan Keanggotaan",
            d: "Dikeluarkan dan diumumkan; dilaporkan ke Kementerian Haji & Umrah/Kemenag bila menyangkut perizinan.",
          },
        },
      },
      papan: {
        title: "Papan Sanksi Publik",
        desc: "Data langsung dari basis data keanggotaan — diperbarui otomatis.",
        loading: "Memuat papan sanksi…",
        error: "Papan sanksi gagal dimuat.",
        retry: "Coba lagi",
        empty: "Alhamdulillah — saat ini tidak ada anggota MUHDIN yang sedang menjalani sanksi.",
        license: "No. Lisensi",
        note: "Catatan: anggota berstatus PENDING tidak masuk papan sanksi — verifikasi mereka masih dalam proses.",
      },
      lapor: {
        title: "Laporkan Pelanggaran",
        desc: "Melihat prinsip ini dilanggar? Sampaikan — setiap laporan ditindaklanjuti oleh Dewan Etik.",
        cta: "Portal Pengaduan Resmi",
        pointIdentity: "Identitas pelapor publik dirahasiakan — tidak pernah dibagikan ke pihak mana pun.",
        pointDefamation: "Laporan fitnah berat sanksinya — pastikan laporan Anda berbasis bukti.",
      },
      presumption:
        "Prinsip kami: dugaan tidak menjadikan anggota bersalah sebelum ada putusan dewan etik. Papan ini hanya menampilkan sanksi yang telah berkekuatan.",
      recovery: "Sanksi yang telah selesai masa pemulihan dapat dihapus dari papan.",
      cta: {
        verify: "Cek Verifikasi Penyelenggara",
        transparency: "Transparansi Terbuka",
      },
    },
  },
  en: {
    etik: {
      hero: {
        eyebrow: "INDUSTRY INTEGRITY",
        title: "Code of Ethics & Sanctions Board",
        subtitle:
          "Pilgrims' trust is built by honest members — and guarded by consistent enforcement. This is where MUHDIN draws the line.",
      },
      prinsip: {
        title: "The Six Principles of Member Ethics",
        desc: "Every MUHDIN member signs a commitment to these six principles — violating them puts membership itself at stake.",
        items: {
          honesty: {
            t: "Honest offering",
            d: "No misleading claims and no hidden fees — what is promised must match reality.",
          },
          contract: {
            t: "Written contract with pilgrims",
            d: "A clear written agreement compliant with regulations, read and understood before signing.",
          },
          funds: {
            t: "Protection of pilgrims' funds",
            d: "Pilgrim funds are segregated from operating cash, managed transparently, and never misused.",
          },
          service: {
            t: "Service quality in the Holy Land",
            d: "Maktab, hotel, and transport as contracted — not brochure promises that change upon arrival.",
          },
          privacy: {
            t: "Pilgrim data confidentiality",
            d: "Personal data is strictly protected and never shared without consent — even after the journey ends.",
          },
          cooperation: {
            t: "Healthy industry cooperation",
            d: "Compete fairly, without slander or smear campaigns between members.",
          },
        },
      },
      alur: {
        title: "Enforcement Flow",
        desc: "Four clear stages — from report intake to public sanction.",
        steps: {
          report: {
            t: "Report received",
            d: "From the public or members — the reporter's identity is fully protected.",
          },
          investigate: {
            t: "Ethics Council investigation",
            d: "Up to 14 working days; both parties are heard along with their evidence.",
          },
          trial: {
            t: "Hearing & verdict",
            d: "The ethics council decides based on audit files and both parties' defenses.",
          },
          sanction: {
            t: "Sanction & publication",
            d: "The sanctions board is updated; regulators are informed when necessary.",
          },
        },
      },
      sanksi: {
        title: "Types of Sanctions",
        desc: "Three sanction levels proportionate to the violation — all documented and publishable.",
        items: {
          teguran: {
            t: "Written Warning",
            d: "A light reprimand with a mandatory 30-day correction window, monitored to completion.",
          },
          suspend: {
            t: "Suspension",
            d: "Removed from public search, marked with a red verification badge, and barred from using the MUHDIN name.",
            badge: "SUSPENDED",
          },
          cabut: {
            t: "Membership Revocation",
            d: "Expelled and publicly announced; reported to the Ministry of Hajj & Umrah/Religious Affairs when licensing is involved.",
          },
        },
      },
      papan: {
        title: "Public Sanctions Board",
        desc: "Live data from the membership database — updated automatically.",
        loading: "Loading the sanctions board…",
        error: "Failed to load the sanctions board.",
        retry: "Try again",
        empty: "Alhamdulillah — no MUHDIN member is currently serving a sanction.",
        license: "License No.",
        note: "Note: members with PENDING status are not listed on the sanctions board — their verification is still in process.",
      },
      lapor: {
        title: "Report a Violation",
        desc: "Saw these principles violated? Tell us — every report is handled by the Ethics Council.",
        cta: "Official Complaint Portal",
        pointIdentity: "The identity of a public reporter is kept strictly confidential.",
        pointDefamation: "Defamatory reports carry heavy sanctions — make sure yours is evidence-based.",
      },
      presumption:
        "Our principle: an allegation does not make a member guilty before the ethics council has ruled. This board only lists sanctions in force.",
      recovery: "Sanctions that have completed their rehabilitation period may be removed from the board.",
      cta: {
        verify: "Check Operator Verification",
        transparency: "Open Transparency",
      },
    },
  },
  ar: {
    etik: {
      hero: {
        eyebrow: "نزاهة القطاع",
        title: "مدونة السلوك ولوحة الجزاءات",
        subtitle:
          "ثقة الحجاج تُبنى بأعضاء صادقين — وتُصان بإنفاذٍ متّسق للأنظمة. هنا يضع مهدين خطوطه الحمراء.",
      },
      prinsip: {
        title: "المبادئ الستّ لمدونة سلوك الأعضاء",
        desc: "كل عضو في مهدين يوقّع التزاماً بهذه المبادئ الستّ — ومخالفتها تعرّض العضوية نفسها للخطر.",
        items: {
          honesty: {
            t: "الصدق في العروض",
            d: "بلا ادّعاءات مضلِّلة ولا تكاليف خفيّة — ما يُوعَد به الحاج يجب أن يطابق الواقع.",
          },
          contract: {
            t: "عقد مكتوب مع الحاج",
            d: "عقد مكتوب واضح يطابق الأنظمة واللوائح، يُقرأ ويُفهم قبل التوقيع.",
          },
          funds: {
            t: "حماية أموال الحجاج",
            d: "فصل أموال الحجاج عن أموال النشاط، وإدارتها بشفافية دون أي إساءة استخدام.",
          },
          service: {
            t: "جودة الخدمة في الأرض المقدسة",
            d: "المكتب والفندق والنقل وفق العقد — لا وفق وعود الكتيّبات.",
          },
          privacy: {
            t: "سرية بيانات الحجاج",
            d: "حفظ البيانات الشخصية وعدم مشاركتها دون إذن — حتى بعد انتهاء الرحلة.",
          },
          cooperation: {
            t: "تعاون قطاعي سليم",
            d: "منافسة صحية بلا تشهير أو حملات تشويه بين الأعضاء.",
          },
        },
      },
      alur: {
        title: "مسار الإنفاذ",
        desc: "أربع مراحل واضحة — من استلام البلاغ حتى نشر الجزاء.",
        steps: {
          report: {
            t: "استلام البلاغ",
            d: "من الجمهور أو الأعضاء — وتُحمى هوية المُبلِّغ كاملة.",
          },
          investigate: {
            t: "تحقيق لجنة الأخلاقيات",
            d: "بحد أقصى 14 يوم عمل، ويُستمع إلى الطرفين مع أدلتهما.",
          },
          trial: {
            t: "الجلسة والحكم",
            d: "يبتّ مجلس الأخلاقيات بناءً على ملف التدقيق ودفوع الطرفين.",
          },
          sanction: {
            t: "الجزاء والنشر",
            d: "تُحدَّث لوحة الجزاءات، وتُبلَّغ الجهات المنظِّمة عند الحاجة.",
          },
        },
      },
      sanksi: {
        title: "أنواع الجزاءات",
        desc: "ثلاث درجات من الجزاء تتناسب مع ثقل المخالفة — جميعها موثّقة وقابلة للنشر.",
        items: {
          teguran: {
            t: "إنذار كتابي",
            d: "تحذير خفيف مع التزام بالتصحيح خلال 30 يوماً، تحت المراقبة حتى التمام.",
          },
          suspend: {
            t: "الإيقاف المؤقت",
            d: "يُحذف من البحث العام، ويوضع عليه شارة تحقق حمراء، ويُمنع من استخدام اسم مهدين.",
            badge: "موقوف",
          },
          cabut: {
            t: "سحب العضوية",
            d: "طرد وإعلان علني، وإبلاغ وزارة الحج والعمرة/وزارة الشؤون الدينية إذا تعلق الأمر بالتراخيص.",
          },
        },
      },
      papan: {
        title: "لوحة الجزاءات العامة",
        desc: "بيانات حيّة من قاعدة بيانات العضوية — تُحدَّث تلقائياً.",
        loading: "جارٍ تحميل لوحة الجزاءات…",
        error: "تعذّر تحميل لوحة الجزاءات.",
        retry: "إعادة المحاولة",
        empty: "الحمد لله — لا يوجد حالياً أي عضو في مهدين يخضع لجزاء.",
        license: "رقم الترخيص",
        note: "ملاحظة: الأعضاء بحالة «قيد التحقق» لا يدخلون لوحة الجزاءات — طلبهم لا يزال قيد المراجعة.",
      },
      lapor: {
        title: "الإبلاغ عن مخالفة",
        desc: "شاهدتَ مخالفة لهذه المبادئ؟ أبلغنا — كل بلاغ تتولاه لجنة الأخلاقيات.",
        cta: "بوابة الشكاوى الرسمية",
        pointIdentity: "هوية المُبلِّغ سرية ولا تُشارك مع أي طرف أبداً.",
        pointDefamation: "البلاغ الكيدي جزاؤه شديد — احرص على أن يكون بلاغك مبنياً على أدلة.",
      },
      presumption:
        "مبدؤنا: الاشتباه وحده لا يجعل العضو مذنباً قبل صدور حكم مجلس الأخلاقيات — واللوحة تعرض الجزاءات النافذة فقط.",
      recovery: "الجزاء الذي اكتملت مدة استرداده يمكن حذفه من اللوحة.",
      cta: {
        verify: "تحقّق من منظم الحج",
        transparency: "الشفافية المفتوحة",
      },
    },
  },
} as const;
