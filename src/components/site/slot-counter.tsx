"use client";

/**
 * Task 44 → Task 52 — SlotCounter: penghitung LIVE pendaftar GRATIS.
 *
 * PERCOBAAN PROMO "200 ANGGOTA PERTAMA" DIHAPUS (permintaan pendiri):
 * keanggotaan MUHDIN 100% gratis tanpa kuota, sehingga counter kelangkaan
 * ("sisa slot") diubah menjadi counter pertumbuhan — jumlah pendaftar yang
 * telah bergabung gratis (data sama: GET /api/promo/counter, kolom taken).
 *
 * Kenapa "live": poll tiap PROMO_SLOTS.pollMs + refresh saat tab kembali visible +
 * refresh INSTAN via event window "muhdin:promo-refresh" yang di-dispatch daftar-view /
 * join-view tepat setelah formulir sukses.
 *
 * Hydration-safe: render SSR dan render klien pertama SAMA (placeholder deterministik),
 * data baru mengisi setelah fetch — pola gate yang sama dengan LiveStripSection (Task 38).
 * Reduced-motion: framer-motion otomatis menghormati preferensi sistem.
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiGet } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { PROMO_SLOTS } from "@/lib/constants";
import { Icon } from "@/components/site/icon";
import { cn } from "@/lib/utils";

export type PromoCounterData = {
  total: number;
  taken: number;
  remaining: number;
  closed: boolean;
};

const REFRESH_EVENT = "muhdin:promo-refresh";

/** Dispatch dari view setelah pendaftaran sukses → seluruh counter refresh seketika. */
export function dispatchPromoRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}

/** Hook bersama: fetch + poll + visibility + event refresh. */
export function usePromoCounter(pollMs: number = PROMO_SLOTS.pollMs) {
  const [data, setData] = useState<PromoCounterData | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<PromoCounterData>("/api/promo/counter");
      setData(res);
    } catch {
      /* jaringan gagal — biarkan nilai terakhir tetap tampil */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const safeRefresh = async () => {
      if (!alive) return;
      await refresh();
    };
    safeRefresh();
    const iv = window.setInterval(safeRefresh, pollMs);
    const onVis = () => {
      if (document.visibilityState === "visible") safeRefresh();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(REFRESH_EVENT, safeRefresh);
    return () => {
      alive = false;
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(REFRESH_EVENT, safeRefresh);
    };
  }, [refresh, pollMs]);

  return data;
}

/** Angka per-locale: Indonesia memakai 1.234, Arab memakai ١٩٦ (ar-EG). */
function fmtNum(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "id-ID").format(n);
  } catch {
    return String(n);
  }
}

/** Titik "LIVE" berdenyut (reuse pola nus-live-dot). */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Varian PILL — untuk hero (di bawah highlighter lime, latar gelap)   */
/* ------------------------------------------------------------------ */
export function PromoSlotPill() {
  const { t, locale } = useT();
  const data = usePromoCounter();
  const taken = data?.taken ?? null;

  return (
    <p
      className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-gold/45 bg-forest-deep/60 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-gold-soft backdrop-blur-sm sm:text-sm"
      aria-live="polite"
      aria-label={t("nusHome.promo.aria")}
    >
      <LiveDot />
      <Icon name="user-plus" className="h-4 w-4 shrink-0 text-gold" aria-hidden />
      {taken === null ? (
        <span className="tabular-nums">{t("nusHome.promo.ofTotal")}</span>
      ) : (
        <span className="tabular-nums">
          {t("nusHome.promo.pill", { n: fmtNum(taken, locale) })}
        </span>
      )}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Varian CARD — untuk FreeSection: angka besar + progress bar + status */
/* ------------------------------------------------------------------ */
export function PromoSlotCard() {
  const { t, locale } = useT();
  const data = usePromoCounter();
  const taken = data?.taken ?? null;

  return (
    <div
      className="mx-auto mt-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-gold/50 bg-gradient-to-b from-gold/15 via-gold/10 to-transparent p-5 shadow-[0_0_40px_-14px_oklch(0.72_0.135_85/0.55)] sm:p-6"
      aria-live="polite"
      aria-label={t("nusHome.promo.aria")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-foreground">
          <LiveDot />
          {t("nusHome.promo.title")}
        </p>
        <span className="rounded-full bg-forest-deep px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest text-gold-soft">
          {t("nusHome.promo.freeBadge")}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-center gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={taken ?? "loading"}
            initial={{ scale: 1.25, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="text-5xl font-extrabold leading-none tracking-tight tabular-nums text-gold-deep dark:text-gold sm:text-6xl"
          >
            {taken === null ? "—" : fmtNum(taken, locale)}
          </motion.span>
        </AnimatePresence>
        <span className="pb-1 text-sm font-bold text-muted-foreground sm:text-base">
          {t("nusHome.promo.ofTotal")}
        </span>
      </div>

      <p className="mt-3 text-center text-xs font-bold text-muted-foreground sm:text-sm">
        {t("nusHome.promo.ready")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Varian LINE — strip tipis: strip membership + header form daftar    */
/* ------------------------------------------------------------------ */
export function PromoSlotLine({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { t, locale } = useT();
  const data = usePromoCounter();
  const taken = data?.taken ?? null;

  return (
    <p
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-2 text-xs font-bold",
        dark ? "text-emerald-50/90" : "text-foreground/80",
        className
      )}
      aria-live="polite"
      aria-label={t("nusHome.promo.aria")}
    >
      <LiveDot />
      <Icon name="user-plus" className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
      {taken === null ? (
        <span className="tabular-nums">{t("nusHome.promo.ofTotal")}</span>
      ) : (
        <span className="tabular-nums">
          {t("nusHome.promo.pill", { n: fmtNum(taken, locale) })}
        </span>
      )}
    </p>
  );
}
