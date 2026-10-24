"use client";

/**
 * Task 53 — Live Queue Engine: Papan Slot Pendaftaran REALTIME.
 *
 * Arsitektur:
 *  • Sumber kebenaran awal : GET /api/applications/live (snapshot publik, PDP-aman)
 *  • Pembaruan sesaat      : socket.io `io("/?XTransformPort=3003")` — event
 *    "registration:new" dipancarkan Registration Gateway saat POST pendaftaran
 *    berhasil. SEMUA pengunjung melihat slot menyala TANPA reload.
 *  • Fallback berlapis     : polling 20 dtk + refresh saat tab kembali aktif +
 *    event "muhdin:promo-refresh" (dipicu view setelah submit sukses).
 *
 * Privasi (PDP): papan hanya menampilkan nomor urut, jenis pendaftar & kota.
 * Tanpa nama organisasi / kontak / email.
 *
 * Hydration-safe: render SSR & client pertama identik (placeholder "—"),
 * data mengisi setelah fetch — pola gate yang sama dengan slot-counter.tsx.
 * Reduced-motion: framer-motion otomatis menghormati preferensi sistem.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { io, type Socket } from "socket.io-client";
import { apiGet } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

/* ---------- Tipe ---------- */

export type LiveSlot = {
  n: number;
  type: string;
  city: string;
  at: string;
  status: string;
};

export type LiveState = {
  sequence: number;
  total: number;
  waiting: number;
  filled: LiveSlot[];
  updatedAt: string;
};

const EMPTY_LIVE: LiveState = { sequence: 0, total: 0, waiting: 0, filled: [], updatedAt: "" };

const REFRESH_EVENT = "muhdin:promo-refresh"; // reuse: dipicu view setelah submit sukses
const QUEUE_KEY = "muhdin-queue-number"; // localStorage: nomor urut milik pengunjung
const QUEUE_EVENT = "muhdin:queue-set"; // dipicu view setelah submit sukses
const POLL_MS = 20_000; // fallback bila socket.io tak tersedia
const SLOT_WINDOW = 32; // jendela slot yang dirender
const SLOT_MIN = 24; // minimal sel agar papan tampak megah sejak hari pertama

/* ---------- Nomor urut milik pengunjung (localStorage → external store) ----------
 * useSyncExternalStore: bebas hydration mismatch (server snapshot = null),
 * reaktif terhadap event "muhdin:queue-set" & perubahan antar-tab (storage),
 * dan lolos aturan react-hooks/set-state-in-effect. */

function subscribeQueue(onChange: () => void) {
  window.addEventListener(QUEUE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(QUEUE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getQueueSnapshot(): number | null {
  try {
    const v = window.localStorage.getItem(QUEUE_KEY);
    return v ? Number(v) || null : null;
  } catch {
    return null;
  }
}

function getQueueServerSnapshot(): number | null {
  return null;
}

/* ---------- Angka per-locale (sama dengan slot-counter) ---------- */

function fmtNum(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "id-ID").format(n);
  } catch {
    return String(n);
  }
}

/* ---------- Waktu relatif (ticking) ---------- */

function useNow(intervalMs = 10_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(iv);
  }, [intervalMs]);
  return now;
}

