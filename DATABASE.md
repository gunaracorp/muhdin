# DATABASE — Prisma & SQLite di MUHDIN NUSANTARA

Seluruh data MUHDIN hidup di **satu file SQLite**: `db/custom.db` (akar proyek),
diakses melalui **Prisma ORM 6** dengan **26 model** yang didefinisikan di
`prisma/schema.prisma`. Satu file database memudahkan deploy, backup, dan restore.

## Resolusi DATABASE_URL Saat Runtime

`src/lib/db.ts` menentukan lokasi database sebelum `PrismaClient` dibuat:

1. **Di Vercel** (`VERCEL=1`): salin `db/custom.db` yang ter-bundle ke
   `/tmp/muhdin.db` lalu pakai `file:/tmp/muhdin.db` (SQLite butuh akses tulis
   meski hanya membaca; `/tmp` satu-satunya path writable di serverless).
   Ingat: filesystem serverless ephemeral — lihat `DEPLOYMENT.md`.
2. **`DATABASE_URL` eksplisit** dihormati *selama file-nya benar-benar ada*
   (`file:` di-resolve relatif terhadap working directory). Path warisan yang
   mati diabaikan dengan anggun.
3. **Fallback lokal/VPS**: `file:<cwd>/db/custom.db`.

`prisma/schema.prisma` menetapkan `binaryTargets` multi-platform
(`native`, `debian-openssl-3.0.x`, `rhel-openssl-3.0.x`) agar query engine tetap
jalan di shared hosting CloudLinux/cPanel maupun Debian/Ubuntu.

Di edisi PHP shared hosting, database yang setara adalah
`data/muhdin.sqlite` di dalam paket (dibangun dari `db/custom.db` oleh
`scripts/build-shared-hosting.mjs`).

## Daftar 26 Model Prisma

Dikelompokkan sesuai komentar di `prisma/schema.prisma`:

### Auth

| Model | Fungsi | Field kunci |
|---|---|---|
| `User` | Akun admin CMS | `email` (unique), `password` (hash), `role` (`SUPER_ADMIN`/`ADMIN`/`VERIFIKATOR`/`EDITOR`), `isActive`, `lastLoginAt` |
| `Session` | Sesi login (token di cookie) | `token` (unique), `userId` → User (cascade), `expiresAt` |

### Konten

| Model | Fungsi | Field kunci |
|---|---|---|
| `Article` | Berita/artikel portal | `slug` (unique), `status` (default `PUBLISHED`), `featured`, `views`, `author`, `category` |
| `Ecosystem` | 13 layanan ekosistem | `number` (unique), `cluster`, `scope`, `standard`, `icon` |
| `JourneyStep` | Tahapan alur jamaah | `step` (unique), `actor`, `output` |
| `Roadmap` | Fase pengembangan 2026–2030 | `phase`, `period`, `deliverables`, `order` |

### Keanggotaan

| Model | Fungsi | Field kunci |
|---|---|---|
| `Member` | Direktori anggota terverifikasi | `type` (PPIU/PIHK/KBIHU/…), `licenseNo`, `city`, `province`, `status` (default `TERVERIFIKASI`), `rating`, `phone`/`email` (opsional) |
| `MembershipApplication` | Pendaftaran anggota ber-tiket | `ticketCode` (unique, format `MHD-XXXXXX`), `status` (`PENDING`/`APPROVED`/`REJECTED`), `reviewNote`, `reviewedBy`, `reviewedAt` |

### Tutorial

| Model | Fungsi | Field kunci |
|---|---|---|
| `Tutorial` | Tutorial portal | `slug` (unique), `category` (CMS/Jamaah/Mitra/Umum), `level` (Pemula/Menengah/Mahir), `duration`, `order`, `published`, `views` |

### Komunikasi

| Model | Fungsi | Field kunci |
|---|---|---|
| `ContactMessage` | Pesan form kontak | `status` (default `UNREAD`), `phone` (opsional) |
| `Faq` | Tanya jawab | `question`, `answer`, `category`, `order` |
| `Testimonial` | Testimoni | `rating`, `published` |

### Profil

| Model | Fungsi | Field kunci |
|---|---|---|
| `Management` | Pengurus pusat | `name`, `position`, `bio`, `order` |
| `RegionalBranch` | Jaringan daerah DPD/DPC & Branch Office | `code`, `province`, `city`, `officeName`, `address`, `picName`, `picPhone`, `published` |
| `SiteSetting` | Pasangan key–value pengaturan situs | `key` (unique), `value` |

### Integrasi Nusuk

| Model | Fungsi | Field kunci |
|---|---|---|
| `NusukConnection` | Koneksi ke platform Nusuk (singleton) | `environment` (default `SANDBOX`), `apiKey`, `webhookSecret`, `status`, `autoSync`, `totalSyncs`, `lastSyncAt` |
| `NusukPermit` | Data izin per anggota | `permitNo` (unique), `memberId` → Member (cascade), `type`, `holderName`, `status`, `expiresAt` |
| `NusukSyncLog` | Riwayat sinkronisasi | `connectionId` → NusukConnection (set null), `type`, `status`, `recordsAffected`, `durationMs` |

### I18N — Translasi Konten

| Model | Fungsi | Field kunci |
|---|---|---|
| `ContentTranslation` | Terjemahan EN/AR baris konten DB | `entity`, `entityKey`, `locale` (`en`/`ar`), `field`, `value`, `engine` (`ai`/`manual`); unik per `(entity, entityKey, locale, field)` |

### Notifikasi WhatsApp

