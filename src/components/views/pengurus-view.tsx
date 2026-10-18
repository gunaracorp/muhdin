"use client";

/**
 * Task 37 — SUSUNAN PENGURUS MUHDIN (#/pengurus)
 *
 * Halaman struktur organisasi bergaya asosiasi internasional (IEEE/IATA-style):
 *  1. Hero banner + statistik jaringan (5 tokoh, 38 Bakorwil, 514 Bakorcab).
 *  2. "Dua Pilar Kepemimpinan" — kartu SPESIAL Ketua Umum & Sekretaris Jenderal
 *     (bingkai emas gradien, foto besar ber-ring emas, lencana peran).
 *  3. Dewan Pengayom — Pembina & Penasehat.
 *  4. Pengurus Pusat — BEMDUM + 6 bidang fungsional.
 *  5. Jaringan berjenjang: Pengurus Pusat → (Penunjukan) → Bakorwil Provinsi →
 *     Bakorcab Kab/Kota — mengikuti struktur resmi dari owner.
 *  6. CTA finale yang menyambung kampanye DAFTAR & IURAN GRATIS (Task 36).
 *
 * RTL aman (logical properties + text-center), dark mode via token, foto
 * opsional — monogram emas menjadi fallback elegan bila foto belum diunggah.
 */

import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import {
  PENGURUS_PERSON,
  PENGURUS_BIDANG,
  NET_COUNTS,
  type PengurusId,
  type PengurusPerson,
} from "@/lib/pengurus-data";
import { cn } from "@/lib/utils";

