"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { TUTORIAL_CATEGORIES } from "@/lib/constants";
import { useT, formatNumberL10n } from "@/lib/i18n";
import type { Tutorial } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL_COLORS: Record<string, string> = {
  Pemula: "bg-primary/10 text-primary border-primary/30 dark:text-primary dark:bg-primary/15",
  Menengah: "bg-gold/15 text-gold-deep border-gold/40 dark:text-gold dark:bg-gold/15",
  Mahir: "bg-forest/15 text-forest border-forest/40 dark:text-emerald-100 dark:bg-forest/25 dark:border-forest/50",
};

export function TutorialView({ slug }: { slug?: string }) {
  if (slug) return <TutorialDetail slug={slug} />;
  return <TutorialList />;
}

function TutorialList() {
  const { t, locale } = useT();
  const [tutorials, setTutorials] = useState<Tutorial[] | null>(null);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    apiGet<Tutorial[]>(`/api/tutorials?locale=${locale}`).then(setTutorials).catch(() => setTutorials([]));
  }, [locale]);

  const filtered = useMemo(() => {
    if (!tutorials) return [];
    return tutorials.filter((tu) => {
      const okCat = cat === "all" || tu.category === cat;
      const okQ =
        !q || tu.title.toLowerCase().includes(q.toLowerCase()) || tu.summary.toLowerCase().includes(q.toLowerCase());
      return okCat && okQ;
    });
  }, [tutorials, cat, q]);

  const categoryLabel = (code: string) => {
    const map: Record<string, string> = {
      Umum: t("tutorial.catUmum"),
      CMS: t("tutorial.catCms"),
      Jamaah: t("tutorial.catJamaah"),
      Mitra: t("tutorial.catMitra"),
    };
    return map[code] ?? code;
  };

  const levelLabel = (code: string) => {
    const map: Record<string, string> = {
      Pemula: t("tutorial.levelPemula"),
      Menengah: t("tutorial.levelMenengah"),
      Mahir: t("tutorial.levelMahir"),
    };
    return map[code] ?? code;
  };

  return (
    <div className="flex flex-col">
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("tutorial.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("tutorial.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("tutorial.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-3 mb-8">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-0.5">
              <FilterChip active={cat === "all"} onClick={() => setCat("all")} label={t("tutorial.filterAll")} />
              {TUTORIAL_CATEGORIES.map((c) => (
                <FilterChip key={c} active={cat === c} onClick={() => setCat(c)} label={categoryLabel(c)} />
              ))}
            </div>
            <div className="relative lg:ml-auto w-full lg:w-72">
              <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("tutorial.searchPlaceholder")}
                aria-label={t("tutorial.searchAria")}
                className="ps-9"
              />
            </div>
          </div>

          {!tutorials ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Icon name="help-circle" className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">{t("tutorial.empty")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tu, i) => (
                <Reveal key={tu.id} delay={Math.min(i * 0.04, 0.4)}>
                  <button
                    onClick={() => navigate(`tutorial/${tu.slug}`)}
                    className="group h-full w-full text-left rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        <Icon name="graduation-cap" className="h-3 w-3 me-1 text-primary" />
                        {categoryLabel(tu.category)}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] font-bold", LEVEL_COLORS[tu.level])}>
                        {levelLabel(tu.level)}
                      </Badge>
                    </div>
                    <h3 className="mt-4 font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {tu.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{tu.summary}</p>
                    <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="clock" className="h-3.5 w-3.5" /> {t("tutorial.minutes", { n: formatNumberL10n(tu.duration, locale) })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="eye" className="h-3.5 w-3.5" /> {t("tutorial.views", { n: formatNumberL10n(tu.views, locale) })}
                      </span>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
        active ? "bg-primary text-white shadow-md" : "bg-muted text-foreground/70 hover:bg-primary/10 hover:text-primary"
      )}
    >
      {label}
    </button>
  );
}

function TutorialDetail({ slug }: { slug: string }) {
  const { t, locale } = useT();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet<Tutorial>(`/api/tutorials/slug/${slug}?locale=${locale}`)
      .then(setTutorial)
      .catch(() => setError(true));
  }, [slug, locale]);

  if (error)
    return (
      <div className="py-24 text-center">
        <Icon name="alert-triangle" className="h-10 w-10 mx-auto text-destructive" />
        <p className="mt-3 text-muted-foreground">{t("tutorial.loadError")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("tutorial")}>
          {t("tutorial.backAll")}
        </Button>
      </div>
    );

  if (!tutorial)
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );

  const categoryLabel = (() => {
    const map: Record<string, string> = {
      Umum: t("tutorial.catUmum"),
      CMS: t("tutorial.catCms"),
      Jamaah: t("tutorial.catJamaah"),
      Mitra: t("tutorial.catMitra"),
    };
    return map[tutorial.category] ?? tutorial.category;
  })();

  const levelLabel = (() => {
    const map: Record<string, string> = {
      Pemula: t("tutorial.levelPemula"),
      Menengah: t("tutorial.levelMenengah"),
      Mahir: t("tutorial.levelMahir"),
    };
    return map[tutorial.level] ?? tutorial.level;
  })();

  return (
    <div className="py-12">
      <article className="mx-auto max-w-4xl px-4 sm:px-6">
        <Button variant="ghost" onClick={() => navigate("tutorial")} className="mb-6 -ms-2 text-primary">
          <Icon name="arrow-right" className="h-4 w-4 rotate-180 me-1.5 icon-flip" />
          {t("tutorial.backAll")}
        </Button>

        <Reveal>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold">
              <Icon name="graduation-cap" className="h-3 w-3 me-1 text-primary" />
              {categoryLabel}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] font-bold", LEVEL_COLORS[tutorial.level])}>
              {levelLabel}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="clock" className="h-3.5 w-3.5" /> {t("tutorial.minutesRead", { n: formatNumberL10n(tutorial.duration, locale) })}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="eye" className="h-3.5 w-3.5" /> {t("tutorial.views", { n: formatNumberL10n(tutorial.views, locale) })}
            </span>
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{tutorial.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{tutorial.summary}</p>
          <div className="gold-divider mt-6" />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="markdown-body mt-8 max-w-none">
            <ReactMarkdown>{tutorial.content}</ReactMarkdown>
          </div>
        </Reveal>

        <div className="mt-10 rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
          <p className="font-bold">{t("tutorial.helpTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("tutorial.helpDesc")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => navigate("kontak")}>
              <Icon name="message-square" className="h-4 w-4 me-1.5" /> {t("tutorial.ctaContact")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("tutorial")}>
              <Icon name="rotate" className="h-4 w-4 me-1.5" /> {t("tutorial.ctaMore")}
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
