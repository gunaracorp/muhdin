"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT, formatNumberL10n } from "@/lib/i18n";
import type { GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Label kategori dari kamus; kategori tak dikenal ditampilkan apa adanya. */
function catLabel(cat: string, t: (k: string) => string): string {
  const key = `gallery.cat.${cat}`;
  const val = t(key);
  return val === key ? cat : val;
}

export function GalleryView() {
  const { t, locale } = useT();
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [cat, setCat] = useState("all");
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    apiGet<GalleryItem[]>("/api/gallery")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const categories = useMemo(() => {
    if (!items) return [];
    const seen: string[] = [];
    for (const it of items) if (!seen.includes(it.category)) seen.push(it.category);
    return seen;
  }, [items]);

  const filtered = useMemo(
    () => (items ? (cat === "all" ? items : items.filter((i) => i.category === cat)) : []),
    [items, cat]
  );

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("gallery.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("gallery.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("gallery.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* FILTER CHIP KATEGORI */}
          <div
            className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 mb-7"
            role="group"
            aria-label={t("gallery.ariaFilter")}
          >
            {["all", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                  cat === c
                    ? "bg-primary text-white shadow-md"
                    : "bg-muted text-foreground/70 hover:bg-primary/10 hover:text-primary"
                )}
              >
                {c === "all" ? t("gallery.filterAll") : catLabel(c, t)}
              </button>
            ))}
            {items && (
              <span className="ms-auto hidden sm:flex items-center text-xs text-muted-foreground shrink-0 ps-3">
                {t("gallery.countLabel", { n: formatNumberL10n(filtered.length, locale) })}
              </span>
            )}
          </div>

          {/* LOADING */}
          {!items ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label={t("gallery.loading")}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* EMPTY STATE */
            <div className="py-20 text-center">
              <Icon aria-hidden name="grid-3x3" className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <h3 className="mt-3 font-bold">{t("gallery.emptyTitle")}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("gallery.emptyDesc")}</p>
            </div>
          ) : (
            /* GRID 1/2/3 KOLOM */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((it, i) => (
                <Reveal key={it.id} delay={Math.min(i * 0.04, 0.4)}>
                  <button
                    onClick={() => setActive(it)}
                    aria-label={t("gallery.openAria", { title: it.title })}
                    className="group w-full text-start rounded-2xl overflow-hidden border bg-card shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-forest to-primary">
                      <img
                        src={it.imageUrl}
                        alt={it.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute top-3 start-3 bg-gold text-forest-deep font-bold border-none text-[10px]">
                        {catLabel(it.category, t)}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {it.title}
                      </h3>
                      {it.caption && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{it.caption}</p>
                      )}
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0">
          {active && (
            <>
              <div className="relative aspect-[4/3] bg-gradient-to-br from-forest to-primary">
                <img src={active.imageUrl} alt={active.title} className="h-full w-full object-cover" />
                <Badge className="absolute top-3 start-3 bg-gold text-forest-deep font-bold border-none text-[10px]">
                  {catLabel(active.category, t)}
                </Badge>
              </div>
              <DialogHeader className="p-5 sm:p-6 text-start sm:text-start space-y-1.5">
                <DialogTitle className="text-lg font-extrabold leading-snug">{active.title}</DialogTitle>
                {active.caption && (
                  <DialogDescription className="text-sm leading-relaxed">{active.caption}</DialogDescription>
                )}
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
