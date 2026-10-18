"use client";

/**
 * RegisterSW — mendaftarkan service worker untuk PWA offline (Task 15-b).
 * Render null; dipasang sekali di pohon aplikasi (muhdin-app.tsx).
 *
 * Fix hydration mismatch (Task 29-F):
 * - PRODUKSI : SW didaftarkan seperti biasa (offline shell + SWR aset
 *              ber-hash — aman karena nama file berubah saat konten berubah).
 * - DEV      : SW TIDAK didaftarkan; sisa registrasi & Cache Storage lama
 *              justru dibersihkan. Alasan: di dev, URL chunk Turbopack
 *              stabil padahal isinya berubah tiap rebuild — cache SWR bisa
 *              menyajikan JS LAMA untuk HTML SSR BARU → ID useId internal
 *              Radix (radix-_R_...) tidak sinkron → hydration mismatch.
 */
import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Dev: pastikan tidak ada SW/cache yang mengintervensi HMR & hydration.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const r of regs) void r.unregister();
        })
        .catch(() => {
          /* progressive enhancement — abaikan */
        });
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => {
            for (const k of keys) void caches.delete(k);
          })
          .catch(() => {
            /* abaikan */
          });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Saat ada SW baru menunggu, aktifkan segera agar update cepat.
          reg.addEventListener("updatefound", () => {
            const next = reg.installing;
            next?.addEventListener("statechange", () => {
              if (next.state === "installed" && navigator.serviceWorker.controller) {
                next.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch(() => {
          /* offline/PWA adalah progressive enhancement — abaikan kegagalan */
        });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