| Model | Fungsi | Field kunci |
|---|---|---|
| `WhatsAppSetting` | Konfigurasi gateway WA (singleton) | `provider` (`FONNTE`/`WABLAS`/`CUSTOM`), `apiUrl`, `token`, `target`, `enabled`, `notifyContact`, `notifyApplication`, `lastTestAt`, `lastTestStatus` |

> Token disimpan di tabel ini — **bukan** di `SiteSetting` — agar tidak bocor
> lewat `GET /api/settings` yang bersifat publik (lihat `SECURITY.md`).

### Kelengkapan Portal

| Model | Fungsi | Field kunci |
|---|---|---|
| `Gallery` | Galeri kegiatan (`#/galeri`) | `imageUrl`, `category`, `order`, `published` |
| `Event` | Agenda kegiatan (`#/agenda`) | `startsAt`, `endsAt`, `location`, `category`, `published` |
| `Resource` | Pusat unduhan (`#/unduhan`) | `fileUrl`, `fileType`, `downloads`, `published` |
| `Subscriber` | Pelanggan newsletter footer | `email` (unique), `isActive` |
| `Complaint` | Pengaduan jamaah (`#/lapor`) | `targetMember`, `category`, `status` (`UNREAD`/`PROCESSED`/`CLOSED`), `responseNote`, `respondedBy` |

### Audit

| Model | Fungsi | Field kunci |
|---|---|---|
| `AuditLog` | Jejak aktivitas admin | `userName`, `role`, `action` (`LOGIN`/`APPROVE`/`CREATE`/`UPDATE`/`DELETE`/`SYNC`/`EXPORT`/…), `entity`, `entityId`, `detail`; ter-index per `createdAt` dan `(entity, action)` |

## Perintah Harian

Semua dari akar proyek (bun, atau `npx` bila memakai Node):

```bash
bun run db:push        # prisma db push --accept-data-loss — sinkronkan schema ke db/custom.db
bun run db:generate    # prisma generate — regenerate Prisma Client (dipanggil otomatis oleh postinstall)
bun prisma/seed.ts     # seed lengkap: akun demo, konten, anggota, dll (idempotent — hapus data lama dulu)
bun prisma/seed-nusuk.ts  # seed integrasi Nusuk: koneksi sandbox, permit, log sync (idempotent)
```

Catatan:

- `db:push` memakai `--accept-data-loss` — baca konfirmasi Prisma sebelum lanjut.
  Untuk perubahan skema terkontrol tersedia `bun run db:migrate`
  (`prisma migrate dev`) dan `bun run db:reset`, tetapi alur kerja repo selama ini
  memakai `db:push`.
- `prisma/seed.ts` **menghapus seluruh data lama** sebelum mengisi — jangan
  dijalankan di database produksi yang sudah berisi data nyata.
- Seed memakai format hash yang sama dengan `src/lib/auth.ts` (`salt:hash` scrypt).

## Backup

### Edisi Node (VPS / cPanel Node / lokal)

```bash
# 1. Salin file database (cara paling cepat; SQLite = satu file)
cp db/custom.db backup/custom-db-$(date +%Y%m%d).db

# 2. Atau SQL dump (portabel antar versi/ mesin)
sqlite3 db/custom.db ".dump" > backup/muhdin-$(date +%Y%m%d).sql
```

### Edisi PHP Shared Hosting

Backup **`data/muhdin.sqlite`** dari File Manager cPanel (unduh salinan secara
berkala — semua konten CMS tersimpan di file itu, seperti ditegaskan di
`shared-hosting/INSTALL.txt`). Bila hosting menyediakan sqlite3 via SSH:

```bash
sqlite3 data/muhdin.sqlite ".dump" > muhdin-$(date +%Y%m%d).sql
```

Rekomendasi jadwal: harian untuk data transaksional (pendaftaran anggota,
pesan, pengaduan, audit log), dan **selalu** backup sebelum:
`bun run db:push`, update aplikasi, atau menjalankan seed apa pun.

## Restore

```bash
# Dari salinan file
cp backup/custom-db-20260101.db db/custom.db

# Dari SQL dump
sqlite3 db/custom.db < backup/muhdin-20260101.sql
```

Setelah restore, verifikasi dengan `curl /api/health` (`checks.database.ok = true`)
dan login CMS. Bila file restore berasal dari skema yang lebih lama, jalankan
`bun run db:push` agar skema menyatu dengan `prisma/schema.prisma` terbaru.
Di edisi PHP: unggah ulang `data/muhdin.sqlite` ke folder `data/` melalui
File Manager.

## Catatan Arsitektur Masa Depan (Belum Diimplementasikan)

Rencana entitas berikut **belum ada** di `prisma/schema.prisma` — dicatat di sini
sebagai arah pengembangan, bukan kapabilitas saat ini:

- **Pilgrims** — profil jamaah (saat ini jamaah hanya dilayani via halaman publik
  dan pelacakan tiket; tidak ada tabel jamaah).
- **Packages** — paket perjalanan umrah/haji milik anggota.
- **Bookings** — pemesanan paket oleh jamaah.
- **Payments** — pembayaran/iuran keanggotaan (iuran organisasi, bukan biaya
  pemerintah — lihat aturan konten di `CONTENT_GUIDE.md`).

Bila kelak ditambahkan, poin yang perlu dipikirkan: SQLite cocok untuk skala
portal saat ini; bila volume tulis transaksional meningkat signifikan (booking/
payment), pertimbangkan migrasi provider ke PostgreSQL — `datasource` di
`prisma/schema.prisma` cukup diganti, dan `src/lib/db.ts` sudah meneruskan
`DATABASE_URL` non-`file:` ke Prisma apa adanya.
