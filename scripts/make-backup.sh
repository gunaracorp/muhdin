#!/usr/bin/env bash
# =============================================================
# make-backup.sh — Buat arsip zip bersih proyek MUHDIN.
#
# Latar (Task 41): tombol "Download workspace" bawaan gagal
# ("Failed to fetch") karena workspace mentah berisi ±62.000
# berkas / 1,6GB — node_modules sendiri 58.752 berkas — sehingga
# pengemas bawaan timeout. Endpoint /api/backup memakai skrip
# ini untuk menyajikan arsip bersih yang jauh lebih kecil.
#
# Pemakaian : bash scripts/make-backup.sh [source|full]
#   source  (default) — kode sumber + aset + konfigurasi,
#                       TANPA rahasia: .env, db/*.db, dan .git
#                       disisihkan. Aman diunduh publik.
#   full              — titik pemulihan lengkap: + .git (riwayat
#                       commit), .env, dan database SQLite.
#                       Hanya diunduh via /api/backup?full=1
#                       yang dilindungi login admin.
#
# Output    : /tmp/muhdin-source.zip | /tmp/muhdin-full.zip
#             (disengaja di luar workspace agar arsip tidak ikut
#             terhitung dalam ukuran workspace itu sendiri)
# =============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-source}"
OUT="/tmp/muhdin-${MODE}.zip"

if [ "$MODE" != "source" ] && [ "$MODE" != "full" ]; then
  echo "[make-backup] mode tidak dikenal: $MODE (pakai source|full)" >&2
  exit 1
fi

cd "$ROOT"

# Sisihkan folder sistem/dependency & artefak build dari kedua mode.
EXCLUDES=(
  -x "node_modules/*"
  -x ".next/*"
  -x ".turbo/*"
  -x "skills/*"
  -x "tool-results/*"
  -x "dev.log"
  -x "*.log"
  -x ".DS_Store"
)

if [ "$MODE" = "source" ]; then
  # Mode source: buang juga rahasia, data, dan riwayat git.
  EXCLUDES+=(
    -x ".git/*"
    -x ".env"
    -x ".env.*"
    -x "db/custom.db"
    -x "db/custom.db-journal"
  )
fi

rm -f "$OUT"
zip -rq "$OUT" . "${EXCLUDES[@]}"

FILES=$(unzip -l "$OUT" | tail -1 | awk '{print $2}')
SIZE=$(du -h "$OUT" | cut -f1)
echo "[make-backup] mode=$MODE → $OUT (${SIZE}, ${FILES} berkas)"
