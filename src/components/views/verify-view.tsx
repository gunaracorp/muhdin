"use client";

/**
 * Task 33-c — VerifyView: halaman verifikasi publik (route #/verifikasi/[query]).
 *
 * PRIVASI KERAS (ROLE 21): hanya field aman yang dirender — name, type, city,
 * province, licenseNo (sebagai ID), website, status, dan tanggal. Field lain
 * (phone, email, rating, deskripsi) sengaja TIDAK dideklarasikan di tipe lokal.
 *
 * LEGAL (ROLE 25): panel disclaimer wajib di bawah hasil — teks PERSIS dari
 * VERIFIED_DISCLAIMER_ID (src/lib/nusantara.ts) via namespace import agar
 * compile tetap aman jika konstanta belum didaftarkan; fallback kamus i18n.
 */
import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { motion, useReducedMotion } from "framer-motion";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, formatDateL10n, formatNumberL10n } from "@/lib/i18n";
import * as Nusantara from "@/lib/nusantara";
import { cn } from "@/lib/utils";

/* Whitelist field publik — jangan tambah phone/email/rating/description. */
type VerifyMember = {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  licenseNo: string;
  website: string | null;
  status: string;
  memberSince: number;
  updatedAt: string | null;
};

type VerifyResponse = {
  query: string;
  found: boolean;
  warning: string | null;
  results: VerifyMember[];
};

const { VERIFY_STATUSES } = Nusantara;

/** Konstanta disclaimer resmi (ROLE 25) — sumber kebenaran: nusantara.ts. */
const LEGAL_CONST = Nusantara as unknown as { VERIFIED_DISCLAIMER_ID?: string };

/** tone VERIFY_STATUSES → kelas Tailwind (tanpa indigo/biru). */
const TONE_CLS: Record<string, string> = {
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  gold: "bg-gold/15 text-gold-deep dark:text-gold-soft border-gold/50",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
  red: "bg-destructive/10 text-destructive border-destructive/40",
  slate: "bg-muted text-muted-foreground border-border",
};

const TONE_ICON: Record<string, string> = {
  green: "badge-check",
  gold: "award",
  amber: "clock",
  red: "ban",
  slate: "info",
};

function statusMeta(status: string): { label: string; tone: string } {
  return VERIFY_STATUSES[status] ?? { label: status, tone: "slate" };
}

/** Label tipe organisasi: pakai kamus members.type.* bila ada, fallback kode mentah. */
function typeLabel(ty: string, t: (k: string) => string): string {
  const val = t(`members.type.${ty}`);
  return val === `members.type.${ty}` ? ty : val;
}

/* ---------- Badge status besar ---------- */
function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const meta = statusMeta(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 gap-1.5 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide",
        TONE_CLS[meta.tone] ?? TONE_CLS.slate
      )}
      aria-label={t("nusTrust.verify.statusAria", { label: meta.label })}
    >
      <Icon name={TONE_ICON[meta.tone] ?? "info"} className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </Badge>
  );
}

/* ---------- Badge animasi: cincin pulse + shield + centang stroke-draw ---------- */
function VerifiedMark() {
  const { t } = useT();
  const reduce = useReducedMotion();
  return (
    <span
      role="img"
      aria-label={t("nusTrust.official.badgeAria")}
      className="relative grid h-14 w-14 shrink-0 place-items-center"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping motion-reduce:animate-none"
      />
      <span aria-hidden className="absolute inset-0 rounded-full bg-emerald-500/15" />
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white shadow-lg">
        <Icon name="shield-check" className="h-5 w-5" aria-hidden />
      </span>
      <motion.svg
        viewBox="0 0 24 24"
        aria-hidden
        className="absolute -end-1.5 -top-1.5 h-6 w-6 text-emerald-600 dark:text-emerald-400"
      >
        <motion.path
          d="M20 6 9 17l-5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 0.55, delay: 0.35, ease: "easeOut" }}
        />
      </motion.svg>
    </span>
  );
}

