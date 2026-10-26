# Prisma ORM 8 migration — MUHDIN

## Tujuan

Menambahkan Prisma ORM 8 sebagai jalur PostgreSQL untuk menghubungkan repositori
MUHDIN ke Prisma Compute/Prisma Developer Platform, sambil mempertahankan jalur
SQLite yang saat ini masih dipakai aplikasi sampai migrasi rute dan data
diverifikasi.

## Target versi

- Prisma ORM CLI: `8.0.0-rc.27`
- PostgreSQL runtime/config: `@prisma/orm-postgres@8.0.0-rc.27`
- TypeScript minimum: 5.9
- Node minimum: 22.18 (Prisma ORM 8 compatibility)

Prisma ORM 8 saat ini adalah release candidate. Package CLI dan runtime ORM
mempunyai versi terpisah.

## File baru

- `prisma.config.ts`: konfigurasi Prisma ORM 8 PostgreSQL.
- `src/prisma/contract.prisma`: 28 model kontrak yang disalin dari skema lama.
- `src/prisma/db.ts`: client PostgreSQL Prisma ORM 8.
- `prisma6.config.ts`: konfigurasi CLI lama untuk SQLite.
- `PRISMA8-MIGRATION.md`: status dan langkah migrasi.

## Status migrasi

**Ini adalah bootstrap transisi Prisma ORM 8, bukan migrasi aplikasi end-to-end.**
Rute Node.js yang mengimpor `@/lib/db` masih memakai API Prisma Client lama.
Dependensi kompatibilitas `prisma6` dan `@prisma/client` sengaja masih ada agar
rute tersebut tidak menjadi rusak hanya karena konfigurasi V8 ditambahkan.

Sebelum boleh menghapus kompatibilitas lama, setiap route/seed/script yang
memakai `db.<model>.*` harus dipindahkan ke API query V8, diuji, dan dicatat
statusnya. Aplikasi juga mempunyai backend PHP shared-hosting yang masih
menggunakan SQLite; backend itu adalah jalur terpisah dan tidak otomatis
berpindah ke PostgreSQL.

## Data dan keamanan

Tidak ada isi database yang dipindahkan di commit ini. Pemindahan data aktual
memerlukan backup file `db/custom.db`, connection string PostgreSQL tujuan
yang valid dalam `DATABASE_URL`, migrasi schema yang direncanakan, proses
ekspor/impor yang mempertahankan ID, relasi dan nilai waktu, serta pemeriksaan
jumlah rekaman dan relasi setelah import. Jangan menjalankan seed yang
menghapus data lama pada database produksi.

Jangan menyimpan `DATABASE_URL`, password, atau kredensial produksi di GitHub.
Tambahkan nilai itu sebagai environment variable di platform deployment.

## Perintah

- `npm run db:contract:emit`: emit artefak kontrak V8.
- `npm run db:init`: buat tabel awal dari kontrak pada database PostgreSQL kosong.
- `npm run db:update`: terapkan perubahan kontrak pada database yang sudah memiliki tabel; periksa target dan backup sebelum menjalankan.
- `npm run db:legacy:generate`: generate client lama untuk rute yang belum dipindahkan.
- `npm run db:legacy:push`: sinkron schema SQLite lama; tidak untuk produksi tanpa backup.
- `npm run db:legacy:migrate`: migrasi SQLite lama.

Lockfile Bun pada branch migrasi sudah diregenerasi oleh CI dengan Bun 1.3.4. CI memvalidasi instalasi, contract emit, pemuatan kontrak melalui runtime PostgreSQL dan type-check dua berkas V8 terkait. Pemeriksaan ini belum menggantikan build dan test seluruh aplikasi.


## Import data dari SQLite ke PostgreSQL

Setelah membuat database PostgreSQL kosong, jalankan `bun run db:init` untuk membuat tabel awal dari kontrak V8. Jangan jalankan terhadap database yang telah berisi data. Untuk database yang sudah memakai kontrak sebelumnya, gunakan `bun run db:update` setelah backup dan peninjauan.

Setelah tabel kosong selesai dibuat:

1. Backup file SQLite sumber terlebih dahulu. Sumber default adalah `db/custom.db`; bila database produksi berbeda, gunakan salinan backup yang terbaru dan set `SQLITE_SOURCE_URL` ke file tersebut.
2. Atur `DATABASE_URL` ke database PostgreSQL tujuan. Simpan kredensial hanya dalam environment variable, bukan Git.
3. Jalankan:

```bash
SQLITE_SOURCE_URL="file:./db/custom.db" DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require" bun run db:import:sqlite
```

Skrip memindahkan semua 28 model sesuai urutan relasi, mengonversi nilai tanggal, menolak target yang sudah berisi data, dan menulis semua tabel dalam satu transaksi PostgreSQL. Jika satu operasi gagal, transaksi target dibatalkan. Skrip tidak menghapus atau mengubah SQLite sumber.

Setelah impor, bandingkan jumlah baris tiap tabel sumber dan target, uji login admin serta seluruh formulir/API, dan simpan backup SQLite asli sampai verifikasi selesai. Jangan memakai seed demo setelah impor.

**Penting:** kode migrasi ini belum dieksekusi terhadap database produksi karena connection string PostgreSQL tujuan tidak tersedia dalam repository. Menambahkan skrip tidak berarti data telah dipindahkan.
