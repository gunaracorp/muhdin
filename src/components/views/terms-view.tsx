"use client";

/**
 * Task 33-c — TermsView: halaman syarat & ketentuan (route #/syarat).
 * Bagian "MUHDIN Verified & batasannya" mengutip disclaimer PERSIS dari
 * VERIFIED_DISCLAIMER_ID (src/lib/nusantara.ts) via namespace import —
 * fallback kamus i18n hanya bila konstanta belum didaftarkan.
 */
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { useT } from "@/lib/i18n";
import * as Nusantara from "@/lib/nusantara";

const LEGAL_CONST = Nusantara as unknown as { VERIFIED_DISCLAIMER_ID?: string };

function TermSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section aria-label={title} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon name={icon} className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-lg font-extrabold leading-snug">{title}</h2>
        </div>
        <div className="mt-3 text-sm leading-relaxed text-foreground/80">{children}</div>
      </section>
    </Reveal>
  );
}

export function TermsView() {
  const { t } = useT();
  const disclaimer = LEGAL_CONST.VERIFIED_DISCLAIMER_ID || t("nusTrust.disclaimer.fallback");

  const SECTIONS = [
    { icon: "scroll-text", title: t("nusTrust.terms.defTitle"), body: t("nusTrust.terms.defDesc") },
    { icon: "wallet", title: t("nusTrust.terms.memberTitle"), body: t("nusTrust.terms.memberDesc") },
    { icon: "handshake", title: t("nusTrust.terms.conductTitle"), body: t("nusTrust.terms.conductDesc") },
    { icon: "award", title: t("nusTrust.terms.ipTitle"), body: t("nusTrust.terms.ipDesc") },
    { icon: "scale", title: t("nusTrust.terms.liabilityTitle"), body: t("nusTrust.terms.liabilityDesc") },
    { icon: "refresh", title: t("nusTrust.terms.changesTitle"), body: t("nusTrust.terms.changesDesc") },
    { icon: "mail", title: t("nusTrust.terms.contactTitle"), body: t("nusTrust.terms.contactDesc") },
  ] as const;

  return (
    <div className="flex flex-col">
      {/* HERO KECIL */}
      <section aria-label={t("nusTrust.terms.title")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {t("nusTrust.terms.eyebrow")}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("nusTrust.terms.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("nusTrust.terms.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section aria-label={t("nusTrust.terms.title")} className="py-12">
        <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
          {/* 1. Definisi */}
          <TermSection icon={SECTIONS[0].icon} title={SECTIONS[0].title}>
            {SECTIONS[0].body}
          </TermSection>

          {/* 2. Keanggotaan & iuran */}
          <TermSection icon={SECTIONS[1].icon} title={SECTIONS[1].title}>
            {SECTIONS[1].body}
          </TermSection>

          {/* 3. Status MUHDIN Verified & batasannya + kutipan disclaimer persis */}
          <Reveal>
            <section
              aria-label={t("nusTrust.terms.verifiedTitle")}
              className="rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <Icon name="shield-check" className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-lg font-extrabold leading-snug">{t("nusTrust.terms.verifiedTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t("nusTrust.terms.verifiedDesc")}</p>
              <blockquote className="mt-4 rounded-xl border-s-4 border-gold bg-gold/10 p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-gold-deep">
                  <Icon name="quote" className="h-3.5 w-3.5" aria-hidden />
                  {t("nusTrust.terms.quoteLabel")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{disclaimer}</p>
              </blockquote>
            </section>
          </Reveal>

          {/* 4-8. Sisa bagian */}
          {SECTIONS.slice(2).map((s) => (
            <TermSection key={s.title} icon={s.icon} title={s.title}>
              {s.body}
            </TermSection>
          ))}

          {/* CATATAN PLACEHOLDER (satu napas dengan halaman privasi) */}
          <Reveal delay={0.08}>
            <aside
              aria-label={t("nusTrust.priv.placeholder")}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5"
            >
              <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground/85">
                <span className="font-extrabold">{t("nusTrust.terms.title")}: </span>
                {t("nusTrust.priv.placeholder")}
              </p>
            </aside>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
