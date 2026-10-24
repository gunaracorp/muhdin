/**
 * namespace "pdp" — dikelola oleh agent Task 5-c (PdpView, route #/pdp).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const pdpDict = {
  id: {
    pdp: {
      hero: {
        eyebrow: "Kepatuhan Privasi",
        title: "Kepatuhan UU PDP No. 27 Tahun 2022",
        subtitle:
          "MUHDIN mengelola data jamaah dan anggota dengan standar Undang-Undang Pelindungan Data Pribadi — transparan, terbatas, dan terlindungi.",
      },
      callout: {
        title: "Berlaku penuh 17 Oktober 2024",
        text: "UU Pelindungan Data Pribadi No. 27 Tahun 2022 berlaku penuh sejak 17 Oktober 2024. Halaman ini adalah kanal resmi pemenuhan hak subjek data di lingkungan MUHDIN.",
      },
      principles: {
        title: "Prinsip Pemrosesan Data",
        desc: "Seluruh pemrosesan data pribadi di lingkungan MUHDIN tunduk pada prinsip-prinsip pelindungan data.",
        items: {
          purpose: {
            t: "Terbatas Tujuan",
            d: "Data hanya diproses sesuai tujuan yang jelas dan sah, tanpa penyimpangan.",
          },
          notice: {
            t: "Transparansi & Pemberitahuan",
            d: "Subjek data diberi tahu secara lengkap tentang tujuan, dasar, dan cara pemrosesannya.",
          },
          minimize: {
            t: "Minimasi Data",
            d: "Hanya data yang relevan dan memang diperlukan yang dikumpulkan dan disimpan.",
          },
          accuracy: {
            t: "Akurasi",
            d: "Data dijaga agar selalu akurat, lengkap, dan diperbarui sesuai keadaan terkini.",
          },
          security: {
            t: "Keamanan",
            d: "Dilindungi dengan langkah teknis dan organisasi sesuai standar keamanan yang berlaku.",
          },
          accountability: {
            t: "Akuntabilitas",
            d: "Seluruh aksi tercatat pada jejak audit dan dapat dipertanggungjawabkan.",
          },
        },
      },
      rights: {
        title: "Hak Subjek Data",
        desc: "Anda memiliki hak-hak berikut sesuai Pasal 5–13 UU PDP. Ajukan pemenuhannya melalui formulir DSAR di bawah.",
        items: {
          access: {
            t: "Akses Data",
            article: "Pasal 7",
            d: "Hak mengakses dan memperoleh informasi tentang data pribadi Anda yang diproses.",
          },
          copy: {
            t: "Salinan Data",
            article: "Pasal 8",
            d: "Hak memperoleh salinan data pribadi dalam bentuk tertulis atau elektronik.",
          },
          correct: {
            t: "Koreksi Data",
            article: "Pasal 6",
            d: "Hak mengoreksi dan memperbarui data pribadi agar akurat dan lengkap.",
          },
          erase: {
            t: "Penghapusan Data",
            article: "Pasal 9",
            d: "Hak menghapus atau memusnahkan data pribadi dalam kondisi tertentu.",
          },
          withdraw: {
            t: "Penarikan Persetujuan",
            article: "Pasal 5",
            d: "Hak menarik kembali persetujuan pemrosesan data pribadi.",
          },
          objection: {
            t: "Keberatan Pemrosesan",
            article: "Pasal 12",
            d: "Hak mengajukan keberatan atas pemrosesan data dalam keadaan tertentu.",
          },
          compensation: {
            t: "Kompensasi Pelanggaran",
            article: "Pasal 13",
            d: "Hak memperoleh kompensasi atas pelanggaran pemrosesan data pribadi.",
          },
        },
      },
      dsar: {
        title: "Ajukan Permintaan (DSAR)",
        desc: "Data Subject Access Request — permintaan resmi pemenuhan hak subjek data. Isi formulir berikut; identitas Anda akan diverifikasi sebelum permintaan diproses.",
        labelName: "Nama lengkap",
        phName: "Nama sesuai identitas",
        labelEmail: "Email",
        phEmail: "nama@email.com",
        labelType: "Jenis permintaan",
        phType: "Pilih jenis permintaan",
        opt: {
          akses: "Akses data",
          salinan: "Salinan data",
          koreksi: "Koreksi data",
          hapus: "Penghapusan data",
          tarik: "Penarikan persetujuan",
          keberatan: "Keberatan pemrosesan",
        },
        labelDesc: "Uraian permintaan",
        phDesc: "Jelaskan permintaan Anda (minimal 10 karakter)…",
        labelPhone: "No. WhatsApp",
        phPhone: "08xxxxxxxxxx",
        optional: "opsional",
        btnSubmit: "Kirim Permintaan",
        btnSubmitting: "Mengirim…",
        errName: "Nama wajib diisi.",
        errEmail: "Format email tidak valid.",
        errType: "Pilih jenis permintaan.",
        errDesc: "Uraian permintaan minimal 10 karakter.",
        toastOkTitle: "Permintaan terkirim",
        toastOkDesc: "Tim Pelindungan Data kami akan memproses permintaan Anda.",
        toastFailTitle: "Gagal mengirim permintaan",
        help: {
          verify: "Identitas Anda akan diverifikasi terlebih dahulu sebelum permintaan diproses.",
          sla: "Respons diberikan maksimal 3 hari kerja sejak permintaan diterima.",
          minimal:
            "Data yang tidak relevan dengan permintaan tidak akan diminta melalui formulir ini.",
        },
      },
      security: {
        title: "Perlindungan Teknis & Organisasi",
        desc: "Langkah konkret yang kami terapkan untuk menjaga data pribadi yang diproses.",
        items: {
          tls: {
            t: "Transport terenkripsi",
            d: "Seluruh lalu lintas data dilayani melalui koneksi terenkripsi.",
          },
          hash: {
            t: "Kata sandi ter-hash",
            d: "Kata sandi admin disimpan sebagai hash scrypt — tidak pernah dalam teks asli.",
          },
          audit: {
            t: "Jejak audit penuh",
            d: "Seluruh aksi CMS tercatat pada jejak audit yang dapat ditinjau.",
          },
          minimize: {
            t: "Minimasi publikasi",
            d: "Data kontak anggota tidak ditampilkan publik di halaman direktori.",
          },
          retention: {
            t: "Retensi & penghapusan terjadwal",
            d: "Data disimpan hanya selama diperlukan, lalu dihapus sesuai jadwal.",
          },
          rbac: {
            t: "Pembatasan akses berbasis peran",
            d: "Akses data dibatasi per peran dan diawasi secara berkala.",
          },
        },
      },
      dpo: {
        title: "DPO & Kanal Keluhan",
        desc: "Petugas Pelindungan Data (DPO) MUHDIN siap membantu pemenuhan hak Anda serta menerima keluhan seputar pemrosesan data pribadi.",
        contactLabel: "Petugas Pelindungan Data (DPO)",
        note: "Jika Anda tidak puas dengan respons kami, subjek data dapat mengajukan pengaduan kepada lembaga pengawas pelindungan data pribadi.",
      },
      cta: {
        terms: "Baca Syarat & Ketentuan",
      },
    },
  },
  en: {
    pdp: {
      hero: {
        eyebrow: "Privacy Compliance",
        title: "Indonesian PDP Law No. 27 of 2022 Compliance",
        subtitle:
          "MUHDIN manages pilgrim and member data to the standard of the Indonesian Personal Data Protection Law — transparent, limited, and protected.",
      },
      callout: {
        title: "Fully in force since 17 October 2024",
        text: "The Indonesian Personal Data Protection Law No. 27 of 2022 has been fully in force since 17 October 2024. This page is the official channel for exercising data subject rights within MUHDIN.",
      },
      principles: {
        title: "Data Processing Principles",
        desc: "All personal data processing within MUHDIN adheres to the principles of data protection.",
        items: {
          purpose: {
            t: "Purpose Limitation",
            d: "Data is processed only for clear and lawful purposes, without deviation.",
          },
          notice: {
            t: "Transparency & Notice",
            d: "Data subjects are fully informed of the purpose, basis, and manner of processing.",
          },
          minimize: {
            t: "Data Minimisation",
            d: "Only relevant and necessary data is collected and stored.",
          },
          accuracy: {
            t: "Accuracy",
            d: "Data is kept accurate, complete, and up to date at all times.",
          },
          security: {
            t: "Security",
            d: "Protected by technical and organisational measures to applicable standards.",
          },
          accountability: {
            t: "Accountability",
            d: "Every action is recorded in an audit trail and can be accounted for.",
          },
        },
      },
      rights: {
        title: "Data Subject Rights",
        desc: "You hold the following rights under Articles 5–13 of the PDP Law. Submit requests via the DSAR form below.",
        items: {
          access: {
            t: "Data Access",
            article: "Article 7",
            d: "Right to access and obtain information about your personal data being processed.",
          },
          copy: {
            t: "Data Copy",
            article: "Article 8",
            d: "Right to obtain a copy of personal data in written or electronic form.",
          },
          correct: {
            t: "Data Correction",
            article: "Article 6",
            d: "Right to correct and update personal data so it stays accurate and complete.",
          },
          erase: {
            t: "Data Deletion",
            article: "Article 9",
            d: "Right to delete or destroy personal data under certain conditions.",
          },
          withdraw: {
            t: "Consent Withdrawal",
            article: "Article 5",
            d: "Right to withdraw consent to the processing of personal data.",
          },
          objection: {
            t: "Processing Objection",
            article: "Article 12",
            d: "Right to object to the processing of data under certain circumstances.",
          },
          compensation: {
            t: "Breach Compensation",
            article: "Article 13",
            d: "Right to receive compensation for violations of personal data processing.",
          },
        },
      },
      dsar: {
        title: "Submit a Request (DSAR)",
        desc: "Data Subject Access Request — a formal request to exercise your data subject rights. Fill in the form below; your identity will be verified before the request is processed.",
        labelName: "Full name",
        phName: "Name as on your ID",
        labelEmail: "Email",
        phEmail: "name@email.com",
        labelType: "Request type",
        phType: "Choose a request type",
        opt: {
          akses: "Data access",
          salinan: "Data copy",
          koreksi: "Data correction",
          hapus: "Data deletion",
          tarik: "Consent withdrawal",
          keberatan: "Processing objection",
        },
        labelDesc: "Request details",
        phDesc: "Describe your request (at least 10 characters)…",
        labelPhone: "WhatsApp number",
        phPhone: "08xxxxxxxxxx",
        optional: "optional",
        btnSubmit: "Send Request",
        btnSubmitting: "Sending…",
        errName: "Name is required.",
        errEmail: "Invalid email format.",
        errType: "Choose a request type.",
        errDesc: "Request details must be at least 10 characters.",
        toastOkTitle: "Request sent",
        toastOkDesc: "Our Data Protection team will process your request.",
        toastFailTitle: "Failed to send request",
        help: {
          verify: "Your identity will be verified first before the request is processed.",
          sla: "A response is given within a maximum of 3 working days after the request is received.",
          minimal: "Data irrelevant to the request will not be requested through this form.",
        },
      },
      security: {
        title: "Technical & Organisational Protection",
        desc: "Concrete measures we apply to safeguard the personal data we process.",
        items: {
          tls: {
            t: "Encrypted transport",
            d: "All data traffic is served over encrypted connections.",
          },
          hash: {
            t: "Hashed passwords",
            d: "Admin passwords are stored as scrypt hashes — never in plain text.",
          },
          audit: {
            t: "Full audit trail",
            d: "Every CMS action is recorded in a reviewable audit trail.",
          },
          minimize: {
            t: "Publication minimisation",
            d: "Member contact data is never displayed publicly in directory pages.",
          },
          retention: {
            t: "Scheduled retention & deletion",
            d: "Data is kept only as long as necessary, then deleted on schedule.",
          },
          rbac: {
            t: "Role-based access control",
            d: "Data access is restricted per role and monitored regularly.",
          },
        },
      },
      dpo: {
        title: "DPO & Complaint Channel",
        desc: "The MUHDIN Data Protection Officer is ready to help you exercise your rights and receive complaints about personal data processing.",
        contactLabel: "Data Protection Officer (DPO)",
        note: "If you are not satisfied with our response, the data subject may lodge a complaint with the personal data protection supervisory authority.",
      },
      cta: {
        terms: "Read the Terms & Conditions",
      },
    },
  },
  ar: {
    pdp: {
      hero: {
        eyebrow: "الامتثال لخصوصية البيانات",
        title: "الامتثال لقانون حماية البيانات الشخصية رقم 27 لسنة 2022",
        subtitle:
          "تدير مهدين بيانات الحجاج والمعتمرين والأعضاء وفق معايير قانون حماية البيانات الشخصية الإندونيسي — بشفافية وتقييدٍ وحماية.",
      },
      callout: {
        title: "ساري المفعول بالكامل منذ 17 أكتوبر 2024",
        text: "دخل قانون حماية البيانات الشخصية الإندونيسي رقم 27 لسنة 2022 حيز النفاذ الكامل اعتبارًا من 17 أكتوبر 2024، وتُعد هذه الصفحة القناة الرسمية لصون حقوق أصحاب البيانات في مهدين.",
      },
      principles: {
        title: "مبادئ معالجة البيانات",
        desc: "تخضع جميع عمليات معالجة البيانات الشخصية في مهدين لمبادئ حماية البيانات المقررة.",
        items: {
          purpose: {
            t: "التحديد بهدف",
            d: "تُعالج البيانات فقط وفقًا لأهداف واضحة ومشروعة دون أي انحراف.",
          },
          notice: {
            t: "الشفافية والإخطار",
            d: "يُخبر صاحب البيانات على نحو كامل بغرض المعالجة وأساسها وطريقتها.",
          },
          minimize: {
            t: "تقليل البيانات",
            d: "لا تُجمع ولا تُخزَّن إلا البيانات ذات الصلة والضرورية فقط.",
          },
          accuracy: {
            t: "الدقة",
            d: "تُحفظ البيانات دقيقة وكاملة ومحدَّثة وفق آخر المستجدات.",
          },
          security: {
            t: "الأمان",
            d: "تُحمى بإجراءات تقنية وتنظيمية وفق معايير الأمان المقررة.",
          },
          accountability: {
            t: "المساءلة",
            d: "تُسجَّل جميع الإجراءات في سجل تدقيق قابل للمساءلة.",
          },
        },
      },
      rights: {
        title: "حقوق صاحب البيانات",
        desc: "لك الحقوق التالية وفق المواد 5–13 من قانون حماية البيانات الشخصية. قدِّم طلبك عبر نموذج DSAR أدناه.",
        items: {
          access: {
            t: "الوصول إلى البيانات",
            article: "المادة 7",
            d: "الحق في الوصول إلى بياناتك الشخصية الخاضعة للمعالجة والحصول على معلومات عنها.",
          },
          copy: {
            t: "نسخة من البيانات",
            article: "المادة 8",
            d: "الحق في الحصول على نسخة من البيانات الشخصية بصيغة ورقية أو إلكترونية.",
          },
          correct: {
            t: "تصحيح البيانات",
            article: "المادة 6",
            d: "الحق في تصحيح البيانات الشخصية وتحديثها لتصبح دقيقة وكاملة.",
          },
          erase: {
            t: "حذف البيانات",
            article: "المادة 9",
            d: "الحق في حذف البيانات الشخصية أو إتلافها في حالات معينة.",
          },
          withdraw: {
            t: "سحب الموافقة",
            article: "المادة 5",
            d: "الحق في سحب الموافقة على معالجة البيانات الشخصية.",
          },
          objection: {
            t: "الاعتراض على المعالجة",
            article: "المادة 12",
            d: "الحق في الاعتراض على معالجة البيانات في حالات معينة.",
          },
          compensation: {
            t: "التعويض عن الانتهاك",
            article: "المادة 13",
            d: "الحق في الحصول على تعويض عن أي انتهاك لمعالجة البيانات الشخصية.",
          },
        },
      },
      dsar: {
        title: "تقديم الطلب (DSAR)",
        desc: "طلب الوصول إلى بيانات صاحبها — طلب رسمي لصون حقوق صاحب البيانات. املأ النموذج التالي؛ وستُتحقق من هويتك قبل معالجة الطلب.",
        labelName: "الاسم الكامل",
        phName: "الاسم وفق هويتك الرسمية",
        labelEmail: "البريد الإلكتروني",
        phEmail: "name@email.com",
        labelType: "نوع الطلب",
        phType: "اختر نوع الطلب",
        opt: {
          akses: "الوصول إلى البيانات",
          salinan: "نسخة من البيانات",
          koreksi: "تصحيح البيانات",
          hapus: "حذف البيانات",
          tarik: "سحب الموافقة",
          keberatan: "الاعتراض على المعالجة",
        },
        labelDesc: "تفصيل الطلب",
        phDesc: "اشرح طلبك (10 أحرف على الأقل)…",
        labelPhone: "رقم واتساب",
        phPhone: "08xxxxxxxxxx",
        optional: "اختياري",
        btnSubmit: "إرسال الطلب",
        btnSubmitting: "جارٍ الإرسال…",
        errName: "الاسم مطلوب.",
        errEmail: "صيغة البريد الإلكتروني غير صحيحة.",
        errType: "اختر نوع الطلب.",
        errDesc: "تفصيل الطلب 10 أحرف على الأقل.",
        toastOkTitle: "تم إرسال الطلب",
        toastOkDesc: "سيعالج فريق حماية البيانات طلبك قريبًا.",
        toastFailTitle: "فشل إرسال الطلب",
        help: {
          verify: "ستُتحقق من هويتك أولًا قبل معالجة الطلب.",
          sla: "يُقدَّم الرد خلال 3 أيام عمل كحد أقصى من تاريخ استلام الطلب.",
          minimal: "لن نطلب عبر هذا النموذج أي بيانات لا صلة لها بالطلب.",
        },
      },
      security: {
        title: "الحماية التقنية والتنظيمية",
        desc: "إجراءات ملموسة نطبقها لحماية البيانات الشخصية الخاضعة للمعالجة.",
        items: {
          tls: {
            t: "نقل مشفَّر",
            d: "تُقدَّم جميع اتصالات البيانات عبر قنوات مشفَّرة.",
          },
          hash: {
            t: "كلمات مرور مُهمَّشة",
            d: "تُخزَّن كلمات مرور المشرفين بصيغة scrypt hash ولا تُحفظ نصًا صريحًا أبدًا.",
          },
          audit: {
            t: "سجل تدقيق كامل",
            d: "تُسجَّل جميع إجراءات نظام إدارة المحتوى في سجل تدقيق قابل للمراجعة.",
          },
          minimize: {
            t: "تقليل النشر",
            d: "لا تُعرض بيانات تواصل الأعضاء علنًا في صفحات الدليل.",
          },
          retention: {
            t: "احتفاظ وحذف مجدولان",
            d: "تُحفظ البيانات فقط طالما دعت الحاجة ثم تُحذف وفق جدول زمني.",
          },
          rbac: {
            t: "وصول مقيد بالأدوار",
            d: "يُقيَّد الوصول إلى البيانات بحسب الأدوار ويُراقب دوريًا.",
          },
        },
      },
      dpo: {
        title: "مسؤول حماية البيانات وقناة الشكاوى",
        desc: "مسؤول حماية البيانات (DPO) في مهدين جاهز لمساعدتك في صون حقوقك واستقبال شكاواك حول معالجة البيانات الشخصية.",
        contactLabel: "مسؤول حماية البيانات (DPO)",
        note: "إذا لم تكن راضيًا عن ردنا فيحق لصاحب البيانات التقدم بشكوى إلى الجهة الرقابية لحماية البيانات الشخصية.",
      },
      cta: {
        terms: "اقرأ الشروط والأحكام",
      },
    },
  },
} as const;
