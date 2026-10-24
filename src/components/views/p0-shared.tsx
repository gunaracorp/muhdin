"use client";

/**
 * Task 52 (P0) — Shell bersama 8 halaman "Infrastruktur Kepercayaan".
 * Dipakai oleh: regulasi, transparansi, etik, pdp, darurat, sehat, kalkulator, widget.
 *
 * Komponen:
 *  - TrustHero    : hero pita atas (hijau hutan; varian "red" untuk posko darurat).
 *  - TrustSection : kartu bagian bergaya konsisten (border + bg-card + ikon).
 *  - TrustCallout : kotak sorotan (gold | amber | danger | success).
 *  - TrustSteps   : daftar langkah bernomor (alur penegakan, cara pasang, dsb).
 *
 * Semua komponen RTL-aman (pakai ps/pe/ms/me) & dark-mode-aman.
 */

import { Reveal } from "@/components/site/reveal";
import { Icon } from "@/components/site/icon";
import { cn } from "@/lib/utils";

/* ------------------------------- HERO ------------------------------- */

export function TrustHero({
  eyebrow,
  title,
  subtitle,
  tone = "green",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: "green" | "red";
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "relative overflow-hidden text-white",
        tone === "red"
          ? "bg-gradient-to-br from-[#5c1616] via-[#3f0d0d] to-forest-deep"
          : "bg-forest-deep"
      )}
    >
      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <span
            className={cn(
              "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]",
              tone === "red" ? "text-red-200" : "text-gold"
            )}
          >
            <span className="h-px w-6 bg-current opacity-60" aria-hidden />
            {eyebrow}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-emerald-50/80">{subtitle}</p>}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ SECTION ------------------------------ */

export function TrustSection({
  icon,
  title,
  desc,
  children,
  className,
}: {
  icon: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal>
      <section aria-label={title} className={cn("rounded-2xl border bg-card p-5 shadow-sm sm:p-6", className)}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon name={icon} className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold leading-snug">{title}</h2>
            {desc && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>}
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </Reveal>
  );
}

/* ------------------------------ CALLOUT ------------------------------ */

const CALLOUT_TONES = {
  gold: "border-gold/40 bg-gold/5 text-gold-deep",
  amber: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
} as const;

export function TrustCallout({
  tone = "gold",
  icon = "info",
  title,
  children,
}: {
  tone?: keyof typeof CALLOUT_TONES;
  icon?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <aside className={cn("flex items-start gap-3 rounded-2xl border p-5", CALLOUT_TONES[tone])}>
        <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="min-w-0 text-sm leading-relaxed text-foreground/85">
          {title && <span className="font-extrabold">{title}: </span>}
          {children}
        </div>
      </aside>
    </Reveal>
  );
}

/* ------------------------------- STEPS ------------------------------- */

export function TrustSteps({
  items,
}: {
  items: { icon: string; title: string; desc: string }[];
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {items.map((s, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-xl border bg-card p-4"
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-deep">
            <Icon name={s.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
            <span className="absolute -end-1.5 -top-1.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-primary text-[9px] font-extrabold text-white">
              {i + 1}
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-snug">{s.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
