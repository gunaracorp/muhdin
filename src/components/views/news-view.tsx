"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { useT, formatDateL10n, formatNumberL10n } from "@/lib/i18n";
import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NewsView({ slug }: { slug?: string }) {
  if (slug) return <NewsDetail slug={slug} />;
  return <NewsList />;
}

function NewsList() {
  const { t, locale } = useT();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    apiGet<Article[]>(`/api/articles?locale=${locale}`).then(setArticles).catch(() => setArticles([]));
  }, [locale]);

  const categoryLabel = (code: string) => {
    const map: Record<string, string> = {
      Berita: t("news.catBerita"),
      Pengumuman: t("news.catPengumuman"),
      Artikel: t("news.catArtikel"),
      "Press Release": t("news.catPressRelease"),
    };
    return map[code] ?? code;
  };

  const categories = ["all", ...Array.from(new Set((articles || []).map((a) => a.category)))];
  const featured = (articles || []).filter((a) => a.featured).slice(0, 1)[0];
  const rest = (articles || [])
    .filter((a) => (cat === "all" || a.category === cat) && a.id !== featured?.id);

  return (
    <div className="flex flex-col">
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("news.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("news.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("news.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {!articles ? (
            <div className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <Reveal>
                  <button
                    onClick={() => navigate(`berita/${featured.slug}`)}
                    className="group w-full text-left rounded-3xl overflow-hidden border bg-card shadow-sm mb-10 grid lg:grid-cols-2 transition-all hover:shadow-xl"
                  >
                    <div className="relative h-64 lg:h-auto overflow-hidden bg-gradient-to-br from-forest to-primary">
                      { }
                      <img
                        src={featured.cover || "/images/hero-kaaba.jpg"}
                        alt={featured.title}
                        className="h-full w-full object-cover bg-gradient-to-br from-forest to-primary transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute top-4 start-4 bg-gold text-forest-deep font-bold border-none">
                        <Icon name="sparkles" className="h-3 w-3 me-1" /> {t("news.featuredBadge")}
                      </Badge>
                    </div>
                    <div className="p-7 lg:p-9 flex flex-col justify-center">
                      <Badge variant="secondary" className="w-fit text-[11px]">{categoryLabel(featured.category)}</Badge>
                      <h2 className="mt-3 text-2xl lg:text-3xl font-extrabold leading-tight group-hover:text-primary transition-colors">
                        {featured.title}
                      </h2>
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{featured.excerpt}</p>
                      <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Icon name="calendar" className="h-3.5 w-3.5" /> {formatDateL10n(featured.createdAt, locale)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Icon name="user" className="h-3.5 w-3.5" /> {featured.author}
                        </span>
                      </div>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                        {t("news.readMore")}
                        <Icon name="arrow-right" className="h-4 w-4 icon-flip group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </button>
                </Reveal>
              )}

              {/* Filter chips */}
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-0.5 mb-6">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    aria-pressed={cat === c}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                      cat === c ? "bg-primary text-white shadow-md" : "bg-muted text-foreground/70 hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    {c === "all" ? t("news.filterAll") : categoryLabel(c)}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {rest.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">{t("news.emptyCategory")}</div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((a, i) => (
                    <Reveal key={a.id} delay={Math.min(i * 0.05, 0.4)}>
                      <button
                        onClick={() => navigate(`berita/${a.slug}`)}
                        className="group h-full w-full text-left rounded-2xl border bg-card overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-forest to-primary">
                          { }
                          <img
                            src={a.cover || "/images/hero-kaaba.jpg"}
                            alt={a.title}
                            className="h-full w-full object-cover bg-gradient-to-br from-forest to-primary transition-transform duration-500 group-hover:scale-105"
                          />
                          <Badge className="absolute top-3 start-3 bg-forest-deep text-gold-soft border-none">
                            {categoryLabel(a.category)}
                          </Badge>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon name="calendar" className="h-3.5 w-3.5" />
                            {formatDateL10n(a.createdAt, locale)}
                            <span className="mx-1">·</span>
                            <Icon name="eye" className="h-3.5 w-3.5" />
                            {t("news.views", { n: formatNumberL10n(a.views, locale) })}
                          </div>
                          <h3 className="mt-2 font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {a.title}
                          </h3>
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{a.excerpt}</p>
                        </div>
                      </button>
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function NewsDetail({ slug }: { slug: string }) {
  const { t, locale } = useT();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet<Article>(`/api/articles/slug/${slug}?locale=${locale}`)
      .then(setArticle)
      .catch(() => setError(true));
  }, [slug, locale]);

  if (error)
    return (
      <div className="py-24 text-center">
        <Icon name="alert-triangle" className="h-10 w-10 mx-auto text-destructive" />
        <p className="mt-3 text-muted-foreground">{t("news.loadError")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("berita")}>
          {t("news.backAll")}
        </Button>
      </div>
    );

  if (!article)
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );

  const categoryLabel = (() => {
    const map: Record<string, string> = {
      Berita: t("news.catBerita"),
      Pengumuman: t("news.catPengumuman"),
      Artikel: t("news.catArtikel"),
      "Press Release": t("news.catPressRelease"),
    };
    return map[article.category] ?? article.category;
  })();

  return (
    <div className="py-12">
      <article className="mx-auto max-w-4xl px-4 sm:px-6">
        <Button variant="ghost" onClick={() => navigate("berita")} className="mb-6 -ms-2 text-primary">
          <Icon name="arrow-right" className="h-4 w-4 rotate-180 me-1.5 icon-flip" />
          {t("news.backAll")}
        </Button>
        <Reveal>
          <Badge variant="secondary" className="text-[11px]">{categoryLabel}</Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{article.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icon name="user" className="h-4 w-4" /> {article.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="calendar" className="h-4 w-4" /> {formatDateL10n(article.createdAt, locale)}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="eye" className="h-4 w-4" /> {t("news.views", { n: formatNumberL10n(article.views, locale) })}
            </span>
          </div>
        </Reveal>
        { }
        <img
          src={article.cover || "/images/hero-kaaba.jpg"}
          alt={article.title}
          className="mt-8 w-full h-72 sm:h-96 object-cover rounded-2xl shadow-lg"
        />
        <Reveal delay={0.1}>
          <p className="mt-8 text-lg leading-relaxed text-foreground/80 border-s-4 border-gold ps-4 italic">
            {article.excerpt}
          </p>
          <div className="markdown-body mt-8 max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </Reveal>
      </article>
    </div>
  );
}