/* ---------- Panel VERIFIKASI RESMI (hanya status VERIFIED/TERVERIFIKASI) ---------- */
function OfficialPanel({ m }: { m: VerifyMember }) {
  const { t, locale } = useT();
  const qrValue =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/#/verifikasi/${encodeURIComponent(m.licenseNo)}`;

  return (
    <section
      aria-label={t("nusTrust.official.title")}
      className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <header className="flex flex-wrap items-center gap-3">
        <VerifiedMark />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            {t("nusTrust.official.title")}
          </p>
          {m.updatedAt && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("nusTrust.verify.verifiedOn", { date: formatDateL10n(m.updatedAt, locale) })}
            </p>
          )}
        </div>
        <StatusBadge status={m.status} />
      </header>

      <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
        {qrValue && (
          <figure className="mx-auto w-fit rounded-xl border bg-white p-3 shadow-sm">
            <QRCode
              value={qrValue}
              size={128}
              bgColor="#ffffff"
              fgColor="#1a2e25"
              role="img"
              aria-label={t("nusTrust.official.qrAria")}
            />
            <figcaption className="mt-2 max-w-[8.5rem] text-center text-[11px] leading-snug text-neutral-600">
              {t("nusTrust.official.qrCaption")}
            </figcaption>
          </figure>
        )}

        <div className="min-w-0 space-y-4">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("nusTrust.official.verifyIdLabel")}
            </span>
            <span className="font-mono text-base font-extrabold text-foreground" dir="ltr">
              {m.licenseNo}
            </span>
          </p>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {t("nusTrust.official.docsTitle")}
            </h4>
            <ul className="mt-2 space-y-1.5">
              {["doc1", "doc2", "doc3", "doc4"].map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-foreground/80">
                  <Icon name="file-text" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                  {t(`nusTrust.official.${k}`)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] italic leading-relaxed text-muted-foreground">
              {t("nusTrust.official.docsNote")}
            </p>
          </div>

          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Icon name="calendar" className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("nusTrust.official.nextReview", { year: formatNumberL10n(m.memberSince + 1, locale) })}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Kartu hasil per anggota ---------- */
