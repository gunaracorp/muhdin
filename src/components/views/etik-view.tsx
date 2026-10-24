"use client";

/**
 * Task 5-b-2 — EtikView: Kode Etik & Papan Sanksi Publik (route #/etik).
 *
 * Struktur (shell bersama p0-shared: TrustHero/TrustSection/TrustCallout/TrustSteps):
 *  1. Hero (eyebrow "INTEGRITAS INDUSTRI").
 *  2. Enam Prinsip Kode Etik — grid 3×2 kartu berikon.
 *  3. Alur Penegakan — TrustSteps 4 tahap.
 *  4. Jenis Sanksi — 3 kartu tingkat (teguran / suspend / pencabutan).
 *  5. Papan Sanksi Publik — LIVE apiGet /api/members?status=SUSPENDED
 *     (skeleton → error+retry → empty callout → kartu merah; TANPA kontak/PDP).
 *  6. Laporkan Pelanggaran — callout danger + 2 aksi (portal & mailto).
 *  7. Callout gold prinsip praduga-tak-bersalah + pemulihan.
 *  8. CTA verifikasi & transparansi.
 *
 * RTL-aman (ms/me/icon-flip), dark-mode-aman (token tema), mobile-first.
 */
import { useEffect, useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { TrustHero, TrustSection, TrustCallout, TrustSteps } from "@/components/views/p0-shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

/* ---------- tipe & daftar item (pola ITEMS + t(ns.x.key)) ---------- */

/** Bentuk minimum baris /api/members (publik). TIDAK menampilkan phone/email (PDP). */
type Member = {
  name?: string;
  licenseNo?: string;
  city?: string;
  province?: string;
  status?: string;
};

const PRINSIP = [
  { key: "honesty", icon: "scale" },
  { key: "contract", icon: "file-check" },
  { key: "funds", icon: "shield-check" },
  { key: "service", icon: "badge-check" },
  { key: "privacy", icon: "lock" },
  { key: "cooperation", icon: "handshake" },
] as const;

const ALUR = [
  { key: "report", icon: "inbox" },
  { key: "investigate", icon: "search" },
  { key: "trial", icon: "gavel" },
  { key: "sanction", icon: "megaphone" },
] as const;

const SANKSI = [
  { key: "teguran", icon: "file-check" },
  { key: "suspend", icon: "shield-alert" },
  { key: "cabut", icon: "ban" },
] as const;

/* --------------------- LIVE: papan sanksi publik --------------------- */

function SanctionsBoard() {
  const { t } = useT();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    apiGet<Member[]>("/api/members?status=SUSPENDED")
      .then((rows) => {
        if (!alive) return;
        setMembers(Array.isArray(rows) ? rows : []);
        setError(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  if (error)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <Icon name="siren" className="mx-auto h-8 w-8 text-destructive/70" aria-hidden />
        <p className="mt-3 text-sm font-bold">{t("etik.papan.error")}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 rounded-full font-bold"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          <Icon name="refresh" className="me-1.5 h-3.5 w-3.5" aria-hidden />
          {t("etik.papan.retry")}
        </Button>
      </div>
    );

  if (!members)
    return (
      <div aria-busy="true" aria-label={t("etik.papan.loading")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-4">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-2.5 h-3 w-1/2" />
            <Skeleton className="mt-3 h-3 w-1/3" />
          </div>
        ))}
      </div>
    );

  if (members.length === 0)
    return <TrustCallout tone="success" icon="check-circle-2">{t("etik.papan.empty")}</TrustCallout>;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m, i) => (
        <li
          key={m.licenseNo ?? i}
          className="rounded-2xl border border-red-500/40 bg-red-500/5 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-foreground">{m.name || "—"}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {t("etik.papan.license")}: {m.licenseNo || "—"}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400">
              {t("etik.sanksi.items.suspend.badge")}
            </span>
          </div>
          {(m.city || m.province) && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{[m.city, m.province].filter(Boolean).join(" · ")}</span>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------- VIEW ------------------------------- */

export function EtikView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("etik.hero.eyebrow")}
        title={t("etik.hero.title")}
        subtitle={t("etik.hero.subtitle")}
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-12 sm:px-6">
        {/* 1. ENAM PRINSIP KODE ETIK */}
        <TrustSection icon="scroll-text" title={t("etik.prinsip.title")} desc={t("etik.prinsip.desc")}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRINSIP.map((p) => (
              <li key={p.key} className="rounded-xl border bg-card p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={p.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                </span>
                <p className="mt-2.5 text-sm font-extrabold leading-snug">
                  {t(`etik.prinsip.items.${p.key}.t`)}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {t(`etik.prinsip.items.${p.key}.d`)}
                </p>
              </li>
            ))}
          </ul>
        </TrustSection>

        {/* 2. ALUR PENEGAKAN */}
        <TrustSection icon="workflow" title={t("etik.alur.title")} desc={t("etik.alur.desc")}>
          <TrustSteps
            items={ALUR.map((s) => ({
              icon: s.icon,
              title: t(`etik.alur.steps.${s.key}.t`),
              desc: t(`etik.alur.steps.${s.key}.d`),
            }))}
          />
        </TrustSection>

        {/* 3. JENIS SANKSI */}
        <TrustSection icon="gavel" title={t("etik.sanksi.title")} desc={t("etik.sanksi.desc")}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SANKSI.map((s) => (
              <li key={s.key} className="flex flex-col rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-deep">
                    <Icon name={s.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                  </span>
                  {s.key === "suspend" && (
                    <span className="rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400">
                      {t("etik.sanksi.items.suspend.badge")}
                    </span>
                  )}
                </div>
                <p className="mt-2.5 text-sm font-extrabold leading-snug">
                  {t(`etik.sanksi.items.${s.key}.t`)}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {t(`etik.sanksi.items.${s.key}.d`)}
                </p>
              </li>
            ))}
          </ul>
        </TrustSection>

        {/* 4. PAPAN SANKSI PUBLIK (LIVE) */}
        <TrustSection icon="megaphone" title={t("etik.papan.title")} desc={t("etik.papan.desc")}>
          <SanctionsBoard />
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t("etik.papan.note")}
          </p>
        </TrustSection>

        {/* 5. LAPORKAN PELANGGARAN */}
        <TrustSection icon="message-square" title={t("etik.lapor.title")} desc={t("etik.lapor.desc")}>
          <TrustCallout tone="danger" icon="siren">
            <ul className="mt-1 space-y-1.5">
              <li className="flex items-start gap-2">
                <Icon name="eye-off" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {t("etik.lapor.pointIdentity")}
              </li>
              <li className="flex items-start gap-2">
                <Icon name="alert-triangle" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {t("etik.lapor.pointDefamation")}
              </li>
            </ul>
          </TrustCallout>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate("lapor")} className="rounded-full px-5 font-bold">
              {t("etik.lapor.cta")}
              <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
            </Button>
            <a
              href="mailto:etik@muhdin.web.id"
              className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-transparent px-5 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <Icon name="mail" className="h-4 w-4" aria-hidden />
              etik@muhdin.web.id
            </a>
          </div>
        </TrustSection>

        {/* 6. PRINSIP PRADUGA TAK BERSALAH + PEMULIHAN (gold) */}
        <TrustCallout tone="gold" icon="info">
          <p>{t("etik.presumption")}</p>
          <p className="mt-1">{t("etik.recovery")}</p>
        </TrustCallout>

        {/* 7. CTA */}
        <Reveal delay={0.08} className="pt-2">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate("verifikasi")} className="rounded-full px-6 font-bold">
              {t("etik.cta.verify")}
              <Icon name="badge-check" className="ms-1.5 h-4 w-4" aria-hidden />
            </Button>
            <Button variant="outline" onClick={() => navigate("transparansi")} className="rounded-full px-6 font-bold">
              {t("etik.cta.transparency")}
              <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
