/**
 * namespace "widget" — Task 5-d (Widget Badge Verifikasi, route #/widget).
 * Struktur wajib: { id: {...}, en: {...}, ar: {...} } — key identik di ketiganya.
 */
export const widgetDict = {
  id: {
    widget: {
      hero: {
        eyebrow: "UNTUK PENYELENGGARA ANGGOTA",
        title: "Widget Badge Verifikasi",
        subtitle:
          "Pasang satu baris kode di website travel Anda — jamaah langsung melihat status keanggotaan real-time dari database resmi MUHDIN.",
      },
      why: {
        title: "Mengapa Widget Ini Penting",
        items: {
          realtime: {
            title: "Status Real-Time",
            desc: "Badge menampilkan status keanggotaan terkini langsung dari database resmi — bukan teks statis yang bisa kedaluwarsa.",
          },
          anti: {
            title: "Anti Palsu",
            desc: "Setiap badge mengarah ke halaman verifikasi resmi MUHDIN — sulit dipalsukan, mudah diperiksa jamaah.",
          },
          conversion: {
            title: "Membangun Konversi",
            desc: "Jamaah jauh lebih percaya penyelenggara yang transparan statusnya — kepercayaan menaikkan konversi.",
          },
        },
      },
      live: {
        title: "Coba Live",
        desc: "Masukkan nomor izin dan lihat badge bereaksi seperti nanti di website Anda.",
        label: "Nomor Izin / Nama Penyelenggara",
        try: "Coba",
        tip: "Coba juga nomor yang tidak dikenal (mis. FAKE-999) untuk melihat status “TIDAK TERDAFTAR”.",
        iframeTitle: "Pratinjau widget badge verifikasi MUHDIN",
      },
      embed: {
        title: "Kode Embed",
        desc: "Salin satu baris berikut dan tempel di halaman website penyelenggara.",
        copy: "Salin Kode",
        toastOkTitle: "Kode tersalin",
        toastOkDesc: "Tempel sebelum tag </body> di halaman website Anda.",
        toastFailTitle: "Gagal menyalin",
        toastFailDesc: "Salin manual dari kotak kode di atas.",
        attrTitle: "Atribut opsional",
        colAttr: "Atribut",
        colVal: "Nilai",
        colDesc: "Fungsi",
        attr: {
          q: { val: "nama", desc: "Cari berdasarkan nama penyelenggara — alternatif data-license" },
          lang: { val: "id | en | ar", desc: "Bahasa badge: Indonesia, Inggris, atau Arab" },
          endpoint: { val: "URL", desc: "Override URL API (khusus pengembangan)" },
          size: { val: "sm | md", desc: "Ukuran badge" },
        },
      },
      steps: {
        title: "Cara Pasang",
        s1: {
          title: "Salin kode embed",
          desc: "Klik tombol Salin Kode — kode berisi nomor izin penyelenggara Anda.",
        },
        s2: {
          title: "Tempel sebelum </body>",
          desc: "Letakkan satu baris script di landing page travel Anda, sebelum tag penutup body.",
        },
        s3: {
          title: "Badge tampil otomatis",
          desc: "Status selalu live dari database resmi — klik badge membuka halaman verifikasi resmi MUHDIN.",
        },
      },
      rules: {
        title: "Catatan Privasi & Aturan Pemakaian",
        items: {
          data: "Endpoint widget hanya mengekspos nama, tipe, kota, provinsi, nomor izin, status, dan tahun gabung (minimasi data — tanpa kontak pribadi).",
          owner: "Widget hanya boleh dipasang pada website milik penyelenggara yang bersangkutan — bukan situs pihak lain.",
          tamper: "Memalsukan atau memanipulasi badge merupakan pelanggaran kode etik MUHDIN.",
        },
        etikLink: "Lihat kode etik",
      },
      cta: {
        gabung: "Daftar Jadi Anggota",
        verifikasi: "Cek Verifikasi",
      },
    },
  },
  en: {
    widget: {
      hero: {
        eyebrow: "FOR MEMBER ORGANIZERS",
        title: "Verification Badge Widget",
        subtitle:
          "Embed one line of code on your travel website — pilgrims instantly see real-time membership status from the official MUHDIN database.",
      },
      why: {
        title: "Why This Widget Matters",
        items: {
          realtime: {
            title: "Real-Time Status",
            desc: "The badge reflects current membership status straight from the official database — not static text that goes stale.",
          },
          anti: {
            title: "Anti-Forgery",
            desc: "Every badge links to the official MUHDIN verification page — hard to fake, easy for pilgrims to check.",
          },
          conversion: {
            title: "Builds Conversion",
            desc: "Pilgrims trust transparent organizers far more — trust raises conversion.",
          },
        },
      },
      live: {
        title: "Try It Live",
        desc: "Enter a license number and watch the badge react exactly like it will on your website.",
        label: "License Number / Organizer Name",
        try: "Try",
        tip: "Try an unknown number too (e.g. FAKE-999) to see the “NOT REGISTERED” state.",
        iframeTitle: "MUHDIN verification badge widget preview",
      },
      embed: {
        title: "Embed Code",
        desc: "Copy the single line below and paste it into the organizer's website page.",
        copy: "Copy Code",
        toastOkTitle: "Code copied",
        toastOkDesc: "Paste it before the </body> tag of your website page.",
        toastFailTitle: "Copy failed",
        toastFailDesc: "Please copy it manually from the code box above.",
        attrTitle: "Optional attributes",
        colAttr: "Attribute",
        colVal: "Value",
        colDesc: "Purpose",
        attr: {
          q: { val: "name", desc: "Search by organizer name — alternative to data-license" },
          lang: { val: "id | en | ar", desc: "Badge language: Indonesian, English, or Arabic" },
          endpoint: { val: "URL", desc: "Override the API URL (development only)" },
          size: { val: "sm | md", desc: "Badge size" },
        },
      },
      steps: {
        title: "How to Install",
        s1: {
          title: "Copy the embed code",
          desc: "Click Copy Code — the snippet carries your organizer license number.",
        },
        s2: {
          title: "Paste before </body>",
          desc: "Place the one-line script on your travel landing page, before the closing body tag.",
        },
        s3: {
          title: "Badge appears automatically",
          desc: "Status stays live from the official database — clicking the badge opens the official MUHDIN verification page.",
        },
      },
      rules: {
        title: "Privacy Notes & Usage Rules",
        items: {
          data: "The widget endpoint only exposes name, type, city, province, license number, status, and joining year (data minimization — no contact details).",
          owner: "The widget may only be installed on websites owned by the organizer concerned — not third-party sites.",
          tamper: "Forging or manipulating the badge is a violation of the MUHDIN code of ethics.",
        },
        etikLink: "See the code of ethics",
      },
      cta: {
        gabung: "Become a Member",
        verifikasi: "Check Verification",
      },
    },
  },
  ar: {
    widget: {
      hero: {
        eyebrow: "للمنظّمين الأعضاء",
        title: "ودجت شارة التحقق",
        subtitle:
          "ركّب سطر كود واحد في موقع وكالتك — ليرى الحجاج حالة العضوية لحظة بلحظة من قاعدة بيانات مهدين الرسمية.",
      },
      why: {
        title: "لماذا هذه الودجت مهمة",
        items: {
          realtime: {
            title: "حالة لحظية",
            desc: "تعرض الشارة حالة العضوية الحالية مباشرة من قاعدة البيانات الرسمية — لا نصًا ثابتًا يتقادم.",
          },
          anti: {
            title: "مضادة للتزوير",
            desc: "كل شارة تقود إلى صفحة التحقق الرسمية لمهدين — يصعب تزويرها ويسهل على الحجاج التحقق منها.",
          },
          conversion: {
            title: "تعزز الثقة والتحويل",
            desc: "الحجاج يثقون أكثر بمنظّم شفاف الحالة — والثقة ترفع نسبة التحويل.",
          },
        },
      },
      live: {
        title: "جرّبها مباشرة",
        desc: "أدخل رقم الترخيص وشاهد الشارة تتفاعل كما ستظهر في موقعك.",
        label: "رقم الترخيص / اسم المنظّم",
        try: "جرّب",
        tip: "جرّب أيضًا رقمًا غير معروف (مثل FAKE-999) لترى حالة “غير مسجَّل”.",
        iframeTitle: "معاينة ودجت شارة التحقق مهدين",
      },
      embed: {
        title: "كود التركيب",
        desc: "انسخ السطر التالي والصقه في صفحة موقع المنظّم.",
        copy: "انسخ الكود",
        toastOkTitle: "تم نسخ الكود",
        toastOkDesc: "الصقه قبل وسم </body> في صفحة موقعك.",
        toastFailTitle: "فشل النسخ",
        toastFailDesc: "انسخه يدويًا من صندوق الكود أعلاه.",
        attrTitle: "سمات اختيارية",
        colAttr: "السمة",
        colVal: "القيمة",
        colDesc: "الوظيفة",
        attr: {
          q: { val: "اسم", desc: "البحث باسم المنظّم — بديل عن data-license" },
          lang: { val: "id | en | ar", desc: "لغة الشارة: الإندونيسية أو الإنجليزية أو العربية" },
          endpoint: { val: "رابط", desc: "تجاوز عنوان الـAPI (للتطوير فقط)" },
          size: { val: "sm | md", desc: "حجم الشارة" },
        },
      },
      steps: {
        title: "طريقة التركيب",
        s1: {
          title: "انسخ كود التركيب",
          desc: "انقر زر انسخ الكود — الكود يحمل رقم ترخيص منظّمتك.",
        },
        s2: {
          title: "الصقه قبل وسم </body>",
          desc: "ضع سطر السكربت في صفحة الهبوط لموقعك قبل وسم إغلاق body.",
        },
        s3: {
          title: "تظهر الشارة تلقائيًا",
          desc: "تبقى الحالة حية من قاعدة البيانات الرسمية — والنقر على الشارة يفتح صفحة التحقق الرسمية.",
        },
      },
      rules: {
        title: "ملاحظات الخصوصية وقواعد الاستخدام",
        items: {
          data: "لا تكشف نقطة نهاية الودجت سوى الاسم والنوع والمدينة والمحافظة ورقم الترخيص والحالة وسنة الانضمام (تقليل البيانات — بلا بيانات تواصل).",
          owner: "لا يجوز تركيب الودجت إلا في موقع المنظّم نفسه — لا في مواقع أطراف أخرى.",
          tamper: "تزوير الشارة أو التلاعب بها يُعد مخالفة لمدونة أخلاقيات مهدين.",
        },
        etikLink: "اطّلع على مدونة الأخلاقيات",
      },
      cta: {
        gabung: "سجّل كعضو",
        verifikasi: "تحقّق الآن",
      },
    },
  },
} as const;
