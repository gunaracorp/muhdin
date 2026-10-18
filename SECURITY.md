# SECURITY — Model Keamanan MUHDIN NUSANTARA

Dokumen ini merangkum **implementasi keamanan yang benar-benar ada di codebase**
(versi Node.js dan edisi PHP shared hosting), disertai checklist hardening dan
aturan privasi data. Semua rujukan file dapat diverifikasi langsung di repo.

## 1. Autentikasi: Password Hashing

- **Node.js** (`src/lib/auth.ts`): password dihash dengan **scrypt**
  (`node:crypto` → `scryptSync`, kunci 64 byte, salt acak 16 byte) dan disimpan
  berformat `salt:hash` heksadesimal. Verifikasi memakai
  `timingSafeEqual` — tahan *timing attack*. Tidak ada plaintext password di DB.
- **Edisi PHP** (`shared-hosting/api/lib.php`): password dihash **bcrypt**
  (`password_hash`). Pipeline `hosting:build` otomatis me-rehash akun demo
  scrypt → bcrypt sehingga kredensial yang sama bekerja di kedua mesin.
  Akun yang dibuat lewat Node (scrypt) tidak bisa diverifikasi PHP — reset
  passwordnya via CMS agar ter-hash ulang dengan bcrypt.
- Akun dengan `isActive = false` ditolak saat login (`403`) dan sesinya
  dibersihkan seketika (`getSessionUser` di `src/lib/auth.ts`).

## 2. Sesi: Cookie httpOnly Berbasis DB

Implementasi di `src/lib/auth.ts` (`createSession`/`getSessionUser`/
`destroySession`), paritas 1:1 di `shared-hosting/api/lib.php`:

| Aspek | Nilai |
|---|---|
| Nama cookie | `muhdin_session` |
| Token | 64-hex acak (`randomBytes(32)`), disimpan di tabel `Session` |
| Masa berlaku | **7 hari** (`SESSION_DAYS`), dicek terhadap `expiresAt` di DB |
| Flag cookie | `httpOnly: true`, `sameSite: "lax"`, `secure: true` saat `NODE_ENV=production`, `path: "/"` |
| Pembersihan | Sesi kedaluwarsa dihapus saat dibaca; akun nonaktif → semua sesinya dihapus |

## 3. RBAC: 4 Peran, 22 Modul CMS

Peran didefinisikan di `src/lib/roles.ts` (dipakai bersama server dan UI CMS):

| Peran | Cakupan |
|---|---|
| `SUPER_ADMIN` | Semua modul **+ kelola akun admin** (tambah/ubah/nonaktif/hapus) **+ audit log** |
| `ADMIN` | Seluruh modul operasional, kecuali kelola admin & audit log |
| `VERIFIKATOR` | Dashboard, pendaftaran anggota, direktori (setujui/tolak tanpa hapus), pengaduan |
| `EDITOR` | Konten: berita, ekosistem, tutorial, FAQ, testimoni, galeri, agenda, sumber daya, dsb. |

Pemetaan lengkap 22 modul ada di konstanta `SECTION_ROLES` (`src/lib/roles.ts`).
Guard di sisi API (`src/lib/api-helpers.ts`):

- `guardAdmin()` — sesi valid apa pun perannya → else `401`.
- `guardRole(allowed[])` — sesi valid **dan** peran terdaftar → else `401`/`403`.
- `guardSuperAdmin()` — hanya `SUPER_ADMIN` (kelola user) → else `403`
  "Hanya Super Admin yang dapat mengelola akun admin."

Edisi PHP menyediakan padanan `guard_admin()` / `guard_role()` / rate limit yang
sama (`shared-hosting/api/lib.php`, `routes-*.php`).

## 4. Rate Limit

- **Node** (`src/lib/ratelimit.ts`): limiter in-memory per `bucket:ip`,
  default **5 permintaan / 60 detik**, dipakai pada form publik:
  pendaftaran anggota (`applications`), pengaduan (`complaints`), pesan kontak
  (`messages`), dan langganan (`subscribers`) — melebihi limit → `429`.
