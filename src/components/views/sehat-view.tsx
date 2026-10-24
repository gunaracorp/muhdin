"use client";

/**
 * Task 5-c — SehatView: Pusat Kesehatan Jamaah (route #/sehat).
 * Vaksinasi pra-keberangkatan (4 kartu + CTA layanan), KKH Tanah Suci
 * (institusional — tanpa alamat palsu), kesiapan pribadi (6 checklist),
 * asuransi & jaminan perjalanan, disclaimer edukasi, CTA darurat/vaksin.
 */
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { TrustHero, TrustSection, TrustCallout } from "@/components/views/p0-shared";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/* ---------- daftar item (pola ITEMS + t(ns.x.key)) ---------- */

const VAX = [
  { icon: "syringe", key: "meningitis", badge: "wajib", slug: "layanan/vaksin-meningitis" },
  { icon: "shield-check", key: "flu", badge: "anjuran", slug: "layanan/vaksin-flu" },
  { icon: "shield-ellipsis", key: "polio", badge: "ketentuan", slug: "layanan/vaksin-polio" },
  { icon: "heart-pulse", key: "covid", badge: "terkini", slug: "" },
] as const;

const KKH = [
  { key: "jeddah" },
  { key: "makkah" },
  { key: "madinah" },
] as const;

const KKH_SERVICES = ["umum", "rujuk", "assist"] as const;

const READY = [
  { icon: "pill", key: "meds" },
  { icon: "info", key: "narcotics" },
  { icon: "sun", key: "hydration" },
  { icon: "heart-pulse", key: "fitness" },
  { icon: "clipboard-check", key: "chronic" },
  { icon: "wallet", key: "finances" },
] as const;

const INSURANCE_COVER = ["inpatient", "repatriation", "accident"] as const;

/* --------------------------------- VIEW --------------------------------- */

export function SehatView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("sehat.hero.eyebrow")}
        title={t("sehat.hero.title")}
        subtitle={t("sehat.hero.subtitle")}
      />

      <section aria-label={t("sehat.hero.title")} className="py-12">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          {/* Vaksinasi Sebelum Keberangkatan */}
          <div>
            <SectionHeading
              eyebrow="💉"
              title={t("sehat.vax.title")}
              subtitle={t("sehat.vax.desc")}
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {VAX.map((v, i) => (
                <Reveal key={v.key} delay={Math.min(i * 0.05, 0.2)}>
                  <li className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon name={v.icon} className="h-5 w-5" aria-hidden />
                      </span>
                      <span
                        className={
                          v.badge === "wajib"
                            ? "rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
                            : "rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gold-deep"
                        }
                      >
                        {t(`sehat.vax.badge.${v.badge}`)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-extrabold leading-snug">
                      {t(`sehat.vax.items.${v.key}.t`)}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {t(`sehat.vax.items.${v.key}.d`)}
                    </p>
                    {v.slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(v.slug)}
                        className="mt-auto w-fit rounded-full px-4 text-xs font-bold"
                      >
                        {t("sehat.vax.cta")}
                        <Icon name="arrow-right" className="ms-1.5 h-3.5 w-3.5 icon-flip" aria-hidden />
                      </Button>
                    )}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* KKH di Tanah Suci — institusional, tanpa alamat palsu */}
          <TrustSection
            icon="stethoscope"
            title={t("sehat.kkh.title")}
            desc={t("sehat.kkh.desc")}
          >
            <ul className="grid gap-3 sm:grid-cols-3">
              {KKH.map((k) => (
                <li key={k.key} className="rounded-xl border bg-background/40 p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold-deep">
                    <Icon name="stethoscope" className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                  </span>
                  <p className="mt-2.5 text-sm font-extrabold leading-snug">
                    {t(`sehat.kkh.items.${k.key}.t`)}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {t(`sehat.kkh.items.${k.key}.d`)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border bg-background/40 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                {t("sehat.kkh.servicesLabel")}
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
                {KKH_SERVICES.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-foreground/85">
                    <Icon name="check-circle-2" className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {t(`sehat.kkh.services.${s}`)}
                  </li>
                ))}
              </ul>
            </div>
            <TrustCallout tone="amber" icon="info">
              {t("sehat.kkh.note")}
            </TrustCallout>
          </TrustSection>

          {/* Kesiapan Pribadi — checklist 6 */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="Checklist"
              title={t("sehat.ready.title")}
              subtitle={t("sehat.ready.desc")}
            />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {READY.map((r, i) => (
                <Reveal key={r.key} delay={Math.min(i * 0.05, 0.25)}>
                  <li className="flex h-full items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon name={r.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold leading-snug">
                        {t(`sehat.ready.items.${r.key}.t`)}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {t(`sehat.ready.items.${r.key}.d`)}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* Asuransi & Jaminan Perjalanan */}
          <TrustSection
            icon="file-check"
            title={t("sehat.insurance.title")}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="min-w-0">
                <p className="font-extrabold leading-snug">{t("sehat.insurance.cardTitle")}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t("sehat.insurance.cardDesc")}
                </p>
                <ul className="mt-3 space-y-2">
                  {INSURANCE_COVER.map((c) => (
                    <li
                      key={c}
                      className="flex items-start gap-2.5 rounded-xl border bg-background/40 p-3 text-sm text-foreground/85"
                    >
                      <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {t(`sehat.insurance.cover.${c}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <TrustCallout tone="gold" icon="shield-check">
                {t("sehat.insurance.tjh")}
              </TrustCallout>
            </div>
          </TrustSection>

          {/* Disclaimer edukasi */}
          <TrustCallout tone="amber" icon="alert-triangle">
            {t("sehat.disclaimer.text")}
          </TrustCallout>

          {/* CTA bawah */}
          <Reveal delay={0.08} className="pt-2">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate("darurat")}
                className="h-11 w-full rounded-full bg-gradient-to-r from-primary to-forest px-8 font-bold text-white sm:w-auto"
              >
                <Icon name="siren" className="me-2 h-4 w-4" aria-hidden />
                {t("sehat.cta.emergency")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("layanan/vaksin-meningitis")}
                className="h-11 w-full rounded-full px-8 font-bold sm:w-auto"
              >
                <Icon name="syringe" className="me-2 h-4 w-4" aria-hidden />
                {t("sehat.cta.vaksin")}
                <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
