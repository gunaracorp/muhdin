#!/usr/bin/env bash
# Dev server helper — pastikan http://localhost:3000 hidup.
# Dipakai di awal setiap sesi QA: idempotent, restart bila mati.
set -u
cd /home/z/my-project

code() { curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/ 2>/dev/null; }

if [ "$(code)" = "200" ]; then
  echo "[dev-keep] server sudah hidup"
  exit 0
fi

# Bersihkan sisa proses & port
pkill -f "next dev -p 3000" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1

echo "[dev-keep] memulai dev server..."
setsid nohup bun run dev >> dev.log 2>&1 < /dev/null &
sleep 4

for i in $(seq 1 30); do
  c="$(code)"
  if [ "$c" = "200" ]; then
    echo "[dev-keep] server UP (HTTP 200) setelah $((i * 2))s"
    exit 0
  fi
  sleep 2
done

echo "[dev-keep] GAGAL: server tidak merespons 200"
exit 1
