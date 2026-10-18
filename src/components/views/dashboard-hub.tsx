"use client";

/**
 * Task 48 — DashboardHub: gerbang Super Dashboard Trio (#/dashboard).
 * Tiga kartu peran (Jama'ah / Mitra / Admin) + ingat pilihan terakhir
 * (localStorage "muhdin-dash-role") + strip fitur sinematik.
 * Deep-link: #/dashboard/jamaah & #/dashboard/mitra menembus langsung
 * (penanganan rute ada di muhdin-app.tsx).
 * Task 51 — kini quartet: kartu ke-4 Dashboard PPIU & PPIHK
 * (teks kartu memakai namespace "ppk" di locales/ppiu-pihk.ts).
 */
import { useEffect, useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT, formatDateL10n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ROLE_KEY = "muhdin-dash-role";
type RoleId = "jamaah" | "mitra" | "admin" | "ppiu-pihk";

const CARDS: {
  id: RoleId;
  tagKey: string;
  titleKey: string;
  descKey: string;
  btnKey: string;
  icon: string;
  grad: string;
  ring: string;
  chip: string;
  chips: string[]; // icon names untuk strip fitur mini
}[] = [
  {
    id: "jamaah",
    tagKey: "dash.jCardTag",
    titleKey: "dash.jCardTitle",
    descKey: "dash.jCardDesc",
    btnKey: "dash.jCardBtn",
    icon: "moon-star",
    grad: "from-forest-deep to-forest",
    ring: "hover:border-gold/60",
    chip: "bg-gold/15 text-gold border-gold/40",
    chips: ["clock", "calendar", "wallet", "shield-check"],
  },
  {
    id: "mitra",
    tagKey: "dash.mCardTag",
    titleKey: "dash.mCardTitle",
    descKey: "dash.mCardDesc",
    btnKey: "dash.mCardBtn",
    icon: "handshake",
    grad: "from-primary to-forest",
    ring: "hover:border-primary/60",
    chip: "bg-primary/10 text-primary border-primary/40",
    chips: ["keyround", "satellite", "badge-check", "trending-up"],
  },
  {
    id: "admin",
    tagKey: "dash.aCardTag",
    titleKey: "dash.aCardTitle",
    descKey: "dash.aCardDesc",
    btnKey: "dash.aCardBtn",
    icon: "layout-dashboard",
    grad: "from-gold-deep to-gold",
    ring: "hover:border-gold-deep/60",
    chip: "bg-gold/10 text-gold-deep border-gold/40",
    chips: ["newspaper", "user-plus", "activity", "settings"],
  },
  // Task 51 — Dashboard PPIU & PPIHK (kartu ke-4, teks namespace ppk)
  {
    id: "ppiu-pihk" as RoleId,
    tagKey: "ppk.hubTag",
    titleKey: "ppk.hubTitle",
    descKey: "ppk.hubDesc",
    btnKey: "ppk.hubBtn",
    icon: "landmark",
    grad: "from-forest to-primary",
    ring: "hover:border-primary/60",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-300/40",
    chips: ["building-2", "database-zap", "refresh", "badge-check"],
  },
];

export function DashboardHub() {
  const { t } = useT();
  const [lastRole, setLastRole] = useState<RoleId | null>(null);

  // Baca pilihan terakhir setelah mount via defer satu tick (pola codebase) —
  // hydration aman + memenuhi aturan set-state-in-effect.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(ROLE_KEY);
        if (saved === "jamaah" || saved === "mitra" || saved === "admin" || saved === "ppiu-pihk") setLastRole(saved);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const pick = (id: RoleId) => {
    try {
      window.localStorage.setItem(ROLE_KEY, id);
    } catch {
      /* ignore */
    }
    navigate(id === "admin" ? "admin" : `dashboard/${id}`);
  };

  const today = new Date().toISOString();

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section aria-label={t("dash.title")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div
          aria-hidden
          className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl animate-float-soft"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
              <Icon name="sparkles" className="h-3.5 w-3.5" aria-hidden />
              {t("dash.eyebrow")}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              {t("dash.title").split(",")[0]},
              <span className="text-gold-gradient"> {t("dash.title").split(",").slice(1).join(",").trim()}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50/85 sm:text-base">
              {t("dash.subtitle")}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-100/70">
              <Icon name="calendar" className="h-3.5 w-3.5" aria-hidden />
              {formatDateL10n(today, "id")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* TRIO KARTU */}
      <section aria-label={t("dash.ariaHub")} className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
            {CARDS.map((c) => (
              <StaggerItem key={c.id}>
                <div
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
                    c.ring
                  )}
                >
                  {/* header berwarna */}
                  <div className={cn("relative overflow-hidden bg-gradient-to-br p-6 text-white", c.grad)}>
                    <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
                    <div className="relative flex items-start justify-between gap-3">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 border border-white/25 shadow-inner">
                        <Icon name={c.icon} className="h-7 w-7 text-gold-soft" aria-hidden />
                      </span>
                      <span className={cn("rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest", c.chip)}>
                        {t(c.tagKey)}
                      </span>
                    </div>
                    <h2 className="relative mt-4 text-xl font-extrabold leading-tight sm:text-2xl">
                      {t(c.titleKey)}
                    </h2>
                    {/* strip fitur mini */}
                    <div className="relative mt-4 flex flex-wrap gap-2">
                      {c.chips.map((ic) => (
                        <span
                          key={ic}
                          aria-hidden
                          className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 border border-white/15"
                        >
                          <Icon name={ic} className="h-3.5 w-3.5 text-white/90" />
                        </span>
                      ))}
                    </div>
                    {lastRole === c.id && (
                      <p className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-soft">
                        <Icon name="clock" className="h-3 w-3" aria-hidden />
                        {t("dash.hubContinue")}
                      </p>
                    )}
                  </div>

                  {/* isi */}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{t(c.descKey)}</p>
                    <Button
                      onClick={() => pick(c.id)}
                      className="mt-5 w-full h-11 bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
                      aria-label={t(c.btnKey)}
                    >
                      {t(c.btnKey)}
                      <Icon name="arrow-right" className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden />
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <Icon name="shield-check" className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {t("dash.hubNote")}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
