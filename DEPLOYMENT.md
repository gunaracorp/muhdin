# DEPLOYMENT — Panduan Deploy MUHDIN NUSANTARA

Dokumen ini menjelaskan **tiga jalur deploy yang benar-benar didukung codebase ini**.
Semua perintah dan path di bawah diverifikasi terhadap `package.json`, `next.config.ts`,
`scripts/*.mjs`, dan isi `shared-hosting/` — bukan instruksi hipotetis.

MUHDIN memakai **tri-mode build** (lihat komentar di `next.config.ts`): satu codebase,
tiga target — Vercel (serverless), standalone Node.js, dan static export + backend PHP.

## Ringkasan Tiga Jalur

| Jalur | Prasyarat utama | Data tulis permanen? | Cocok untuk |
|---|---|---|---|
| **A. Vercel** | Akun GitHub + akun Vercel (tanpa env var) | Tidak (filesystem ephemeral) | Portal publik, demo, preview, staging |
| **B. Node.js sendiri / cPanel** | Node ≥ 20.9 (`engines` di `package.json`) atau Bun | Ya | Produksi penuh, fitur AI inline translation |
| **C. PHP Shared Hosting** | PHP 7.4+ dengan `pdo_sqlite`, Apache + mod_rewrite | Ya | Shared hosting cPanel tanpa Node.js |