function relativeTime(
  at: string,
  now: number,
  t: (k: string, v?: Record<string, string | number>) => string
): string {
  try {
    const diff = Math.max(0, now - new Date(at).getTime());
    const s = Math.floor(diff / 1000);
    if (s < 10) return t("liveReg.feedJustNow");
    if (s < 60) return t("liveReg.feedAgoSec", { n: s });
    const m = Math.floor(s / 60);
    if (m < 60) return t("liveReg.feedAgoMin", { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("liveReg.feedAgoHour", { n: h });
    const d = Math.floor(h / 24);
    return t("liveReg.feedAgoDay", { n: d });
  } catch {
    return t("liveReg.feedJustNow");
  }
}

/* ---------- Hook realtime ---------- */

export function useRegistrationLive() {
  const [data, setData] = useState<LiveState | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  /* Nomor urut milik pengunjung (disimpan view setelah submit sukses). */
  const myQueue = useSyncExternalStore(subscribeQueue, getQueueSnapshot, getQueueServerSnapshot);

  /** Snapshot otoritatif dari API (dipakai saat awal & fallback). */
  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<LiveState>("/api/applications/live");
      setData(res);
    } catch {
      /* jaringan gagal — biarkan nilai terakhir */
    }
  }, []);

  /* Snapshot awal + polling fallback + refresh visibility/event. */
  useEffect(() => {
    let alive = true;
    const safe = async () => {
      if (!alive) return;
      await refresh();
    };
    safe();
    const iv = window.setInterval(safe, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") safe();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(REFRESH_EVENT, safe);
    return () => {
      alive = false;
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(REFRESH_EVENT, safe);
    };
  }, [refresh]);

  /* Koneksi socket.io realtime — push sesaat dari gateway. */
  useEffect(() => {
    const socket = io("/?XTransformPort=3003", {
      path: "/",
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      timeout: 10_000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("sync"); // minta potongan kejadian terakhir bila ada
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("registration:new", (payload: Partial<LiveSlot> & { n?: number; total?: number }) => {
      const n = payload?.n;
      if (typeof n !== "number" || n <= 0) return;
      setData((prev) => {
        const base = prev ?? EMPTY_LIVE;
        if (base.filled.some((s) => s.n === n)) return base; // dedupe replay sync
        const slot: LiveSlot = {
          n,
          type: String(payload?.type ?? "-"),
          city: String(payload?.city ?? "-"),
          at: String(payload?.at ?? new Date().toISOString()),
          status: String(payload?.status ?? "PENDING"),
        };
        return {
          sequence: Math.max(base.sequence, slot.n),
          total: typeof payload?.total === "number" ? payload.total : base.total + 1,
          waiting: base.waiting + 1,
          filled: [...base.filled, slot].sort((a, b) => a.n - b.n),
          updatedAt: slot.at,
        };
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { data, connected, myQueue, refresh };
}

/* ---------- Titik LIVE ---------- */

function LiveDot({ connected }: { connected: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden>
      {connected && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", connected ? "bg-gold" : "bg-muted-foreground")} />
    </span>
  );
}

/* ---------- Sel slot ---------- */

function SlotCell({
  n,
  slot,
  isNext,
  isMine,
  locale,
}: {
  n: number;
  slot: LiveSlot | undefined;
  isNext: boolean;
  isMine: boolean;
  locale: string;
}) {
  const { t } = useT();
  const filled = !!slot;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      title={
        filled
          ? `${t("liveReg.slotFilled")} • ${slot.type} • ${slot.city}`
          : t("liveReg.slotFree")
      }
      aria-label={`${fmtNum(n, locale)} — ${filled ? t("liveReg.slotFilled") : t("liveReg.slotFree")}${filled ? `, ${slot.type}, ${slot.city}` : ""}${isMine ? `, ${t("liveReg.slotYou")}` : ""}`}
      className={cn(
        "relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition-colors sm:min-h-[64px]",
        filled
          ? "border-gold/60 bg-gradient-to-br from-gold/20 via-gold/10 to-transparent text-gold-deep shadow-[0_0_18px_-6px_oklch(0.72_0.135_85/0.5)] dark:text-gold"
          : "border-dashed border-border/80 text-muted-foreground/45",
        isNext && !filled && "border-solid ring-2 ring-gold/50",
        isMine && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {isMine && (
        <span className="absolute -top-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-primary px-1.5 py-px text-[8px] font-extrabold uppercase tracking-wider text-white shadow-sm">
          {t("liveReg.slotYou")}
        </span>
      )}
      <span className={cn("text-sm font-extrabold leading-none tabular-nums sm:text-base", !filled && "opacity-50")}>
        {fmtNum(n, locale)}
      </span>
      {filled ? (
        <span className="max-w-full truncate text-[9px] font-bold uppercase tracking-wider opacity-90 sm:text-[10px]">
          {slot.type}
        </span>
      ) : (
        <span className="text-[9px] font-semibold uppercase tracking-wider opacity-60 sm:text-[10px]">
          {isNext ? t("liveReg.nextSlotYours") : t("liveReg.slotFree")}
        </span>
      )}
      {filled && (
        <Icon name="check-circle-2" className="absolute end-1 top-1 h-3 w-3 text-primary/70" aria-hidden />
      )}
    </motion.div>
  );
}

/* ---------- Papan slot + feed ---------- */

export function LiveSlotBoardSection({ className }: { className?: string }) {
  const { t, locale } = useT();
  const { data, connected, myQueue } = useRegistrationLive();
  const now = useNow();

  const sequence = data?.sequence ?? 0;
  const filledMap = useMemo(() => {
    const m = new Map<number, LiveSlot>();
    for (const s of data?.filled ?? []) m.set(s.n, s);
    return m;
  }, [data?.filled]);

  const start = Math.max(1, sequence - (SLOT_WINDOW - 1));
  const end = Math.max(sequence, SLOT_MIN);
  const cells = useMemo(() => {
    const arr: number[] = [];
    for (let n = start; n <= end; n++) arr.push(n);
    return arr;
  }, [start, end]);

  const feed = useMemo(
    () => [...(data?.filled ?? [])].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
    [data?.filled]
  );

  return (
    <section className={cn("py-10 sm:py-14", className)} aria-labelledby="live-board-title">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">
                <LiveDot connected={connected} />
                {t("liveReg.boardEyebrow")}
              </p>
              <h2 id="live-board-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {t("liveReg.boardTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("liveReg.boardDesc")}</p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest",
                connected
                  ? "border-gold/50 bg-gold/10 text-gold-deep"
                  : "border-border bg-muted text-muted-foreground"
              )}
              aria-live="polite"
            >
              <LiveDot connected={connected} />
              {connected ? t("liveReg.connected") : t("liveReg.syncing")}
            </span>
          </div>

          {/* Statistik */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                {t("liveReg.totalLabel")}
              </p>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={data?.total ?? "load"}
                  initial={{ scale: 1.3, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="mt-1 text-3xl font-extrabold tabular-nums text-gold-deep dark:text-gold"
                  aria-live="polite"
                >
                  {data ? fmtNum(data.total, locale) : "—"}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                {t("liveReg.waitingLabel")}
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-foreground">
                {data ? fmtNum(data.waiting, locale) : "—"}
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border bg-card p-4 sm:col-span-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                {t("liveReg.nextSlot")}
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tabular-nums text-primary">
                  {data ? `#${fmtNum(sequence + 1, locale)}` : "—"}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">{t("liveReg.nextSlotYours")}</span>
              </p>
            </div>
          </div>

          {/* Papan */}
          <div className="mt-6 rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
            <div
              className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2.5 lg:grid-cols-8"
              role="list"
              aria-label={t("liveReg.boardTitle")}
            >
              {cells.map((n) => (
                <div role="listitem" key={n} className="contents">
                  <SlotCell
                    n={n}
                    slot={filledMap.get(n)}
                    isNext={n === sequence + 1}
                    isMine={myQueue === n}
                    locale={locale}
                  />
                </div>
              ))}
            </div>
            {start > 1 && (
              <p className="mt-3 text-center text-[11px] font-semibold text-muted-foreground">
                {t("liveReg.slotMore", { n: start - 1 })}
              </p>
            )}
            <p className="mt-4 flex items-start gap-1.5 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
              <Icon name="shield-check" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("liveReg.privacyNote")}
            </p>
          </div>

          {/* Feed */}
          <div className="mt-5 rounded-3xl border bg-card p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold-deep">
              <Icon name="activity" className="h-4 w-4" aria-hidden />
              {t("liveReg.feedTitle")}
            </h3>
            {feed.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("liveReg.feedEmpty")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                  {feed.map((s) => (
                    <motion.li
                      key={s.n}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-gold-deep dark:text-gold">
                        <Icon name="hash" className="h-3 w-3" aria-hidden />
                        {fmtNum(s.n, locale)}
                      </span>
                      <span className="font-semibold">{s.type}</span>
                      <span className="text-muted-foreground">• {s.city}</span>
                      <span className="ms-auto text-[11px] font-semibold text-muted-foreground">
                        {relativeTime(s.at, now, t)}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Kartu sukses dengan nomor urut + konfeti ---------- */

const CONFETTI_CSS = `
@keyframes mhd-confetti{0%{transform:translate3d(0,0,0) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translate3d(var(--dx),74px,0) rotate(240deg);opacity:0}}
.mhd-confetti-dot{position:absolute;top:6px;left:50%;width:8px;height:8px;border-radius:2px;animation:mhd-confetti 1.3s ease-out forwards}
@media (prefers-reduced-motion: reduce){.mhd-confetti-dot{animation:none;opacity:0}}
`;

const CONFETTI = [
  { dx: "-70px", c: "bg-gold", d: "0s" },
  { dx: "-42px", c: "bg-primary", d: "0.08s" },
  { dx: "-14px", c: "bg-gold-soft", d: "0.16s" },
  { dx: "14px", c: "bg-primary", d: "0.05s" },
  { dx: "42px", c: "bg-gold", d: "0.12s" },
  { dx: "70px", c: "bg-gold-soft", d: "0.2s" },
] as const;

/**
 * Kartu "Nomor Urut Anda" — ditampilkan di layar sukses daftar/join.
 * Hydration-safe: hanya dirender di layar sukses (client-only state).
 */
export function QueueSuccessCard({ queueNumber }: { queueNumber: number | null }) {
  const { t, locale } = useT();
  if (!queueNumber || queueNumber <= 0) return null;

  return (
    <div
      className="relative mx-auto mt-6 max-w-md overflow-visible rounded-2xl border border-gold/50 bg-gradient-to-b from-gold/15 via-gold/8 to-transparent p-5 text-center shadow-[0_0_50px_-16px_oklch(0.72_0.135_85/0.6)]"
      role="status"
      aria-label={t("liveReg.queueLabel")}
    >
      <style>{CONFETTI_CSS}</style>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-2">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={cn("mhd-confetti-dot", c.c)}
            style={{ "--dx": c.dx, animationDelay: c.d } as React.CSSProperties}
          />
        ))}
      </span>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
        {t("liveReg.queueLabel")}
      </p>
      <motion.p
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        className="mt-1 text-5xl font-extrabold tabular-nums text-gold-deep dark:text-gold sm:text-6xl"
        dir="ltr"
      >
        #{fmtNum(queueNumber, locale)}
      </motion.p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground/85">
        {t("liveReg.queueDesc", { n: queueNumber })}
      </p>
      <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">
        <Icon name="radio" className="h-3 w-3 motion-safe:animate-pulse" aria-hidden />
        {t("liveReg.queueLive")}
      </p>
    </div>
  );
}
