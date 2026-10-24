/* ============================================================
   MUHDIN Service Worker (Task 15-b — PWA Offline)
   ------------------------------------------------------------
   Strategi:
   - Navigasi halaman  : network-first (timeout 4s) → cache → offline.html
   - Aset statis       : stale-while-revalidate (/_next/static, ikon, font,
                         gambar) — cepat, diperbarui di latar belakang
   - /api/*            : network-only (data CMS tidak pernah di-cache agar
                         tidak basi; ketika offline, UI menampilkan pesan)
   Ganti MUHDIN_VERSION saat deploy baru untuk memaksa refresh cache.
   ============================================================ */
const MUHDIN_VERSION = "muhdin-v2.0.0";
const PRECACHE = `${MUHDIN_VERSION}-precache`;
const RUNTIME = `${MUHDIN_VERSION}-runtime`;
const NAV_TIMEOUT_MS = 4000;

const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/* ---------- Install: precache shell ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ---------- Activate: bersihkan cache versi lama ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(MUHDIN_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------- Pesan dari halaman ---------- */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ---------- Util ---------- */
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(request).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/logo.svg" ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Permintaan lintas origin → biarkan browser.
  if (url.origin !== self.location.origin) return;

  // API: network-only (tanpa cache; jika offline, biarkan gagal alami).
  if (url.pathname.startsWith("/api/")) return;

  // Navigasi halaman (mode navigate + dokumen) → network-first.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
          const cache = await caches.open(RUNTIME);
          cache.put("/", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(PRECACHE);
          return (
            (await cache.match("/")) ||
            (await caches.match(request)) ||
            (await cache.match("/offline.html")) ||
            new Response("Anda sedang offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  // Aset statis → stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => undefined);
        return cached || (await network) || new Response("", { status: 504 });
      })()
    );
    return;
  }

  // Selain itu → network-first dengan fallback cache.
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.status === 200) {
          const cache = await caches.open(RUNTIME);
          cache.put(request, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error("offline");
      }
    })()
  );
});