function MemberCard({ m, index }: { m: VerifyMember; index: number }) {
  const { t } = useT();
  const isVerified = m.status === "VERIFIED" || m.status === "TERVERIFIKASI";
  let host = "";
  if (m.website) {
    try {
      host = new URL(m.website.startsWith("http") ? m.website : `https://${m.website}`).hostname;
    } catch {
      host = m.website;
    }
  }

  return (
    <Reveal delay={Math.min(index * 0.06, 0.36)}>
      <article className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-forest font-extrabold text-gold-soft">
              {m.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-extrabold leading-snug">{m.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {typeLabel(m.type, t)} · {t("nusTrust.verify.located", { city: m.city, province: m.province })}
              </p>
            </div>
          </div>
          <StatusBadge status={m.status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Icon name="keyround" className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span>{t("nusTrust.official.verifyIdLabel")}:</span>
            <span className="font-mono font-bold text-foreground/80" dir="ltr">
              {m.licenseNo}
            </span>
          </span>
          {m.website && host && (
            <a
              href={m.website.startsWith("http") ? m.website : `https://${m.website}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("nusTrust.verify.websiteAria")}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <Icon name="globe" className="h-3.5 w-3.5" aria-hidden />
              {host}
              <Icon name="external-link" className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>

        {isVerified && <OfficialPanel m={m} />}
      </article>
    </Reveal>
  );
}

/* ---------- View utama ---------- */
export function VerifyView({ query }: { query?: string }) {
  const { t, locale } = useT();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState("");

  const runSearch = useCallback(
    async (raw: string) => {
      const term = raw.trim();
      setError("");
      setResult(null);
      if (term.length < 3) {
        setError(t("nusTrust.verify.minChars"));
        return;
      }
      setLoading(true);
      try {
        const res = await apiGet<VerifyResponse>(
          `/api/members/verify?q=${encodeURIComponent(term)}&locale=${locale}`
        );
        setResult(res);
      } catch (e) {
        setError((e as Error).message || t("nusTrust.verify.error"));
      } finally {
        setLoading(false);
      }
    },
    [t, locale]
  );

  // Deep-link #/verifikasi/[query] → cari langsung saat mount.
  useEffect(() => {
    if (query && query.trim()) {
      setQ(decodeURIComponent(query));
      void runSearch(query);
    }
  }, [query, runSearch]);

  const disclaimer = LEGAL_CONST.VERIFIED_DISCLAIMER_ID || t("nusTrust.disclaimer.fallback");
  const foundList = result?.found ? result.results.slice(0, 10) : [];

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section aria-label={t("nusTrust.verify.title")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {t("nusTrust.verify.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("nusTrust.verify.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("nusTrust.verify.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section aria-label={t("nusTrust.verify.searchLabel")} className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* KOTAK PENCARIAN */}
          <Reveal>
            <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!loading) void runSearch(q);
                }}
                noValidate
              >
                <div className="relative flex-1">
                  <Icon
                    name="shield-check"
                    className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                    aria-hidden
                  />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("nusTrust.verify.searchPlaceholder")}
                    aria-label={t("nusTrust.verify.searchAria")}
                    aria-invalid={!!error}
                    className="h-11 ps-9"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 bg-gradient-to-r from-primary to-forest px-6 text-white shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <Icon name="loader-2" className="me-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  ) : (
                    <Icon name="search" className="me-2 h-4 w-4" aria-hidden />
                  )}
                  {t("nusTrust.verify.searchButton")}
                </Button>
              </form>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("nusTrust.verify.searchHelp")}</p>
              {error && (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                  <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                  {error}
                </p>
              )}
            </div>
          </Reveal>

          {/* LOADING */}
          {loading && (
            <div className="mt-6 space-y-4" role="status" aria-label={t("nusTrust.verify.searching")}>
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          )}

          {/* HASIL */}
          {!loading && result && (
            <div className="mt-6" role="status">
              {result.warning && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold text-destructive"
                >
                  <Icon name="shield-alert" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {result.warning}
                </div>
              )}

              {result.found ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-extrabold">{t("nusTrust.verify.resultsTitle")}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t("nusTrust.verify.resultsCount", { n: formatNumberL10n(foundList.length, locale) })}
                      {" · "}
                      {t("nusTrust.verify.resultsFor", { query: result.query })}
                    </p>
                  </div>
                  {foundList.map((m, i) => (
                    <MemberCard key={m.id} m={m} index={i} />
                  ))}
                </div>
              ) : (
                /* EMPTY STATE */
                <Reveal>
                  <div className="rounded-2xl border bg-muted/40 p-10 text-center">
                    <Icon name="search" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                    <h2 className="mt-3 font-extrabold">{t("nusTrust.empty.title")}</h2>
                    <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{t("nusTrust.empty.desc")}</p>
                    <Button
                      onClick={() => navigate("daftar")}
                      className="mt-5 bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
                    >
                      <Icon name="user-plus" className="me-1.5 h-4 w-4" aria-hidden />
                      {t("nusTrust.empty.cta")}
                      <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
                    </Button>
                  </div>
                </Reveal>
              )}
            </div>
          )}

          {/* DISCLAIMER WAJIB (ROLE 25) — teks PERSIS dari VERIFIED_DISCLAIMER_ID */}
          <Reveal delay={0.08} className="mt-8">
            <aside
              aria-label={t("nusTrust.disclaimer.title")}
              className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5"
            >
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                {t("nusTrust.disclaimer.title")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">{disclaimer}</p>
            </aside>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
