"use client";

import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem, SectionHeading } from "@/components/site/reveal";
import { MENU_GROUPS, findLayanan, type MenuNode } from "@/lib/menu-data";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Task 50 — PUSAT LAYANAN MUHDIN (#/layanan).
 *  - Tanpa slug  → overview semua kelompok layanan (grid kartu).
 *  - Dengan slug → halaman detail layanan (#/layanan/visa-umroh, dst).
 *  - Slug tak dikenal → pesan "tidak ditemukan" + tombol kembali.
 * Seluruh teks i18n ×3 (id/en/ar) dan aman RTL (pakai properti logis).
 */

const waHref = `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(BRAND.waGreeting)}`;

/* ================= OVERVIEW — semua kelompok layanan ================= */
function Overview() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-14 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -top-24 start-1/4 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t("layanan.overview.eyebrow")}
            title={t("layanan.overview.title")}
            subtitle={t("layanan.overview.sub")}
          />
        </div>
      </section>

      {/* Grid kelompok layanan */}
      <section aria-label={t("layanan.overview.title")} className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Stagger className="grid gap-5 md:grid-cols-2" stagger={0.06}>
            {MENU_GROUPS.map((node) => (
              <StaggerItem key={node.key} className="h-full">
                <GroupCard node={node} />
              </StaggerItem>
            ))}
            {/* SYARIKAH — kartu standalone (pengganti "Penyedia Saudi") */}
            <StaggerItem className="h-full">
              <button
                onClick={() => navigate("layanan/syariah")}
                className="group flex h-full w-full flex-col rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-6 text-start shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/20 text-gold-deep">
                    <Icon name="heart-handshake" className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-deep">
                      {t("layanan.overview.eyebrow")}
                    </p>
                    <h3 className="text-lg font-extrabold uppercase tracking-wide text-foreground">
                      {t("layanan.items.syariah.title")}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {t("layanan.items.syariah.desc")}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-extrabold uppercase tracking-wide text-gold-deep transition-colors group-hover:text-primary">
                  {t("layanan.overview.ctaLabel")}
                  <Icon name="arrow-right" className="h-3.5 w-3.5 icon-flip" />
                </span>
              </button>
            </StaggerItem>
          </Stagger>

          {/* CTA band */}
          <Reveal className="mt-14">
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-gold/10 to-primary/10 p-8 text-center">
              <h3 className="text-xl font-extrabold text-foreground sm:text-2xl">{t("footer.ctaTitle")}</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("footer.ctaDesc")}</p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate("daftar")} className="w-full bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg sm:w-auto">
                  {t("layanan.detail.ctaDaftar")}
                  <Icon name="arrow-right" className="h-4 w-4 ms-1.5 icon-flip" />
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <Icon name="message-circle" className="h-4 w-4 me-1.5" />
                    {t("layanan.detail.ctaWa")}
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/** Kartu satu kelompok layanan berisi chip sub-item. */
function GroupCard({ node }: { node: MenuNode }) {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col rounded-3xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon name={node.groupIcon ?? "hexagon"} className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="text-lg font-extrabold uppercase tracking-wide text-foreground">
            {t(`layanan.groups.${node.group}.label`)}
          </h3>
          <p className="text-xs font-medium text-muted-foreground">{t(`layanan.groups.${node.group}.tag`)}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {(node.children ?? []).map((c) => (
          <button
            key={c.slug}
            onClick={() => navigate(`layanan/${c.slug}`)}
            className="inline-flex items-center gap-2 rounded-full border bg-background px-3.5 py-2 text-xs font-bold text-foreground/80 transition-all hover:border-gold/60 hover:bg-gold/10 hover:text-gold-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Icon name={c.icon} className="h-3.5 w-3.5 text-gold-deep" strokeWidth={2} />
            {t(`layanan.items.${c.slug}.title`)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= DETAIL — satu layanan ================= */
function Detail({ slug }: { slug: string }) {
  const { t } = useT();
  const found = findLayanan(slug);

  // SYARIKAH adalah node menu standalone (di luar group) — tetap punya halaman detail.
  const standalone =
    !found && slug === "syariah"
      ? { group: null as MenuNode | null, child: { slug: "syariah", icon: "heart-handshake" } }
      : null;

  if (!found && !standalone) {
    return (
      <div className="min-h-screen bg-background">
        <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-28 text-center sm:px-6">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Icon name="info" className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-foreground">{t("layanan.detail.notFound")}</h1>
          <Button className="mt-6" onClick={() => navigate("layanan")}>
            <Icon name="arrow-right" className="h-4 w-4 me-1.5 icon-flip" />
            {t("layanan.detail.notFoundCta")}
          </Button>
        </section>
      </div>
    );
  }

  const group = found?.group ?? standalone!.group ?? null;
  const child = found?.child ?? standalone!.child;
  const others = (group?.children ?? []).filter((c) => c.slug !== slug);
  const groupKey = group?.group ?? null;
  const poin = ["p1", "p2", "p3"] as const;

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -top-20 end-1/5 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <button onClick={() => navigate("beranda")} className="transition-colors hover:text-primary">
              {t("layanan.detail.home")}
            </button>
            <Icon name="chevron-right" className="h-3 w-3 opacity-50 icon-flip" />
            <button onClick={() => navigate("layanan")} className="transition-colors hover:text-primary">
              {t("layanan.detail.hub")}
            </button>
            <Icon name="chevron-right" className="h-3 w-3 opacity-50 icon-flip" />
            <span className="text-gold-deep">{t(`layanan.items.${slug}.title`)}</span>
          </nav>

          <Reveal className="mt-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-primary/15 to-gold/20 text-primary shadow-inner">
                <Icon name={child.icon} className="h-8 w-8" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-deep">
                  {groupKey ? t(`layanan.groups.${groupKey}.label`) : t("layanan.overview.eyebrow")} — {t("layanan.detail.groupLabel")}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold uppercase tracking-tight text-foreground sm:text-4xl">
                  {t(`layanan.items.${slug}.title`)}
                </h1>
              </div>
            </div>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {t(`layanan.items.${slug}.desc`)}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Poin layanan */}
          <Reveal>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary">
              {t("layanan.detail.poinTitle")}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {poin.map((k) => (
                <li key={k} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
                  <Icon name="check-circle-2" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-semibold leading-snug text-foreground/90">
                    {t(`layanan.items.${slug}.${k}`)}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* CTA */}
          <Reveal className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate("daftar")}
                className="w-full bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg sm:w-auto"
              >
                {t("layanan.detail.ctaDaftar")}
                <Icon name="arrow-right" className="h-4 w-4 ms-1.5 icon-flip" />
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <Icon name="message-circle" className="h-4 w-4 me-1.5" />
                  {t("layanan.detail.ctaWa")}
                </a>
              </Button>
            </div>
          </Reveal>

          {/* Layanan lain dalam group yang sama */}
          {others.length > 0 && (
            <Reveal className="mt-12">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                {t("layanan.detail.related")}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {others.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => navigate(`layanan/${c.slug}`)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-bold text-foreground/80",
                      "transition-all hover:border-gold/60 hover:bg-gold/10 hover:text-gold-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    )}
                  >
                    <Icon name={c.icon} className="h-3.5 w-3.5 text-gold-deep" />
                    {t(`layanan.items.${c.slug}.title`)}
                  </button>
                ))}
              </div>
            </Reveal>
          )}

          {/* Kembali ke overview */}
          <div className="mt-10">
            <button
              onClick={() => navigate("layanan")}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-gold-deep"
            >
              <Icon name="arrow-right" className="h-4 w-4 rotate-180 icon-flip" />
              {t("layanan.detail.backLabel")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LayananView({ slug }: { slug?: string }) {
  if (!slug) return <Overview />;
  return <Detail slug={slug} />;
}
