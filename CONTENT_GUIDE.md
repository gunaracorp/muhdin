# CONTENT GUIDE — Panduan Konten CMS MUHDIN NUSANTARA

Panduan ini untuk **admin dan editor CMS** (`#/admin`) yang mengelola artikel,
tutorial, FAQ, testimoni, pengaturan situs, dan konten lainnya. Tujuannya satu:
menjaga suara MUHDIN tetap konsisten, profesional, dan **jujur secara hukum**.

## 1. Tone Bahasa

Gaya resmi MUHDIN: **profesional-hangat**.

Contoh kalimat acuan (dipakai apa adanya di situs — `src/lib/nusantara.ts`,
`HERO_SUBTITLE`):

> "Menghubungkan penyelenggara, pelaku usaha, profesional, teknologi, dan
> penyedia layanan haji–umrah dalam satu ekosistem yang lebih terpercaya,
> transparan, dan terintegrasi."

Ciri-cirinya:

- **Profesional**: kalimat utuh, istilah teknis tepat (PPIU, PIHK, KBIHU,
  Nusuk), data disebut dengan sumbernya.
- **Hangat**: menyejukkan, ramah, fokus melayani jamaah — bukan menjual
  agresif.
- Hindari **bahasa birokratis kaku** (mis. "sehubungan dengan hal tersebut
  maka berdasarkan hal itu"), singkatan tak baku, dan tanda seru berlebihan.
- Hindari **klaim berlebihan** — lihat daftar larangan di bagian 2.
- Konten ditulis dulu dalam Bahasa Indonesia baku, lalu diterjemahkan ke EN/AR
  melalui modul **Penerjemah** di CMS (disimpan di tabel `ContentTranslation`).

## 2. Daftar Larangan Klaim

Aturan emas legal-compliance MUHDIN tertulis di header
`src/lib/nusantara.ts` (kutip persis):

> - Tidak ada klaim dukungan/endorsement pemerintah.
> - MUHDIN bukan PPIU/PIHK, bukan penerbit visa, bukan penjamin keberangkatan.
> - "MUHDIN Verified" = status verifikasi internal berbasis dokumen pada tanggal
>   verifikasi — BUKAN izin/accreditasi pemerintah.
> - Biaya keanggotaan = iuran organisasi MUHDIN, bukan biaya/izin pemerintah.

### Tabel larangan → pengganti aman

| ❌ JANGAN menulis | ✅ Gunakan |
|---|---|
| "Resmi pemerintah", "didukung/disahkan Kemenag", "asosiasi resmi negara" | "Asosiasi haji & umrah digital" (tanpa kata "resmi pemerintah"); rujuk status badan sesuai dokumen legal yang benar-benar ada |
| "Menjamin visa", "menjamin keberangkatan", "100% pasti berangkat" | "Mendampingi proses", "terhubung dengan jalur resmi Nusuk", "memfasilitasi koordinasi dengan penyelenggara" |
| "MUHDIN menerbitkan visa", "visa dari MUHDIN" | "Penerbitan visa dilakukan oleh mekanisme resmi Arab Saudi melalui PPIU/PIHK; MUHDIN terhubung dengan jalur resmi Nusuk" |
| "Nusuk Indonesia" sebagai sebutan diri MUHDIN | "MUHDIN" untuk diri sendiri; "Nusuk" hanya untuk menyebut **platform resmi Kementerian Haji Arab Saudi** — frasa aman: "terhubung dengan jalur resmi Nusuk" |
| "MUHDIN Verified = izin/accreditasi pemerintah" | "Status verifikasi internal MUHDIN berbasis dokumen pada tanggal verifikasi" |
| "Biaya keanggotaan = biaya izin/pendaftaran pemerintah" | "Iuran organisasi MUHDIN" |
| "Terbaik/terbesar/pertama di dunia" tanpa konteks di konten biasa | Simpan klaim identitas hanya untuk bagian branding resmi yang sudah disetujui (badge hero, halaman Tentang); konten biasa cukup deskriptif |

Prinsip mudah: **tulis apa yang sistem benar-benar lakukan** (menghubungkan,
memverifikasi dokumen, menyediakan direktori dan informasi) — bukan apa yang
hanya bisa dilakukan penyelenggara berizin atau otoritas.

## 3. Disclaimer Wajib "MUHDIN Verified"

Setiap materi yang menampilkan anggota berlabel "Terverifikasi" / "MUHDIN
Verified" wajib memuat makna berikut (sumber kebenaran: header
`src/lib/nusantara.ts`, blok ATURAN EMAS — kutip persis):