/** Buang gelar ber-titik lalu ambil inisial dua kata (nama pertama + terakhir). */
function monogram(name: string): string {
  const tokens = name
    .replace(/^(Hj?\.|Drs\.|Prof\.|Dr\.|Ir\.|KH\.|Tn\.|Ny\.)*\s*/gi, "")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !t.includes("."))
    .map((t) => t.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean);
  const first = tokens[0]?.charAt(0) ?? "?";
  const last = tokens.length > 1 ? tokens[tokens.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

/** Foto bulat ber-ring emas + lencana ikon; fallback monogram bila foto kosong. */
function PersonPhoto({
  person,
  size = "md",
}: {
  person: PengurusPerson;
  size?: "sm" | "md" | "lg";
}) {
  const dim = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-36 w-36 text-3xl sm:h-44 sm:w-44 sm:text-4xl",
  }[size];
  const badge = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" }[size];
  const badgeIcon = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }[size];

  return (
    <div className={cn("relative mx-auto shrink-0", dim)} data-testid={`photo-${person.id}`}>
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-forest ring-4 ring-gold/45 shadow-[0_16px_44px_-14px_rgba(212,175,55,0.55)]">
        {person.photo ? (
          <img
            src={person.photo}
            alt={`Foto ${person.name}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden className="font-extrabold tracking-wider text-white">
            {monogram(person.name)}
          </span>
        )}
      </div>
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-1 -end-1 grid place-items-center rounded-full border-2 border-background bg-gold text-forest-deep shadow-md",
          badge
        )}
      >
        <Icon name={person.icon} className={badgeIcon} />
      </span>
    </div>
  );
}

/** Konektor vertikal antar-tier bagan — garis emas + chip "Penunjukan" opsional. */
function Connector({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center" aria-hidden={label ? undefined : true}>
      <span className="h-5 w-px bg-gradient-to-b from-gold/70 to-border" />
      {label ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold text-gold-deep dark:text-gold">
          <Icon name="user-plus" className="h-3.5 w-3.5" />
          {label}
        </span>
      ) : null}
      <span className="h-5 w-px bg-gradient-to-b from-border to-gold/70" />
    </div>
  );
}

/* ============ 2 — Dua Pilar Kepemimpinan (KETUM & SEKJEN — SPESIAL) ============ */

function FeaturedLeader({ pid, delay }: { pid: "ketum" | "sekjen"; delay: number }) {
  const { t } = useT();
  const person = PENGURUS_PERSON[pid];
  return (
    <Reveal delay={delay} className="h-full">
      <article className="relative h-full rounded-[28px] bg-gradient-to-br from-gold via-gold/55 to-gold/20 p-[2px] shadow-[0_30px_80px_-32px_rgba(212,175,55,0.6)] transition-transform duration-300 hover:-translate-y-1">
        <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[26px] bg-card px-6 py-9 text-center sm:px-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-islamic-pattern-gold opacity-25" />
          <div aria-hidden className="pointer-events-none absolute -top-24 end-1/4 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />
          <PersonPhoto person={person} size="lg" />
          <span className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold-deep dark:text-gold">
            <Icon name={person.icon} className="h-3.5 w-3.5" aria-hidden />
            {t(`pengurus.role.${pid}`)}
          </span>
          <h3 className="relative mt-3.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {person.name}
          </h3>
          <span aria-hidden className="relative mt-3 h-px w-14 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="relative mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t(`pengurus.mandate.${pid}`)}
          </p>
        </div>
      </article>
    </Reveal>
  );
}

/* ============ 3 — Dewan Pengayom (Pembina & Penasehat) ============ */

function AdvisoryCard({ pid, delay }: { pid: "pembina" | "penasehat"; delay: number }) {
  const { t } = useT();
  const person = PENGURUS_PERSON[pid];
  return (
    <Reveal delay={delay} className="h-full">
      <article className="h-full rounded-3xl border border-primary/25 bg-card p-7 text-center shadow-sm transition-shadow hover:shadow-lg sm:p-8">
        <PersonPhoto person={person} size="md" />
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          <Icon name={person.icon} className="h-3.5 w-3.5" aria-hidden />
          {t(`pengurus.role.${pid}`)}
        </span>
        <h3 className="mt-3 text-lg font-extrabold leading-snug">{person.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t(`pengurus.mandate.${pid}`)}
        </p>
      </article>
    </Reveal>
  );
}

/* ============ 4 — Pengurus Pusat (BEMDUM + Bidang Fungsional) ============ */

function CentralLeaderCard() {
  const { t } = useT();
  const person = PENGURUS_PERSON.bemdum;
  return (
    <Reveal className="mx-auto max-w-md">
      <article className="relative overflow-hidden rounded-3xl border border-gold/35 bg-card p-7 text-center shadow-sm transition-shadow hover:shadow-lg sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-islamic-pattern-gold opacity-20" />
        <div className="relative">
          <PersonPhoto person={person} size="md" />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-gold/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-deep dark:text-gold">
            <Icon name={person.icon} className="h-3.5 w-3.5" aria-hidden />
            {t("pengurus.role.bemdum")}
          </span>
          <h3 className="mt-3 text-lg font-extrabold">{person.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("pengurus.mandate.bemdum")}
          </p>
        </div>
      </article>
    </Reveal>
  );
}

/* ============ 5 — Kartu tier jaringan (Bakorwil / Bakorcab) ============ */

function TierCard({
  variant,
  count,
  icon,
  title,
  full,
  desc,
}: {
  variant: "wil" | "cab";
  count: number;
  icon: string;
  title: string;
  full: string;
  desc: string;
}) {
  const isWil = variant === "wil";
  return (
    <Reveal className="mx-auto w-full max-w-xl">
      <article
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 p-6 text-center sm:p-7",
          isWil
            ? "border-primary/30 bg-gradient-to-br from-primary/[0.08] to-forest/[0.06] shadow-md"
            : "border-border bg-muted/40"
        )}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-start">
          <span
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-sm",
              isWil ? "bg-primary text-white" : "bg-foreground/10 text-foreground/60"
            )}
          >
            <Icon name={icon} className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
              <h3 className={cn("text-lg font-extrabold", isWil && "text-primary")}>{title}</h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
                  isWil ? "bg-primary text-white" : "bg-foreground/85 text-background"
                )}
                data-testid={`count-${variant}`}
              >
                {count}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {full}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">{desc}</p>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/* ================================ HALAMAN ================================ */

export function PengurusView() {
  const { t } = useT();
  const heroStats = [
    { icon: "users", value: "5", label: t("pengurus.statLeaders") },
    { icon: "map", value: String(NET_COUNTS.bakorwil), label: t("pengurus.statWil") },
    { icon: "building-2", value: String(NET_COUNTS.bakorcab), label: t("pengurus.statCab") },
  ];

  return (
    <div className="flex flex-col">
      {/* 1 — Hero banner */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div aria-hidden className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -end-16 h-72 w-72 rounded-full bg-gold/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("pengurus.eyebrow")}
            </span>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t("pengurus.title")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
              {t("pengurus.subtitle")}
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <ul className="mt-8 flex flex-wrap gap-3">
              {heroStats.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors hover:border-gold/40"
                >
                  <Icon name={s.icon} className="h-5 w-5 shrink-0 text-gold" />
                  <span className="text-2xl font-extrabold leading-none text-gold">{s.value}</span>
                  <span className="text-xs font-semibold text-emerald-100/80">{s.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 2 — Dua Pilar Kepemimpinan (Ketum & Sekjen — SPESIAL) */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("pengurus.featured.eyebrow")}
            title={t("pengurus.featured.title")}
            subtitle={t("pengurus.featured.desc")}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
            <FeaturedLeader pid="ketum" delay={0.05} />
            <FeaturedLeader pid="sekjen" delay={0.18} />
          </div>
        </div>
      </section>

      {/* 3 — Dewan Pengayom */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("pengurus.advisory.eyebrow")}
            title={t("pengurus.advisory.title")}
            subtitle={t("pengurus.advisory.desc")}
          />
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            <AdvisoryCard pid="pembina" delay={0.05} />
            <AdvisoryCard pid="penasehat" delay={0.15} />
          </div>
        </div>
      </section>

      {/* 4 — Pengurus Pusat */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("pengurus.central.eyebrow")}
            title={t("pengurus.central.title")}
            subtitle={t("pengurus.central.desc")}
          />
          <div className="mt-10">
            <CentralLeaderCard />
          </div>
          <Reveal delay={0.1} className="mt-12">
            <h3 className="text-center text-lg font-extrabold">
              {t("pengurus.central.bidangTitle")}
            </h3>
            <p className="mx-auto mt-1.5 max-w-xl text-center text-sm text-muted-foreground">
              {t("pengurus.central.bidangDesc")}
            </p>
            <ul className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {PENGURUS_BIDANG.map((b, i) => (
                <Reveal key={b.id} delay={0.06 * i}>
                  <li className="flex h-full items-center gap-3.5 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={b.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold leading-snug">
                      {t(`pengurus.bidang.${b.id}`)}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 5 — Jaringan berjenjang: PP → Penunjukan → Bakorwil → Bakorcab */}
      <section className="bg-mint/30 py-16 dark:bg-muted/30 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("pengurus.net.eyebrow")}
            title={t("pengurus.net.title")}
            subtitle={t("pengurus.net.desc")}
          />
          <div className="mt-10 flex flex-col items-center">
            {/* Pengurus Pusat (ringkas) */}
            <Reveal className="w-full max-w-xl">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep p-6 text-center text-white shadow-md sm:p-7">
                <div aria-hidden className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
                <div className="relative">
                  <Icon name="landmark" className="mx-auto h-6 w-6 text-gold" />
                  <p className="mt-2 text-lg font-extrabold tracking-wide">
                    {t("pengurus.central.title")}
                  </p>
                  <p className="text-xs text-emerald-50/80">{t("pengurus.net.ppFull")}</p>
                </div>
              </div>
            </Reveal>
            <Connector label={t("pengurus.central.appoint")} />
            <TierCard
              variant="wil"
              count={NET_COUNTS.bakorwil}
              icon="network"
              title={t("pengurus.net.wilTitle")}
              full={t("pengurus.net.wilFull")}
              desc={t("pengurus.net.wilDesc")}
            />
            <Connector />
            <TierCard
              variant="cab"
              count={NET_COUNTS.bakorcab}
              icon="building-2"
              title={t("pengurus.net.cabTitle")}
              full={t("pengurus.net.cabFull")}
              desc={t("pengurus.net.cabDesc")}
            />
            <Reveal delay={0.1} className="mt-8">
              <p className="flex max-w-lg items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
                <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" />
                <span>{t("pengurus.net.note")}</span>
              </p>
              <div className="mt-5 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("gabung")}
                  className="border-gold/50 text-gold-deep hover:bg-gold/10 dark:text-gold"
                >
                  <Icon name="user-plus" className="me-2 h-4 w-4" />
                  {t("pengurus.net.joinWil")}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6 — CTA finale (menyambung kampanye DAFTAR & IURAN GRATIS) */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-forest-deep p-8 text-center text-white sm:p-12">
              <div aria-hidden className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -start-16 h-64 w-64 rounded-full bg-gold/15 blur-3xl"
              />
              <div className="relative">
                <Icon name="handshake" className="mx-auto h-8 w-8 text-gold" />
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {t("pengurus.cta.title")}
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                  {t("pengurus.cta.desc")}
                </p>
                <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-gold sm:text-sm">
                  <Icon name="check-circle-2" className="h-4 w-4 shrink-0" aria-hidden />
                  {t("pengurus.cta.free")}
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    onClick={() => navigate("daftar")}
                    className="w-full bg-gold text-forest-deep font-bold shadow-md hover:bg-gold/90 sm:w-auto"
                  >
                    {t("pengurus.cta.btn")}
                    <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("kontak")}
                    className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    <Icon name="mail" className="me-2 h-4 w-4" />
                    {t("pengurus.cta.contact")}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