Prasyarat umum: repo ini ter-clone, [Bun](https://bun.sh) terpasang di mesin build
(atau Node ≥ 20.9), dan database SQLite `db/custom.db` sudah berisi data
(`bun run db:push` lalu `bun prisma/seed.ts` bila mulai dari nol).

---

## Jalur A — Vercel (Opsi Utama, Zero-Config)

Sejak v3.1.0 proyek ini Vercel-ready penuh. Tidak perlu mengatur environment variable
apa pun; semua otomatisasi ada di kode:

| Tahap | Mekanisme (sumber nyata di repo) |
|---|---|
| Saat install | `postinstall: "prisma generate"` (`package.json`) — Prisma Client selalu ter-generate |
| Saat build | `VERCEL=1` membuat `next.config.ts` **tidak** memakai `output: "standalone"` (Vercel punya packaging sendiri); `scripts/post-build.mjs` keluar sukses (exit 0) tanpa folder standalone |
| Bawaan artefak | `outputFileTracingIncludes` membawa `./node_modules/.prisma/**` (query engine multi-platform) **dan** `./db/custom.db` ke dalam fungsi serverless |
| Saat runtime | `src/lib/db.ts` mendeteksi `VERCEL=1`, menyalin database ter-bundle ke `/tmp/muhdin.db` (satu-satunya path writable), lalu mengarahkan Prisma ke sana; `DATABASE_URL` warisan yang menunjuk file yang tidak ada diabaikan dengan anggun |

### Langkah

1. Push repo ini ke GitHub (atau GitLab/Bitbucket).
2. Buka [vercel.com/new](https://vercel.com/new) → **Import** repo.
3. Klik **Deploy** — selesai. Data demo dari `db/custom.db` langsung tampil.

Alternatif CLI dari akar proyek:

```bash
npm i -g vercel
vercel          # deploy preview
vercel --prod   # deploy produksi
```

### Catatan jujur: filesystem serverless itu ephemeral

Filesystem di fungsi serverless Vercel **tidak persisten** — setiap deploy baru atau
instance dingin mendapat salinan database segar dari repo. Artinya:

- **Data yang ditulis melalui CMS (login, pendaftaran anggota, audit log) TIDAK permanen** di Vercel.
- Untuk **portal publik, demo, preview, staging**: sepenuhnya memadai — seluruh halaman,
  login CMS demo, dan API baca bekerja normal.
- Untuk **data tulis yang harus tetap ada**: gunakan Jalur B atau C, di mana database
  menetap di disk yang persisten.

---

## Jalur B — Node.js Sendiri / cPanel (Setup Node.js App)

Build default proyek ini adalah `output: "standalone"` — hasil build portabel tanpa
`node_modules` penuh di server.

### Build di mesin lokal

```bash
bun install        # postinstall otomatis menjalankan prisma generate
bun run build      # = prisma generate && next build && node scripts/post-build.mjs
```

### Menjalankan

Cara paling sederhana — pakai skrip yang sudah ada:

```bash
bun run start      # = NODE_ENV=production bun .next/standalone/server.js | tee server.log
```

Atau jalankan standalone secara langsung dengan env eksplisit:

```bash
DATABASE_URL="file:/absolut/ke/db/custom.db" NODE_ENV=production \
  node .next/standalone/server.js
```

- Aplikasi hidup di `http://<host>:3000`.
- `DATABASE_URL` bersifat opsional: bila tidak diisi (atau menunjuk file yang tidak ada),
  `src/lib/db.ts` otomatis memakai `db/custom.db` dari working directory.
- Cek kesehatan: `curl http://localhost:3000/api/health`.

### cPanel dengan "Setup Node.js App"

Panduan lengkap langkah demi langkah ada di `PANDUAN-SHARED-HOSTING.md`. Ringkasannya:

```bash
bun run build          # build standalone + post-build
bun run hosting:pack   # scripts/pack-shared-hosting.mjs → release/muhdin-shared-hosting.zip
```

Lalu di cPanel:

1. Unggah `release/muhdin-shared-hosting.zip` ke folder aplikasi → **Extract**.
2. Buka **Setup Node.js App** → Node 20+ → Application root = folder hasil extract.
3. **Startup file = `server.js`** (wrapper di akar paket yang memuat env, pre-flight
   check, lalu menjalankan `.next/standalone/server.js`).
4. Klik **Restart**. Tanpa `npm install` — semua dependensi sudah ter-bundle, termasuk
   Prisma Query Engine dua varian (Debian + RHEL/CloudLinux).

### VPS (singkat)

```bash
bun install && bun run db:push && bun prisma/seed.ts   # pertama kali saja
bun run build && bun run start
```

Untuk produksi VPS, jalankan sebagai service (systemd atau proses manager pilihan
Anda) dan taruh reverse proxy (Nginx/Caddy) dengan TLS di depannya.

---

## Jalur C — PHP Shared Hosting (Tanpa Node.js)

Edisi khusus: frontend statis (hasil `next build` dengan `BUILD_STATIC=1`, output
`export`) + backend **PHP murni** yang mereplikasi kontrak API Node 1:1 (63 endpoint).
Sumber backend ada di folder `shared-hosting/` repo ini:

```
shared-hosting/
├── .htaccess            # routing API + SPA fallback + proteksi folder data
├── INSTALL.txt          # panduan unggah ±5 menit (dikutip sebagian di bawah)
├── router.php           # harness pengembangan: php -S localhost:8080 router.php
└── api/
    ├── index.php        # dispatcher 4 modul rute
    ├── config.php       # konfigurasi edisi PHP
    ├── lib.php          # pustaka inti: sesi, guard RBAC, rate limit, WA, audit
    ├── nusuk.php        # mesin Nusuk (katalog izin, sync, webhook)
    └── routes-*.php     # auth, content, directory, nusuk (paritas endpoint Node)
```

Prasyarat hosting: **PHP 7.4+** (disarankan 8.1+) dengan ekstensi bawaan
`pdo_sqlite` (WAJIB), `curl`, `json`, `mbstring`, `openssl`, `hash`, serta Apache
dengan mod_rewrite. **Tanpa Node.js, tanpa MySQL, tanpa SSH, tanpa Composer.**

### Membuat paket distribusi

```bash
bun run hosting:build   # scripts/build-shared-hosting.mjs
```

Pipeline ini membangun static export di salinan terisolasi, merakit
`deploy/muhdin-shared-hosting/`, lalu mem-zip menjadi
`deploy/muhdin-shared-hosting-v<versi>.zip` (versi mengikuti `package.json` —
saat ini v3.1.0; artefak zip tidak di-commit, generate ulang bila belum ada).
Pipeline juga otomatis me-rehash akun demo ke **bcrypt** (PHP memverifikasi bcrypt,
Node memverifikasi scrypt).

### Pasang di cPanel (±5 menit, dari `shared-hosting/INSTALL.txt`)

1. Masuk cPanel → File Manager → folder `public_html`.
2. Unggah `muhdin-shared-hosting-vX.Y.Z.zip` → klik kanan → **Extract**.
3. Buka domain Anda. Selesai.
4. Bila dipasang di **subfolder** (mis. `domain.com/muhdin`): edit `.htaccess`,
   hapus tanda `#` pada baris `RewriteBase /muhdin/` dan sesuaikan nama folder.
5. HTTPS: cPanel biasanya mengaktifkan AutoSSL; tambahkan redirect HTTPS di
   `.htaccess` bila diperlukan.

Struktur paket terpasang: `index.html` (SPA hash-routing), `assets/`, `airlines/`,
`icons/`, `manifest.json`, `sw.js`, `api/` (backend PHP), `data/muhdin.sqlite`
(database — **file inilah yang harus dibackup rutin**), dan `.htaccess`
(File Manager kadang menyembunyikan dotfile — aktifkan *Show Hidden Files*
dan pastikan `.htaccess` ikut terunggah).

Perbedaan edisi PHP vs Node (dokumentasi sadar, lihat worklog Task 30):
terjemahan konten EN/AR disajikan dari cache (tanpa fitur AI otomatis — itu hanya
di edisi Node.js), dan password dihash bcrypt alih-alih scrypt.

---

## Checklist Pasca-Deploy (Berlaku untuk Semua Jalur)

| # | Cek | Cara |
|---|---|---|
| 1 | Aplikasi hidup | Buka halaman utama domain |
| 2 | Kesehatan server & database | `curl https://domain-anda/api/health` → `{"ok":true,...}` (`checks.database.ok = true`) |
| 3 | API publik | `curl https://domain-anda/api/members` mengembalikan data |
| 4 | Login admin | `https://domain-anda/#/admin` → login Super Admin |
| 5 | **Ganti password (wajib)** | CMS → Profil → Ganti Password (endpoint `PUT /api/auth/password`); jangan biarkan kredensial demo aktif |
| 6 | Audit log jalan | CMS (Super Admin) → modul Audit terisi setelah aktivitas |
| 7 | HTTPS aktif | Semua URL diakses via `https://` (cookie sesi ditandai `Secure` saat produksi) |
| 8 | Notifikasi WhatsApp | CMS → modul WhatsApp: konfigurasi provider, uji dengan **Kirim Pesan Uji** (`POST /api/whatsapp/test`), matikan (`enabled=false`) bila belum dipakai |

Kredensial demo bawaan (WAJIB diganti setelah login pertama):

| Peran | Email | Password awal |
|---|---|---|
| Super Admin | `admin@muhdin.web.id` | `muhdin2026` |
| Editor | `editor@muhdin.web.id` | `editor2026` |
| Verifikator | `verifikator@muhdin.web.id` | `verifikator2026` |

---

## Referensi

- `next.config.ts` — tri-mode build (standalone / Vercel / static export).
- `src/lib/db.ts` — resolusi `DATABASE_URL` runtime (self-healing).
- `scripts/build-shared-hosting.mjs` — pipeline paket PHP (`deploy/`).
- `scripts/pack-shared-hosting.mjs` — paket Node standalone (`release/`).
- `shared-hosting/INSTALL.txt` dan `PANDUAN-SHARED-HOSTING.md` — panduan hosting.
- `README.md` bagian Deployment — ringkasan empat target termasuk VPS.