- **Edisi PHP**: selain form publik, **login juga dibatasi 5 percobaan/menit
  per IP+email** (`routes-auth.php` → `rate_limit('login:'.email)` → `429`
  "Terlalu banyak percobaan. Coba lagi beberapa saat.").
- Catatan jujur: limiter Node menyimpan state di memori proses — efektif untuk
  satu instance; untuk multi-instance skala besar perlu store terpusat (belum ada).

## 5. Audit Log

- `src/lib/audit.ts` → `logAudit()` menulis tabel `AuditLog` secara
  *fire-and-forget* setelah operasi utama sukses (kegagalan log tidak
  menggagalkan request). Identitas diambil dari sesi; aksi tanpa sesi dicatat
  sebagai "sistem".
- Tercatat: `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`, `APPROVE`/`REJECT`,
  `CREATE`/`UPDATE`/`DELETE`, `SYNC`, `EXPORT`, `VERIFY`, dan lainnya.
- **Hanya `SUPER_ADMIN`** yang bisa melihat modul Audit (`SECTION_ROLES`).
- Edisi PHP juga men-audit login/logout/ganti password dan CRUD konten.

## 6. Validasi Input & Anti-SQL Injection

- **Prisma memakai parameterized query** secara default — aplikasi tidak
  merangkai string SQL dari input pengguna. Satu-satunya raw query adalah
  health check `db.$queryRaw\`SELECT 1\`` (tanpa input pengguna).
