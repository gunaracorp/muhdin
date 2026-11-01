# DATABASE — Prisma 6 · SQLite (dev) ↔ PostgreSQL (produksi)

Seluruh data MUHDIN didefinisikan dalam **satu schema Prisma**: `prisma/schema.prisma`
dengan **56 model** — hasil gabungan (v12.0 «GABUNG») dua garis pengembangan besar.
Mode default sandbox/lokal memakai **SQLite** (`db/custom.db`), dan jalur produksi
**PostgreSQL** sudah disiapkan penuh (lihat bagian akhir).

## Resolusi DATABASE_URL Saat Runtime

`src/lib/db.ts` membuat `PrismaClient` klasik (Prisma 6):

1. **`DATABASE_URL` eksplisit** di `.env` dihormati (default `file:./db/custom.db`
   — di-resolve relatif terhadap working directory).
2. **Fallback lokal/VPS**: `file:<cwd>/db/custom.db`.
3. `db/custom.db` **tidak pernah di-commit** (gitignore `/db/`) — berisi data runtime.
4. Arsip contoh hasil migrasi garis v11: `db/arsip-v11-sqlite.db` (juga tidak di-commit).

CLI memakai Prisma 6 bawaan (`bunx prisma db push` / `generate`); `bun run db:push`
disediakan di `package.json`.

## Registry 56 Model (per kelompok)

### Auth & RBAC
`User` — akun CMS (SUPER_ADMIN/ADMIN/EDITOR/VERIFIKATOR), hash bcryptjs.

### Keanggotaan & KTA
`Member` (direktori anggota terverifikasi) · `MembershipApplication` (+`ticketCode`,
`queueNumber` atomik, `referralCode`) · `MemberCard` (KTA digital) · `PointLedger`
(buku poin: REGISTER/REFERRAL/ADMIN/REDEEM).

### Perjalanan Ibadah & Identitas Jamaah
`TourPackage` · `PackageBooking` (pipeline marketplace) · `PilgrimCard` (kartu jamaah
QR per rombongan) · `PilgrimReview` · `HajjPassport` (paspor haji digital + QR) ·
`GpsPing` · `TrackingDevice` (GPS rombongan real-time).

### Komunitas
`ForumThread` · `ForumReply` (+moderasi CMS).

### Akademi & Sertifikasi
`AcademyCourse` (trilingual + quiz JSON) · `AcademyEnrollment` · `Certificate`
(nomor SERT-…, verifikasi QR publik).

### Layanan Terjadwal & Benefit
`ServiceSlot` (kelas manasik/konsultasi syariah/klinik vaksin) · `SlotBooking` ·
`Benefit` (katalog mitra) · `BenefitRedemption`.

### Pusat Bisnis B2B (hulu-hilir)
`SeatListing` (bursa kursi antar-penyelenggara, RELASI SeatOwner/SeatTaker) ·
`Vendor` · `Muthowif` (registry + afiliasi Member) · `RegistryCompany` · `RegistryDoc`
(dossier izin: BPW/PPIU/PIHK/IATA/akreditasi) · `ComplianceDoc` · `JamaahDoc`.

### Kepercayaan & Darurat
`Complaint` · `SosPoint` (KJRI/KKI/RS — posko darurat) · `RegionalBranch` (DPD/kantor).

### Nusuk & Integrasi
`NusukConnection` · `NusukPermit` · `NusukSyncLog` (riwayat sinkron + durasi).

### Konten Portal
`Article` · `Tutorial` · `FAQ` · `Ecosystem` (13 ekosistem) · `JourneyStep` · `Roadmap` ·
`Agenda` · `GalleryItem` · `Resource` (pusat unduhan) · `Subscriber` · `Testimonial` ·
`ContactMessage` · `SiteSetting` · `Management` (struktur organisasi) · `Translation`.

### Tur Virtual
`TourScene` (multi-scene panorama 360° + view counter).

### Notifikasi & AI
`EmailSetting` (SMTP + 9 saklar kejadian) · `WhatsAppSetting` (provider
FONNTE/WABLAS/CALLMEBOT/CUSTOM + saklar + `botEnabled` + `botWebhookSecret`) ·
`NotificationLog` (audit EMAIL/WHATSAPP per kejadian) · `AiChatLog` (riwayat bot WA-AI).

## Skema Union: Catatan Penting

- Relasi `Member` memuat back-relation kedua garis: `packages`, `cards`,
  `complianceDocs`, `seatListings` ("SeatOwner"), `seatTakes` ("SeatTaker"),
  `muthowifs`, `permits`, `passports`, `devices`, `card`, `benefits`.
- Semua model memakai tipe portabel (String/Int/Boolean/DateTime/JSON-string) —
  **kompatibel SQLite & PostgreSQL tanpa perubahan**, sehingga flip provider
  produksi hanya menyentuh 1 baris `provider` + `DATABASE_URL`.

## Jalur Produksi PostgreSQL

```bash
# 1. Di prisma/schema.prisma: provider = "postgresql"
# 2. .env:
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require"
# 3. (opsional, gaya v11 — driver adapter + prisma.config.ts)
#    dependensi @prisma/adapter-pg + pg sudah tersedia di package.json
bunx prisma generate
bunx prisma db push
# 4. Migrasi data dari SQLite:
node scripts/migrate-sqlite-to-postgres.mjs   # 42+ tabel, urut topologis FK
node scripts/verify-v111.mjs                  # verifikasi jumlah baris
```

Backup: CMS → Backup (`/api/backup`) atau `scripts/make-backup.sh`.