> "MUHDIN Verified" = status verifikasi internal berbasis dokumen pada tanggal
> verifikasi — BUKAN izin/accreditasi pemerintah.

Pemakaian minimal:

- Halaman direktori anggota & detail verifikasi: makna verifikasi internal
  tersampaikan di penjelasan status (label berasal dari `VERIFY_STATUSES`
  di `src/lib/nusantara.ts`, mis. "Terverifikasi", "Terverifikasi Terbatas").
- Saat mengutip/memublikasikan ulang di artikel, siaran pers, atau materi
  cetak: sisipkan kalimat disclaimer di atas apa adanya.
- Jangan pernah menyederhanakan menjadi "disetujui pemerintah" atau
  "berizin pemerintah".

> Catatan teknis: konstanta bernama `VERIFIED_DISCLAIMER_ID` **tidak ada** di
> versi kode saat ini; teks resminya hidup sebagai blok ATURAN EMAS di header
> `src/lib/nusantara.ts`. Bila konstanta itu kelak ditambahkan, dokumentasi ini
> yang perlu diperbarui agar mengutipnya.

## 4. Mengelola Pengaturan Situs (Settings)

Modul CMS **Pengaturan Situs** menulis ke tabel `SiteSetting` (pasangan
key–value). Kunci yang terpakai saat ini (diukur langsung dari database):

| Kunci | Isi | Catatan |
|---|---|---|
| `siteName`, `tagline` | Identitas dasar | Tampil di header/footer |
| `heroTitle`, `heroSubtitle` | Teks hero beranda | Ganti hanya dengan persetujuan branding |
| `vision`, `mission` | Visi & misi | Bahasa Indonesia baku |
| `email`, `phone`, `address`, `website` | Kontak institusi | Gunakan **kontak kantor**, bukan pribadi (lihat `SECURITY.md` §10) |
| `whatsapp` | Nomor WA institusi | Format internasional `62…` |
| `instagram`, `facebook`, `twitter`, `youtube` | URL profil sosmed | **Sumber kebenaran tunggal ikon footer** — ubah URL sekali di sini, seluruh situs ikut (Task 32) |
| `nusuk_tagline`, `nusuk_desc`, `nusuk_api_note` | Blok informasi Nusuk Hub | Patuhi frasa aman "terhubung dengan jalur resmi Nusuk" |

Aturan penting:

- **Konfigurasi WhatsApp (gateway notifikasi) terpisah** di modul WhatsApp —
  menulis ke tabel `WhatsAppSetting`, tidak tampil publik, dan tokennya selalu
  dimasking oleh API. Uji dengan tombol **Kirim Pesan Uji**
  (`POST /api/whatsapp/test`); biarkan `enabled=false` bila belum dipakai.
- `GET /api/settings` bersifat publik: **jangan** menaruh rahasia apa pun ke
  `SiteSetting`.
- Setelah mengubah settings, muat ulang halaman publik untuk memastikan
  footer/kontak ikut berubah.

## 5. Checklist Publikasi Artikel (Berita)

Sebelum mengubah status menjadi `PUBLISHED` (atau menandai `featured`):

- [ ] **Judul** informatif, tanpa clickbait, tanpa klaim terlarang (bagian 2).
- [ ] **Slug** otomatis dari judul — biarkan kecuali perlu dipendekkan
      (hanya `a-z0-9` dan tanda hubung).
- [ ] **Excerpt** 1–2 kalimat ringkasan, bukan salinan paragraf pertama utuh.
- [ ] **Konten** (Markdown): paragraf pendek, subjudul jelas, tanpa bahasa
      birokratis; angka & tanggal akurat; tidak menjanjikan visa/keberangkatan.
- [ ] **Kategori** sesuai (default `Berita`), konsisten dengan kategori lain.
- [ ] **Cover**: gambar milik sendiri/berizin, rasio konsisten dengan artikel
      lain, tanpa data pribadi yang tampak di foto (NIK, dokumen — lihat
      `SECURITY.md` §10).
- [ ] **Author** diisi (default "Tim MUHDIN") — jangan pakai nama orang tanpa
      izin.
- [ ] **Status** = `PUBLISHED` saat siap; draf bertahap cukup dibiarkan belum
      dipublikasikan. Tandai `featured` maksimal untuk 1–2 artikel utama.
- [ ] **Terjemahan EN/AR** melalui modul Penerjemah diperbarui setelah konten
      final (bukan sebelumnya).
