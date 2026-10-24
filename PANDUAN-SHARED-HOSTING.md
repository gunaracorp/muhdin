# 🚀 PANDUAN SHARED HOSTING — MUHDIN (muhdin.web.id)

> Panduan lengkap menjalankan Super Web App MUHDIN (portal publik + CMS + Nusuk Connect)
> di **shared hosting cPanel** dengan dukungan **Node.js App (Passenger)**.
> Ditulis untuk orang non-teknis — ikuti langkahnya satu per satu.

---

## 📌 Ringkasan Arsitektur

```
 Pengunjung / Admin
        │  https://muhdin.web.id
        ▼
 ┌─────────────────────────── SHARED HOSTING (cPanel) ───────────────────────────┐
 │  Apache + SSL (Let's Encrypt)                                                 │
 │        │  Passenger (Setup Node.js App)                                       │
 │        ▼                                                                      │
 │  server.js  ◀── Startup file (cPanel mengisi PORT otomatis)                   │
 │        │  memuat .env + pre-flight check + jalankan:                          │
 │        ▼                                                                      │
 │  .next/standalone/server.js   ◀── server Next.js produksi (portabel)          │
 │        │                                                                      │
 │        ├── /api/*  → 27 API routes (auth, CRUD, Nusuk engine, health)         │
 │        └── db/custom.db   ◀── database SQLite (1 file, mudah dibackup)        │
 └───────────────────────────────────────────────────────────────────────────────┘
```

**Kenapa desain ini ramah shared hosting?**

| Aspek | Solusi yang sudah diterapkan |
|---|---|
| Resource terbatas | `output: "standalone"` — server + `node_modules` minimal (~80–120 MB), **tanpa `npm install` di server** |
| Sistem operasi berbeda | Query Engine Prisma **multi-platform** (Debian + RHEL/CloudLinux) ikut ter-bundle |
| Path berbeda tiap akun | `server.js` otomatis mengisi `DATABASE_URL` menunjuk `<folder aplikasi>/db/custom.db` |
| Tanpa SSH | Build & pack di komputer lokal, upload lewat **File Manager** cPanel |
| Keamanan | Cookie Secure di produksi, header keamanan `.htaccess`, ganti password dari CMS |

---

## ✅ Prasyarat (Cek Sebelum Mulai)

Tanyakan/minejikan pada penyedia hosting Anda:

