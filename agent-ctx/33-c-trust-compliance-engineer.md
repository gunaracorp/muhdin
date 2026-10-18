# Task 33-c — Trust/Compliance Engineer (ROLE 12/13/16/21)

## Hasil
5 file baru (tidak ada file lain yang diedit):

1. `src/components/views/verify-view.tsx` (466 baris) — `VerifyView({ query })`
2. `src/components/views/privacy-view.tsx` (167 baris) — `PrivacyView()`
3. `src/components/views/terms-view.tsx` (130 baris) — `TermsView()`
4. `src/components/views/dashboard-view.tsx` (520 baris) — `DashboardView()`
5. `src/lib/i18n/locales/nusantara-trust.ts` (517 baris) — namespace `nusTrust`, 129 key × 3 bahasa (id/en/ar), parity terverifikasi via script

## Kontrak yang diharapkan orchestrator
- Route mount di `muhdin-app.tsx`:
  - `case "verifikasi": content = <VerifyView key={route[1] ?? ""} query={route[1]} />` — deep-link `#/verifikasi/[query]` (dipakai juga sebagai target QR code).
  - `case "privasi": <PrivacyView />`
  - `case "syarat": <TermsView />`
  - `case "dashboard": <DashboardView />`
- Daftarkan `nusTrustDict` ke `src/lib/i18n/dictionaries.ts` (import + masukkan ke array `dicts`).
- Route `daftar` dipakai sebagai CTA (`navigate("daftar")` di verify-view empty-state & dashboard REJECTED). Saat ini root route yang ada adalah `gabung` — orchestrator tinggal alias `case "daftar": case "gabung":` atau sesuaikan.

## Catatan penting: VERIFIED_DISCLAIMER_ID
- `src/lib/nusantara.ts` saat agent 33-c bekerja **belum** mengekspor `VERIFIED_DISCLAIMER_ID` (baru berisi VERIFY_STATUSES, formatVerifyId, MEMBERSHIP_TIERS, dll).
- Agar compile tidak pernah pecah, verify-view & terms-view membacanya via **namespace import + cast defensif**:
  `import * as Nusantara from "@/lib/nusantara"; (Nusantara as { VERIFIED_DISCLAIMER_ID?: string }).VERIFIED_DISCLAIMER_ID`
- Bila konstanta sudah ada → teks PERSIS ditampilkan (single source of truth terhormat). Bila belum → fallback `t("nusTrust.disclaimer.fallback")` (teks legal setara, 3 bahasa). Begitu orchestrator menambahkan export di nusantara.ts, TIDAK ada perubahan kode lagi yang diperlukan.

## Keputusan teknis
- PRIVASI KERAS (ROLE 21): tipe lokal `VerifyMember` hanya mendaftar field aman (name, type, city, province, licenseNo, website, status, memberSince, updatedAt) — phone/email/rating/description tidak pernah dirender.
- QR: `react-qr-code`, size 128, bg putih, value `${origin}/#/verifikasi/${encodeURIComponent(licenseNo)}`; hanya render di client (di dalam hasil fetch).
- Badge animasi: cincin `animate-ping` + `motion-reduce:animate-none`, shield-check, centang stroke-draw via `motion.path pathLength` (duration 0 saat `useReducedMotion`).
- Tone→warna VERIFY_STATUSES: green=emerald, gold=gold, amber=amber, red=destructive, slate=muted; fallback {label: status, tone:"slate"}.
- Dashboard: localStorage `muhdin-ticket`; boot memakai pola defer (setTimeout 0) karena rule `react-hooks/set-state-in-effect` melarang setState sinkron di effect body; timeline PENDING=Ditinjau (pulse), APPROVED=✓, REJECTED=Ditolak + reviewNote; copy pakai icon `clipboard-list` (TIDAK ada icon "copy" di icon.tsx).
- Label tipe organisasi memakai kamus eksisting `members.type.*` / `track.mt*` dengan fallback kode mentah — tanpa duplikasi key.

## Verifikasi
- `bun run lint` → 0 error (seluruh repo).
- `bunx tsc --noEmit` → 0 error di 5 file milik 33-c. (Catatan: masih ada error TS prasetel di file agent lain: `admin-dashboard.tsx` memberByType ×3, `crud-manager.tsx` perbandingan "checkbox" ×2 — dilaporkan, tidak disentuh.)
- `curl http://localhost:3000/` → 200; dev.log bersih.
- Smoke API: `/api/members/verify?q=barokah` → found + `updatedAt` ada; `/api/applications/track?code=MHD-36LL65` (APPROVED), `MHD-ZUQZWB` (REJECTED + reviewNote), `MHD-XXXXXX` → 404 error JSON (tertangani → state notFound).
