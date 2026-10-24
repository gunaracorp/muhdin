"use client";

/**
 * DetailShell (v4.1) — blok-blok dasar untuk HALAMAN DETAIL.
 *
 * Semua halaman detail baru (anggota, pengurus, agenda, galeri, dpd, faq,
 * peta-situs) memakai blok ini agar 100% konsisten dengan desain MUHDIN:
 * hero forest-deep berpola islami, breadcrumb kembali, kartu border lembut,
 * dan CTA WhatsApp resmi. Mengikuti bahasa visual agenda-view/news-view.
 */

import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Tombol kembali — pojok kiri hero (RTL-aware via ps/pe). */
export function BackButton({ to, label, className }: { to: string; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className
      )}
    >
      <Icon name="chevron-right" className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5 rtl:rotate-0 rtl:group-hover:translate-x-0.5" aria-hidden />
      {label}
    </button>
  );
}

/** Hero standar halaman detail. */
export function DetailHero({
  eyebrow,
  title,
  subtitle,
  backTo,
  backLabel,
  badge,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backTo: string;
  backLabel: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-forest-deep text-white">
      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6">
        <Reveal>
          <BackButton to={backTo} label={backLabel} />
          <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-6 bg-current opacity-60" aria-hidden />
            {eyebrow}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-emerald-50/80">{subtitle}</p>}
          {badge && <div className="mt-4 flex flex-wrap items-center gap-2">{badge}</div>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}

/** Baris info berikon (grid detail). */
export function InfoRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon name={icon} className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="mt-0.5 block break-words text-sm font-semibold text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 break-words text-sm font-semibold text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

/** Judul seksi dengan garis — konsisten dengan agenda-view. */
export function DetailSectionHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon name={icon} className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="text-xl font-extrabold">{title}</h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Kartu "Lihat juga" — tautan halaman terkait. */
export function RelatedLinkCard({
  href,
  icon,
  title,
  meta,
}: {
  href: string;
  icon: string;
  title: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="group flex h-full w-full items-center gap-3 rounded-2xl border bg-card p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-deep to-primary text-white shadow-sm">
        <Icon name={icon} className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold group-hover:text-primary">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
    </button>
  );
}

/** CTA WhatsApp resmi MUHDIN (nomor brand). */
export function WaCtaButton({ message, label, className }: { message: string; label?: string; className?: string }) {
  const { t } = useT();
  const href = `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
        className
      )}
    >
      <Icon name="message-circle" className="h-4 w-4" aria-hidden />
      {label || t("common.waFabLabel")}
    </a>
  );
}

/** Keadaan memuat / tidak ditemukan yang konsisten. */
export function DetailLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Memuat…</p>
    </div>
  );
}

export function DetailNotFound({
  message,
  backTo,
  backLabel,
}: {
  message: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-muted">
        <Icon name="search" className="h-8 w-8 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="text-xl font-extrabold">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <BackButton to={backTo} label={backLabel} className="!bg-primary !text-white" />
    </div>
  );
}
