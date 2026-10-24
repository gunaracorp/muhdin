"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BRAND,
  CORE_VALUES,
  PARTNERS,
  KPI_ROWS,
  TECH_PILLARS,
  REVENUE_SOURCES,
  STAKEHOLDER_GROUPS,
} from "@/lib/constants";
import { BranchesSection } from "@/components/site/branches-section";
import { useT } from "@/lib/i18n";
import type { ManagementMember, Roadmap, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Inisial nama — buang seluruh gelar di depan (Prof., Dr., KH., H., …). */
function personInitial(name: string): string {
  const clean = name
    .replace(/^(Hj?\.|Drs\.|Prof\.|Dr\.|Ir\.|KH\.|Tn\.|Ny\.)*\s*/gi, "")
    .trim();
  return clean.charAt(0).toUpperCase() || "?";
}

export function AboutView() {
  const { t, locale } = useT();
  const [management, setManagement] = useState<ManagementMember[] | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap[] | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<ManagementMember[]>(`/api/management?locale=${locale}`),
      apiGet<Roadmap[]>(`/api/roadmap?locale=${locale}`),
      apiGet<SiteSettings>(`/api/settings?locale=${locale}`),
    ])
      .then(([management, roadmap, settings]) => ({ management, roadmap, settings }))
      .then((d) => {
        setManagement(d.management);
        setRoadmap(d.roadmap);
        setSettings(d.settings);
      })
      .catch(() => {
        setManagement([]);
        setRoadmap([]);
        setSettings({});
      });
  }, [locale]);

  return (
    <div className="flex flex-col">
      {/* Banner */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("about.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("about.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("about.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      {/* Visi Misi */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-8">
          <Reveal>
            <div className="h-full rounded-3xl border bg-gradient-to-br from-forest to-forest-deep p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
              <div className="relative">
                <Icon name="target" className="h-8 w-8 text-gold" />
                <h2 className="mt-4 text-2xl font-extrabold">{t("about.visionTitle")}</h2>
                <p className="mt-3 text-emerald-50/90 leading-relaxed">
                  {settings?.vision || t("about.visionFallback")}
                </p>
                <p className="mt-6 font-arabic text-2xl text-gold" dir="rtl">{BRAND.arabic}</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl border bg-card p-8 shadow-sm">
              <Icon name="compass" className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-2xl font-extrabold">{t("about.missionTitle")}</h2>
              <ol className="mt-3 space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground/80">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">
                      {i + 1}
                    </span>
                    {t(`about.missions.m${i + 1}`)}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Warisan Sejarah — PHI · IPHI · Blueprint · MUHDIN (Task 29) */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("about.heritage.eyebrow")}
            title={t("about.heritage.title")}
            subtitle={t("about.heritage.subtitle")}
          />
          <div className="relative mt-10">
            {/* Garis penghubung era (desktop) */}
            <span aria-hidden className="hidden lg:block absolute top-1/2 start-8 end-8 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            <div className="relative grid gap-4 lg:grid-cols-3">
              {[
                { k: "era1", icon: "scroll-text" },
                { k: "era2", icon: "file-text" },
                { k: "era3", icon: "sparkles", hero: true },
              ].map((era, i) => (
                <Reveal key={era.k} delay={i * 0.1}>
                  <div
                    className={cn(
                      "relative h-full rounded-2xl border p-6 shadow-sm text-center transition-shadow hover:shadow-lg",
                      era.hero
                        ? "border-gold/50 bg-gradient-to-br from-forest to-forest-deep text-white overflow-hidden"
                        : "bg-card"
                    )}
                  >
                    {era.hero && <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />}
                    <div className="relative">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]",
                          era.hero
                            ? "bg-gold/25 text-gold-soft border border-gold/50"
                            : "bg-primary/10 text-primary border border-primary/25"
                        )}
                      >
                        <Icon name={era.icon} className="h-3 w-3" />
                        {t(`about.heritage.${era.k}Label`)}
                      </span>
                      <h3 className={cn("mt-4 text-lg font-extrabold", era.hero ? "text-gold-gradient" : "text-foreground")}>
                        {t(`about.heritage.${era.k}Title`)}
                      </h3>
                      <p className={cn("mt-2.5 text-xs leading-relaxed", era.hero ? "text-emerald-50/85" : "text-muted-foreground")}>
                        {t(`about.heritage.${era.k}Desc`)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prinsip Federasi */}
      <section className="py-14 bg-mint/30 dark:bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("about.fedEyebrow")}
            title={t("about.fedTitle")}
            subtitle={t("about.fedSubtitle")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: "badge-check", title: t("about.principles.p1Title"), desc: t("about.principles.p1Desc") },
              { icon: "scale", title: t("about.principles.p2Title"), desc: t("about.principles.p2Desc") },
              { icon: "bar-chart-3", title: t("about.principles.p3Title"), desc: t("about.principles.p3Desc") },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-sm text-center hover:shadow-lg transition-shadow">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center text-primary">
                    <Icon name={c.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold">{c.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Mitra list compact */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PARTNERS.map((p, i) => (
              <Reveal key={p.code} delay={i * 0.05}>
                <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-forest to-primary grid place-items-center text-gold-soft">
                    <Icon name={p.icon} className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-primary">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{t(`about.partners.${p.code}`)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Enam Pilar Teknologi — Bab 7 Whitepaper (Task 34) */}
      <section className="py-14" aria-label={t("about.tech.title")}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("about.tech.eyebrow")}
            title={t("about.tech.title")}
            subtitle={t("about.tech.subtitle")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_PILLARS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.06}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-forest to-primary grid place-items-center text-gold-soft">
                      <Icon name={p.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="font-extrabold text-sm leading-snug">{t(`about.tech.p${i + 1}.name`)}</h3>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{t(`about.tech.p${i + 1}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nilai */}
      <section className="py-14 bg-mint/30 dark:bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={t("about.valuesEyebrow")} title={t("about.valuesTitle")} />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CORE_VALUES.map((v, i) => (
              <Reveal key={v.name} delay={i * 0.06}>
                <div className="h-full rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Icon name={v.icon} className="h-4.5 w-4.5 text-gold-deep" />
                    <p className="font-bold text-sm">{t(`about.values.${v.name}.name`)}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed line-clamp-4">{t(`about.values.${v.name}.meaning`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Manfaat bagi Pemangku Kepentingan — Bab 11 Whitepaper (Task 34) */}
      <section className="py-14" aria-label={t("about.stake.title")}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("about.stake.eyebrow")}
            title={t("about.stake.title")}
            subtitle={t("about.stake.subtitle")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAKEHOLDER_GROUPS.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.06}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
                      <Icon name={s.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="font-extrabold text-sm">{t(`about.stake.${s.id}.who`)}</h3>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{t(`about.stake.${s.id}.benefit`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Struktur Organisasi */}
      <section className="py-14 bg-mint/30 dark:bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("about.mgmtEyebrow")}
            title={t("about.mgmtTitle")}
            subtitle={t("about.mgmtSubtitle")}
          />
          {/* Kredibilitas pengurus — Task 29 */}
          <Reveal className="mt-10">
            <figure className="mx-auto max-w-3xl rounded-2xl border border-gold/30 bg-gold/[0.07] px-6 py-5 text-center">
              <blockquote className="text-sm font-semibold leading-relaxed text-foreground/90">
                “{t("about.org.credibility")}”
              </blockquote>
              <figcaption className="sr-only">{t("about.mgmtEyebrow")}</figcaption>
            </figure>
          </Reveal>

          {/* Bagan Struktur Kepengurusan — struktur resmi (Task 28) */}
          <Reveal className="mt-10">
            <div className="mx-auto max-w-3xl rounded-3xl border bg-card p-6 sm:p-10 shadow-sm">
              <div className="flex flex-col items-center" role="img" aria-label={t("about.org.pp") + " → " + t("about.org.bakorwil") + " → " + t("about.org.bakorcab")}>
                {/* Pengurus Pusat */}
                <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-forest to-forest-deep p-5 text-center text-white shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
                  <div className="relative">
                    <Icon name="landmark" className="mx-auto h-6 w-6 text-gold" />
                    <p className="mt-2 text-lg font-extrabold tracking-wide">{t("about.org.pp")}</p>
                    <p className="text-xs text-emerald-50/80">{t("about.org.ppFull")}</p>
                  </div>
                </div>
                {/* Penunjukan */}
                <div className="flex flex-col items-center">
                  <span className="h-5 w-px bg-border" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold text-gold-deep">
                    <Icon name="user-plus" className="h-3.5 w-3.5" />
                    {t("about.org.appoint")}
                  </span>
                  <span className="h-5 w-px bg-border" aria-hidden="true" />
                </div>
                {/* Bakorwil */}
                <div className="w-full max-w-md rounded-2xl border-2 border-primary/25 bg-primary/[0.06] p-4 text-center">
                  <Icon name="network" className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-1.5 font-extrabold text-primary">{t("about.org.bakorwil")}</p>
                  <p className="text-xs text-muted-foreground">{t("about.org.bakorwilFull")}</p>
                </div>
                <span className="h-5 w-px bg-border" aria-hidden="true" />
                {/* Bakorcab */}
                <div className="w-full max-w-md rounded-2xl border-2 border-border bg-muted/40 p-4 text-center">
                  <Icon name="building-2" className="mx-auto h-5 w-5 text-foreground/60" />
                  <p className="mt-1.5 font-extrabold">{t("about.org.bakorcab")}</p>
                  <p className="text-xs text-muted-foreground">{t("about.org.bakorcabFull")}</p>
                </div>
              </div>
              <p className="mt-6 flex items-start justify-center gap-1.5 text-center text-[11px] text-muted-foreground leading-relaxed max-w-lg mx-auto">
                <Icon name="info" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gold-deep" />
                <span>{t("about.org.note")}</span>
              </p>
              {/* Task 37 — jembatan ke halaman Susunan Pengurus lengkap (#/pengurus) */}
              <div className="mt-5 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("pengurus")}
                  className="border-gold/50 text-gold-deep hover:bg-gold/10 dark:text-gold"
                >
                  <Icon name="users" className="me-2 h-4 w-4" />
                  {t("about.org.seePengurus")}
                </Button>
              </div>
            </div>
          </Reveal>

          {!management ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {management.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.07}>
                  <div className="h-full rounded-2xl border bg-card p-6 shadow-sm text-center hover:shadow-lg transition-shadow">
                    <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary to-forest grid place-items-center text-white text-xl font-extrabold shadow-md">
                      {personInitial(m.name)}
                    </div>
                    <h3 className="mt-4 font-bold text-sm leading-snug">{m.name}</h3>
                    <Badge className="mt-2 bg-gold/15 text-gold-deep border-gold/30 text-[10px] hover:bg-gold/25">
                      {m.position}
                    </Badge>
                    {m.bio && <p className="mt-2.5 text-xs text-muted-foreground">{m.bio}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Jaringan Kepengurusan Daerah (DPD & Branch Office) — Task 19 */}
      <BranchesSection />

      {/* Roadmap + KPI */}
      <section className="py-14 bg-mint/30 dark:bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("about.roadmapEyebrow")}
            title={t("about.roadmapTitle")}
          />
          {!roadmap ? (
            <Skeleton className="mt-10 h-48 rounded-2xl" />
          ) : (
            <div className="mt-10 space-y-4">
              {roadmap.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.06}>
                  <div className={cn("rounded-2xl border bg-card p-6 shadow-sm flex flex-col sm:flex-row gap-5")}>
                    <div className="sm:w-44 shrink-0">
                      <Badge className="bg-primary/10 text-primary border-primary/30 font-bold">{r.period}</Badge>
                      <h3 className="mt-2 font-extrabold text-primary">{r.phase}</h3>
                      <p className="text-xs font-semibold text-foreground/60 mt-1">{r.focus}</p>
                    </div>
                    <div className="sm:border-s sm:border-border sm:ps-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-gold-deep mb-1.5">{t("about.deliverablesLabel")}</p>
                      <p className="text-sm text-foreground/75 leading-relaxed">{r.deliverables}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {/* KPI Table */}
          <Reveal className="mt-14">
            <h3 className="text-xl font-extrabold mb-1">{t("about.kpi.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("about.kpi.subtitle")}</p>
            <div className="rounded-2xl border overflow-hidden shadow-sm max-h-96 overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="bg-primary text-white">
                  <TableRow className="hover:bg-primary">
                    <TableHead className="text-white font-bold">{t("about.kpi.colIndicator")}</TableHead>
                    <TableHead className="text-white font-bold">{t("about.kpi.colBaseline")}</TableHead>
                    <TableHead className="text-white font-bold">{t("about.kpi.colTarget")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {KPI_ROWS.map((_, i) => (
                    <TableRow key={`about.kpi.rows.r${i + 1}`} className={i % 2 ? "bg-muted/40" : ""}>
                      <TableCell className="font-medium text-sm">{t(`about.kpi.rows.r${i + 1}.indicator`)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t(`about.kpi.rows.r${i + 1}.baseline`)}</TableCell>
                      <TableCell className="text-sm font-bold text-primary">{t(`about.kpi.rows.r${i + 1}.target`)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Reveal>

          {/* Model Bisnis & Keberlanjutan — Bab 8 Whitepaper (Task 34) */}
          <Reveal className="mt-14">
            <SectionHeading
              eyebrow={t("about.biz.eyebrow")}
              title={t("about.biz.title")}
              subtitle={t("about.biz.subtitle")}
            />
            <div className="mt-8 rounded-2xl border overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-forest text-white">
                  <TableRow className="hover:bg-forest">
                    <TableHead className="text-white font-bold">{t("about.biz.colSource")}</TableHead>
                    <TableHead className="text-white font-bold">{t("about.biz.colDesc")}</TableHead>
                    <TableHead className="text-white font-bold">{t("about.biz.colAkad")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REVENUE_SOURCES.map((r, i) => (
                    <TableRow key={r.id} className={i % 2 ? "bg-muted/40" : ""}>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-2 font-bold text-foreground">
                          <Icon name={r.icon} className="h-4 w-4 shrink-0 text-gold-deep" />
                          {t(`about.biz.${r.id}.name`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t(`about.biz.${r.id}.desc`)}</TableCell>
                      <TableCell className="text-sm font-semibold text-primary">{t(`about.biz.${r.id}.akad`)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-5 rounded-2xl border border-gold/30 bg-gold/[0.07] px-5 py-4 text-xs leading-relaxed text-foreground/85">
              {t("about.biz.note")}
            </p>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
              <Icon name="info" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gold-deep" />
              <span>{t("about.biz.refNote")}</span>
            </p>
          </Reveal>

          <Reveal className="mt-12 text-center">
            <Button size="lg" onClick={() => navigate("gabung")} className="bg-gradient-to-r from-primary to-forest text-white">
              <Icon name="handshake" className="h-5 w-5 me-2" />
              {t("about.cta")}
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