- [ ] **Pratinjau publik** di `#/berita` (list) dan detail per slug — pastikan
      tampil rapi di desktop dan ponsel.

## 6. Checklist Publikasi Tutorial

Model `Tutorial` punya field khusus — isi semuanya:

- [ ] **Kategori** salah satu dari: `CMS`, `Jamaah`, `Mitra`, `Umum` —
      pilih yang paling spesifik untuk audiens.
- [ ] **Level**: `Pemula` / `Menengah` / `Mahir` (sesuai label yang dipakai
      tampilan tutorial).
- [ ] **Durasi** (menit) realistis untuk waktu baca/praktik.
- [ ] **Summary** 1–2 kalimat yang menjelaskan hasil akhir tutorial.
- [ ] **Konten** Markdown 300–600 kata (standar konten seed): langkah
      bernomor, tangkapan layar bila perlu, tanpa kredensial nyata di contoh.
- [ ] **Urutan** (`order`) dipikirkan agar tutorial sejenis tersusun logis.
- [ ] **Published** dicentang hanya saat siap; cek tampilan di `#/tutorial`.
- [ ] Contoh alur/layanan yang disebut tidak menjanjikan hal di luar
      kapabilitas platform (bagian 2).

## 7. Checklist Konten Lainnya (Singkat)

- **FAQ**: jawaban faktual, satu pertanyaan = satu topik, kategori konsisten;
  hindari jawaban yang berbunyi seperti janji.
- **Testimoni**: publikasikan hanya yang `published` dan disetujui pemiliknya;
  jangan mengarang nama/rating.
- **Galeri/Agenda/Sumber Daya**: tanpa dokumen pribadi; file unduhan ditaruh
  via URL file yang sah; agenda memakai waktu dengan zona yang benar.
- **Direktori anggota**: label "Terverifikasi" hanya untuk status verifikasi
  internal MUHDIN — sisipkan disclaimer bagian 3 saat mengutip di materi lain.

## 8. Whitepaper sebagai Sumber Konsep Resmi

**Whitepaper MUHDIN — Edisi 1.0 (17 September 2026)**, "Arsitektur 13 Ekosistem
Layanan Umroh-Haji Terintegrasi", adalah **sumber kebenaran tertinggi** untuk
narasi organisasi. Salinan resminya tersedia publik di `#/unduhan`
(`/dokumen/whitepaper-muhdin-2026.pdf`).

Ketika menulis/menyunting konten, pastikan angka dan istilah konsisten dengan
whitepaper:

| Topik | Acuan Whitepaper |
|---|---|
| 13 ekosistem layanan + klaster | Bab 5, Tabel 3 |
| Alur 13 tahap jamaah (zero-gap handover) | Bab 6, Tabel 4 |
| Lima mitra utama (PPIU, PIHK, KBIHU, IPHI, Travel Wisata) | Bab 4.2, Tabel 2 |
| Lima nilai utama + makna operasional | Bab 3.3, Tabel 1 |
| Enam pilar teknologi | Bab 7.1 |
| Model bisnis 6 sumber pendapatan + akad (Wakalah, Ijarah, Ju'alah, Muwakalah, Musyarakah) | Bab 8, Tabel 5 |
| Peta jalan 4 fase 2026-2030 | Bab 9, Tabel 6 |
| KPI (baseline 2026 → target 2030) | Bab 10, Tabel 7 |
| Manfaat 7 kelompok stakeholder | Bab 11, Tabel 8 |
| Referensi regulasi (UU 8/2019, UU 27/2022) & platform Nusuk | Referensi |

**Catatan kepatuhan (perkuat bagian 2)**:

- Whitepaper memakai frasa identitas "Asosiasi di Atas Asosiasi" pada sampul;
  untuk konten web, gunakan bahasa fungsinya: *"diposisikan sebagai titik
  koordinasi tunggal akses platform Nusuk bagi industri"* — **jangan** menulis
  klaim peristiwa seperti "resmi dilantik", "ditunjuk", atau "ditetapkan oleh
  Nusuk/pemerintah".
- MoU/integrasi dengan Nusuk adalah **deliverable Fase Fondasi (2026)** —
  sajikan sebagai program/peta jalan, bukan status yang sudah berjalan.
- Whitepaper berstatus "Draft untuk Konsultasi Pemangku Kepentingan" — kutip
  sebagai kertas kerja strategis MUHDIN, bukan dokumen hukum pemerintah.