1. **cPanel** dengan fitur **"Setup Node.js App"** (ada di bagian *Software*).
   - Ada di: Niagahoster, Hostinger (paket tertentu), Rumahweb, Dewaweb, IDCloudHost,
     Exabytes, dkk — biasanya paket yang menyebut *"Node.js support"*.
   - ❌ Tidak ada fitur ini? Lihat [Bagian 9 — Alternatif](#9-_alternatif-bila-hosting-tidak-dukung-nodejs).
2. **Pilihan versi Node.js 20 atau 22** (Next.js 16 minimal Node 20.9).
3. **Ruang disk ± 500 MB** (paket ± 120 MB + ruang log/cache).
4. **Domain** `muhdin.web.id` sudah diarahkan (A record / nameserver) ke hosting.
5. Di **komputer lokal**: Node.js 20+ terpasang (`node -v`), kode proyek MUHDIN lengkap.

---

## 🅰️ Langkah A — Build & Pack di Komputer Lokal

Buka terminal/CMD di folder proyek, jalankan:

```bash
# 1) Pasang dependensi (sekali saja)
npm install            # atau: bun install

# 2) Generate Prisma Client + engine multi-platform (sekali saja / setelah ubah schema)
npx prisma generate    # atau: npm run db:generate

# 3) Build produksi (server standalone + aset statis)
npm run build

# 4) Buat paket upload → folder release/muhdin-shared-hosting (+ .zip)
npm run hosting:pack
```

Hasil akhir:

```
release/
└── muhdin-shared-hosting/
    ├── server.js                  ← startup file cPanel
    ├── .env                       ← otomatis, tidak perlu diedit
    ├── .htaccess
    ├── PANDUAN-SHARED-HOSTING.md
    ├── RELEASE-INFO.txt
    ├── .next/
    │   ├── standalone/            ← server + node_modules minimal (Prisma engine di dalam)
    │   └── static/
    ├── public/                    ← gambar hero, logo, robots.txt
    ├── db/custom.db               ← database siap pakai (ter-seed)
    └── prisma/schema.prisma
```

> 💡 **Windows**: script `build` sudah cross-platform (pakai Node, bukan `cp`).
> Bila `zip` otomatis gagal, klik kanan folder `muhdin-shared-hosting` →
> *Send to → Compressed (zipped) folder*.

---

## 🅱️ Langkah B — Upload ke cPanel

1. Login **cPanel** → buka **File Manager**.
2. Buat folder **di luar `public_html`** (sejajar dengannya), contoh: `muhdin-app`.
   > Penempatan di luar `public_html` lebih aman — file `.db` & `.env` tidak terjangkau web.
3. Masuk ke folder itu → **Upload** → pilih `muhdin-shared-hosting.zip`.
4. Setelah terupload, klik kanan file zip → **Extract** → pastikan hasilnya di
   `/home/USERNAME/muhdin-app/` (file `server.js` harus langsung ada di situ).
5. (Rapikan) Hapus file zip-nya setelah ekstrak sukses.

> 📝 Catat **path lengkap** folder ini (mis. `/home3/userku/muhdin-app`) —
> cPanel menampilkannya di bilah atas File Manager.

---

## 🅲️ Langkah C — Buat Aplikasi Node.js di cPanel

Buka **cPanel → Setup Node.js App** → **Create Application**:

| Field | Isi dengan | Keterangan |
|---|---|---|
| Node.js version | **20.x** atau **22.x** | Jangan pakai 18 (Next.js 16 butuh ≥ 20.9) |
| Application mode | **Production** | |
| Application root | `muhdin-app` | Path relatif dari home akun |
| Application URL | domain **muhdin.web.id** + `/` | cPanel memetakan domain → aplikasi |
| Application startup file | **`server.js`** | Wrapper pintar MUHDIN |

Klik **Create**. Lalu pada halaman detail aplikasi:

1. **Environment variables** — normalnya **tidak perlu** (sudah diatur `server.js` + `.env`).
   Opsional bila ingin menimpa:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | `file:/home/USERNAME/muhdin-app/db/custom.db` |
   | `MUHDIN_SKIP_DB_CHECK` | `1` (hanya untuk eksperimen) |
2. Klik **Restart** (tombol *Restart* di kanan atas kartu app).
3. **Run NPM Install TIDAK diperlukan** — semua modul sudah dibundle. Lewati saja.

Setelah start, cek log di kartu aplikasi (*stderr log / stdout log*) — harus muncul banner:

```
[MUHDIN] ==========================================================
[MUHDIN] MUHDIN — muhdin.web.id  ·  Shared Hosting Mode
[MUHDIN] Node.js      : v20.x.x
[MUHDIN] Mode         : production
[MUHDIN] Port         : xxxxx (diset oleh Passenger)
[MUHDIN] Database     : /home/USERNAME/muhdin-app/db/custom.db
[MUHDIN] ==========================================================
```

---

## 🅳 Langkah D — Domain & SSL (HTTPS)

1. **Arahkan domain**: pastikan `muhdin.web.id` mengarah ke IP hosting
   (cPanel → *Zone Editor*, atau di pengelola domain: ganti nameserver/A record).
2. **Aktifkan SSL gratis**: cPanel → **SSL/TLS Status** → centang `muhdin.web.id` →
   **Run AutoSSL** (Let's Encrypt). Tunggu status jadi ✅.
3. **Paksa HTTPS**: sudah ditangani `.htaccess` dalam paket (redirect 301 ke https).
4. Buka `https://muhdin.web.id` — portal MUHDIN tampil 🎉

---

## 🅴 Langkah E — Verifikasi Go-Live (Checklist Wajib)

| # | Uji | Cara | Harapan |
|---|---|---|---|
| 1 | Server hidup | Buka `https://muhdin.web.id/api/health` | JSON `"ok": true`, `database.ok: true` |
| 2 | Portal publik | Buka `https://muhdin.web.id` | Hero + 13 ekosistem + statistik tampil |
| 3 | Halaman Nusuk | Menu **Nusuk Hub** | Status koneksi, Permit Checker jalan |
| 4 | Login CMS | `#/admin` → `admin@muhdin.web.id` / `muhdin2026` | Dashboard + grafik tampil |
| 5 | **Ganti password** | CMS → **Pengaturan** → kartu *Keamanan Akun* | Password `muhdin2026` diganti — **WAJIB** |
| 6 | Status Server | CMS → **Pengaturan** → kartu *Status Server (Hosting)* | Node versi, DB latency, RAM tampil |
| 7 | CRUD | Buat 1 artikel uji → lihat di portal → hapus | Data tersimpan di SQLite hosting |
| 8 | Mobile | Buka dari HP | Menu hamburger, footer sticky, tanpa overflow |

---

## 🔐 Keamanan Produksi (Lakukan Sekali)

- [ ] **Ganti password admin** dari CMS (kartu *Keamanan Akun*) — jangan pakai `muhdin2026`.
- [ ] Pastikan **HTTPS aktif** dan redirect `.htaccess` berfungsi.
- [ ] Permission file: folder `755`, file `644` (File Manager → *Change Permissions*).
- [ ] `.env` & `db/custom.db` **tidak** bisa diakses web (file disarankan di luar `public_html`;
  `.htaccess` juga sudah memblokir `.env` dan `*.db`).
- [ ] Jadwalkan **backup database** (lihat Bagian 7).

---

## 🔄 Bagian 7 — Update Aplikasi & Backup

### Update (mis. ada fitur baru)
```bash
# di komputer lokal
git pull / tarik perubahan kode
npm run build && npm run hosting:pack
```
1. Upload zip baru ke cPanel → **Extract** ke folder yang sama (timpa semua).
2. cPanel → Setup Node.js App → **Restart**.
3. Cek `/api/health` + banner log.

> 🛡️ **Rollback**: sebelum update, download dulu `db/custom.db` + zip lama dari File Manager.
> Bila update gagal, upload ulang paket lama → Restart → selesai.

### Backup Database (SQLite = 1 file!)
- **Manual**: File Manager → `muhdin-app/db/custom.db` → *Download* (mingguan disarankan).
- **Terjadwal**: cPanel → *cron job* harian:
  ```bash
  cp ~/muhdin-app/db/custom.db ~/backups/muhdin-$(date +\%F).db
  ```

---

## 🧯 Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman **503 / 502** | App gagal start | Buka log di kartu Node.js App → baca banner `[MUHDIN]`; umumnya build belum terupload lengkap |
| Log: *BUILD PRODUKSI TIDAK DITEMUKAN* | `.next/standalone` tidak ikut terupload | Extract ulang zip di folder yang benar; pastikan `server.js` sejajar folder `.next` |
| Log: *DATABASE SQLITE TIDAK DITEMUKAN* | Folder `db/` tertinggal / path salah | Upload `db/custom.db`, atau set env `DATABASE_URL` di cPanel |
| `PrismaClientInitializationError` / `libssl` / engine error | OpenSSL hosting beda varian | Engine rhel+debian sudah dibundle; bila tetap gagal, tanyakan versi OS hosting → tambahkan `binaryTargets` sesuai OS → build ulang |
| Login CMS: password benar tapi tak masuk | Akses via HTTP (cookie Secure ditolak) | Aktifkan SSL & pakai `https://` |
| **EADDRINUSE** | Port bentrok / proses nyangkut | cPanel → Restart aplikasi; tunggu 10 detik lalu start |
| Error `SQLITE_BUSY` | Lebih dari 1 instance | Pastikan aplikasi berjalan **1 instance** (default cPanel) |
| Aplikasi tewas sendiri / OOM | Batas memori akun (LVE) | Naikkan limit memory di paket/hosting; Monitor → *Resource Usage* |
| Node version error `Unsupported engine` | Node 18 dipilih | Pilih Node 20/22 di Setup Node.js App |
| File upload gambar gagal | Izin folder | File Manager → folder `public/images` → permission `755` |
| Perubahan tak muncul | Cache halaman lama | Hard refresh (Ctrl+Shift+R); Restart app |

---

## 🆚 Bagian 9 — Alternatif bila Hosting TIDAK Dukung Node.js

| Opsi | Keterangan |
|---|---|
| **Upgrade paket / pindah hosting** (direkomendasikan) | Paket Node.js hosting mulai ± Rp 30–50 ribu/bulan (Niagahoster/Hostinger/Dewaweb). Semua fitur CMS + Nusuk jalan penuh. |
| **VPS mini** | Kontrol penuh, jalankan `npm run start` + nginx. Untuk pengguna teknis. |
| Hosting tetap (PHP saja) | Next.js **tidak bisa** jalan — CMS & API butuh Node.js. Tanpa Node.js tidak ada jalur penuh; portal saja bisa dibuat versi statis, namun CMS off. |

---

## ❓ FAQ Singkat

**Apakah perlu MySQL di hosting?** — Tidak. MUHDIN memakai **SQLite** (1 file `db/custom.db`):
ringan, tanpa konfigurasi, gampang dibackup. Cocok untuk skala portal + CMS seperti ini.

**Apakah perlu SSH?** — Tidak untuk deployment standar (upload via File Manager).
SSH hanya menambah kenyamanan (mis. backup/restore cepat).

**Berapa biaya resource?** — Server Next.js standalone ± 100–150 MB RAM saat idle.
Paket shared hosting Node.js standar (512 MB – 1 GB) sangat cukup.

**Bagaimana kalau lupa password admin?** — Download `db/custom.db`, ubah password
di komputer lokal (atau jalankan ulang seed admin), lalu upload kembali + Restart.

**Izin (Nusuk) tidak muncul?** — Pastikan CMS → *Integrasi Nusuk* → status **Terhubung**,
lalu jalankan **Sinkronisasi Manual**; cek tab *Log Sinkronisasi* untuk detail.

---

*Dibuat otomatis oleh build kit MUHDIN — Task 13 (Shared Hosting Deployment).
Selamat go-live! 🌙✨*