- **Edisi PHP**: semua akses DB lewat **PDO prepared statement**
  (`db_query`/`db_all` di `lib.php`) dengan parameter terikat; LIKE di-escape
  (`%`, `_`, `\` + `ESCAPE '\'`).
- Validasi manual ketat di tiap route API (contoh nyata): email/password wajib
  diisi di login, `reviewNote` minimal 5 karakter saat menolak pendaftaran,
  `startsAt`/`endsAt` tidak-valid → `400`, normalisasi nomor WA `08…` → `62…`,
  `parseIntOr` untuk parameter numerik. Dependensi **Zod v4** tersedia untuk
  skema validasi (dipakai pipeline error di beberapa endpoint).
- `slugify()` (`src/lib/api-helpers.ts`) membersihkan slug menjadi
  `[a-z0-9-]` sebelum disimpan, dengan sufiks unik otomatis bila duplikat.

## 7. Kerahasiaan Token WhatsApp

- Token gateway WhatsApp disimpan di tabel **`WhatsAppSetting`** — bukan
  `SiteSetting` — secara sengaja, karena `GET /api/settings` bersifat publik.
- `GET /api/whatsapp` **hanya mengembalikan token termasking**
  (`tokenMasked`; ≤10 karakter → 2 huruf awal + `••••••`, selain itu 6 awal +
  `••••••••` + 4 akhir) — token asli tidak pernah keluar dari API, di Node
  (`src/app/api/whatsapp/route.ts`) maupun PHP (`routes-auth.php`).
- `PUT /api/whatsapp`: token hanya diperbarui bila dikirim non-kosong —
  admin tidak perlu mengetik ulang token saat mengedit konfigurasi lain.

## 8. Konfigurasi Server

- `next.config.ts`: `poweredByHeader: false` (tanpa header `X-Powered-By`),
  `compress: true`.
- `.gitignore` mencakup `.env*` — file env tidak ikut ter-commit. File
  `.env` repo berisi `DATABASE_URL=file:…/db/custom.db` (path lokal) dan tidak
  memuat kredensial pihak ketiga; tetap jangan pernah mem-commit-nya.
- `shared-hosting/.htaccess` menangani routing API + SPA fallback dan
  **proteksi folder `data/`** agar database tidak bisa diunduh langsung.

## 9. Checklist Hardening Shared Hosting

Lakukan setelah memasang paket PHP (atau Node) di shared hosting:

- [ ] **TLS aktif** — pastikan AutoSSL/Let's Encrypt terpasang dan semua akses
      via `https://`; tambahkan redirect HTTPS di `.htaccess`. Cookie sesi
      ditandai `Secure` saat produksi, jadi login wajib lewat HTTPS.
- [ ] **Ganti semua kredensial default** segera setelah login pertama:
      `admin@muhdin.web.id / muhdin2026`, `editor@muhdin.web.id / editor2026`,
      `verifikator@muhdin.web.id / verifikator2026` (CMS → Profil → Ganti
      Password). Jangan hapus/nonaktifkan akun Super Admin satu-satunya.
- [ ] **Jangan commit `.env`** dan jangan letakkan kredensial di file yang
      dapat diakses web; token gateway WA cukup diisi lewat CMS.
- [ ] **Pastikan `.htaccess` terunggah** (File Manager → *Show Hidden Files*)
      — tanpa dia, folder `data/` dan routing API tidak terlindungi.
- [ ] **Permission file** — file 644, folder 755; `data/muhdin.sqlite` cukup
      writable oleh pemilik, jangan 666/777.
- [ ] **Hapus file cek versi** seperti `info.php` (`phpinfo()`) setelah
      dipakai memverifikasi `pdo_sqlite` (anjuran `shared-hosting/INSTALL.txt`).
- [ ] **Perbarui versi PHP** ke 8.1+ bila penyedia hosting mengizinkan
      (minimum 7.4).
- [ ] **Backup rutin** `data/muhdin.sqlite` (lihat `DATABASE.md`) dan simpan
      di luar akun hosting.
- [ ] **Pantau audit log** dari CMS (Super Admin) — aksi mencurigakan
      tercatat di sana.
- [ ] Aktifkan rate limit bawaan dengan tidak mematikan `.htaccess` dan
      bijaslah memberi akses akun admin (prinsip least privilege: kasih
      `EDITOR`/`VERIFIKATOR`, bukan `SUPER_ADMIN`, untuk kebutuhan terbatas).

## 10. Privasi: Data yang TIDAK Boleh Dipublikasikan

Portal ini mempublikasikan **profil institusi anggota**, bukan data pribadi
perorangan. Data berikut **tidak boleh** muncul di halaman publik, materi
promosi, maupun konten CMS:

| Data | Aturan |
|---|---|
| **NIK / nomor identitas kependudukan** | Tidak pernah diminta maupun ditampilkan; jangan dimasukkan ke deskripsi anggota, artikel, atau galeri |
| **Dokumen pribadi** (KTP, paspor, kartu keluarga, foto wajah pelapor) | Jangan diunggah sebagai gambar Resource/Gallery; bukan bagian dari direktori anggota |
| **Telepon/email pribadi** jamaah maupun pelapor | Form kontak/pengaduan mengumpulkannya untuk pemrosesan internal saja; hanya tampil di CMS (peran berwenang), tidak pernah di portal publik |
| Identitas pelapor pengaduan (`Complaint`) | Rahasia internal — hanya admin berperan berwenang yang melihat; jangan dikutip di publikasi |
| Data pendaftaran anggota (`MembershipApplication`) | Termasuk `contactName`, `email`, `phone`, `licenseNo` — hanya terlihat oleh ADMIN/VERIFIKATOR/SUPER_ADMIN; publik hanya melihat status via kode tiket `MHD-XXXXXX` |
| Token gateway WhatsApp, `apiKey`/`webhookSecret` Nusuk | Tidak pernah keluar lewat API (masking — bagian 7) |

Praktis untuk pengelola konten:

- Untuk kartu anggota (`Member`), isi `phone`/`email`/`website` dengan
  **kontak bisnis institusi** (kantor, domain resmi), bukan nomor/email pribadi
  pemilik.
- Export CSV (`/api/export`) berisi data formulir — aksinya tercatat di audit
  log (`EXPORT`); simpan hasil export dengan aman dan jangan diunggah ke publik.
- Bila ingin menampilkan testimoni, gunakan nama/role yang disetujui
  pemiliknya (model `Testimonial` sudah menyimpan persetujuan via `published`).
