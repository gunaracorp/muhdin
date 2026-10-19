"use client";

/**
 * Task 33-c — PrivacyView: halaman kebijakan privasi (route #/privasi).
 * Placeholder yang baik & lengkap strukturnya — konten ringkas per bagian,
 * dengan catatan eksplisit bahwa versi final akan ditinjau penasihat hukum.
 */
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

function PolicySection({
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
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/80">{children}</div>
      </section>
    </Reveal>
  );
}

export function PrivacyView() {
  const { t } = useT();

  const NOT_PUBLISHED = [
    { icon: "fingerprint", key: "notpubNik" },
    { icon: "passport", key: "notpubPassport" },
    { icon: "wallet", key: "notpubBank" },
    { icon: "file-text", key: "notpubDocs" },
    { icon: "eye-off", key: "notpubContact" },
  ] as const;

  return (
    <div className="flex flex-col">
      {/* HERO KECIL */}
      <section aria-label={t("nusTrust.priv.title")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {t("nusTrust.priv.eyebrow")}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("nusTrust.priv.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("nusTrust.priv.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section aria-label={t("nusTrust.priv.title")} className="py-12">
        <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
          {/* 1. Data yang kami kumpulkan */}
          <PolicySection icon="database-zap" title={t("nusTrust.priv.collectTitle")}>
            <p>{t("nusTrust.priv.collectDesc")}</p>
          </PolicySection>

          {/* 2. Data yang TIDAK kami publikasikan */}
          <Reveal>
            <section aria-label={t("nusTrust.priv.notpubTitle")} className="rounded-2xl border border-gold/40 bg-gold/5 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                  <Icon name="eye-off" className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-lg font-extrabold leading-snug">{t("nusTrust.priv.notpubTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t("nusTrust.priv.notpubDesc")}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {NOT_PUBLISHED.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-start gap-2 rounded-xl border bg-card p-3 text-sm text-foreground/85"
                  >
                    <Icon name={item.icon} className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden />
                    {t(`nusTrust.priv.${item.key}`)}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          {/* 3. Dasar pemrosesan & persetujuan */}
          <PolicySection icon="shield-check" title={t("nusTrust.priv.basisTitle")}>
            <p>{t("nusTrust.priv.basisDesc")}</p>
          </PolicySection>

          {/* 4. Retensi & penghapusan */}
          <PolicySection icon="timer" title={t("nusTrust.priv.retentionTitle")}>
            <p>{t("nusTrust.priv.retentionDesc")}</p>
          </PolicySection>

          {/* 5. Hak Anda */}
          <PolicySection icon="heart-handshake" title={t("nusTrust.priv.rightsTitle")}>
            <p>{t("nusTrust.priv.rightsDesc")}</p>
          </PolicySection>

          {/* 6. Kontak */}
          <Reveal>
            <section aria-label={t("nusTrust.priv.contactTitle")} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="mail" className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold">{t("nusTrust.priv.contactTitle")}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                      {t("nusTrust.priv.contactDesc")}
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:info@muhdin.web.id"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-forest"
                >
                  <Icon name="send" className="h-4 w-4" aria-hidden />
                  info@muhdin.web.id
                </a>
              </div>
            </section>
          </Reveal>

          {/* CATATAN PLACEHOLDER */}
          <Reveal delay={0.08}>
            <aside
              aria-label={t("nusTrust.priv.placeholder")}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5"
            >
              <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground/85">
                <span className="font-extrabold">{t("nusTrust.priv.title")}: </span>
                {t("nusTrust.priv.placeholder")}
              </p>
            </aside>
          </Reveal>

          {/* CTA menuju syarat */}
          <Reveal delay={0.12} className="pt-2 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("syarat")}
              className="rounded-full px-6 font-bold"
            >
              {t("nusTrust.terms.title")}
              <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
