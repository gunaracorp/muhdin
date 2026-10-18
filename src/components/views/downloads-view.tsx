"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, formatNumberL10n } from "@/lib/i18n";
import type { ResourceItem } from "@/lib/types";

/** Label kategori dari kamus; kategori tak dikenal ditampilkan apa adanya. */
function groupLabel(cat: string, t: (k: string) => string): string {
  const key = `downloads.group${cat}`;
  const val = t(key);
  return val === key ? cat : val;
}

/** Urutan kelompok standar; kategori lain mengikuti urutan kemunculan. */
const GROUP_ORDER = ["Formulir", "Panduan", "Kebijakan", "Lainnya"];

function ResourceRow({ item, busy, onDownload }: { item: ResourceItem; busy: boolean; onDownload: (it: ResourceItem) => void }) {
  const { t, locale } = useT();
  return (
    <Reveal>
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="shrink-0 h-11 w-11 rounded-xl bg-primary/10 grid place-items-center text-primary">
          <Icon name="file-text" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm leading-snug">{item.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {item.description || t("downloads.descEmpty")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold bg-muted text-foreground/70 border-border">
              {item.fileType}
            </Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Icon name="download" className="h-3 w-3" />
              {t("downloads.downloadsCount", { n: formatNumberL10n(item.downloads, locale) })}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onDownload(item)}
          aria-label={t("downloads.btnDownloadAria", { title: item.title })}
          className="shrink-0 w-full sm:w-auto"
        >
          {busy ? (
            <Icon name="loader-2" className="h-4 w-4 me-1.5 animate-spin" />
          ) : (
            <Icon name="download" className="h-4 w-4 me-1.5" />
          )}
          {t("downloads.btnDownload")}
        </Button>
      </div>
    </Reveal>
  );
}

export function DownloadsView() {
  const { t } = useT();
  const [items, setItems] = useState<ResourceItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    apiGet<ResourceItem[]>("/api/resources")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const groups = useMemo(() => {
    if (!items) return [];
    const cats: string[] = [];
    for (const it of items) if (!cats.includes(it.category)) cats.push(it.category);
    const ordered = [...GROUP_ORDER.filter((c) => cats.includes(c)), ...cats.filter((c) => !GROUP_ORDER.includes(c))];
    return ordered.map((c) => ({ category: c, items: items.filter((i) => i.category === c) }));
  }, [items]);

  const onDownload = async (it: ResourceItem) => {
    setBusyId(it.id);
    try {
      const res = await apiSend<{ ok: boolean; fileUrl: string }>(`/api/resources/${it.id}/download`, "POST");
      setCounts((c) => ({ ...c, [it.id]: (c[it.id] ?? it.downloads) + 1 }));
      if (res?.fileUrl) window.location.assign(res.fileUrl);
    } catch (e) {
      toast({
        title: t("downloads.toastFailTitle"),
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("downloads.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("downloads.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("downloads.subtitle")}</p>
          </Reveal>

          {/* Task 35-f — Kit Promosi DAFTAR & IURAN GRATIS (banner WA/IG) */}
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-gold/40 bg-gold/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 shrink-0 rounded-xl bg-gold/20 grid place-items-center text-gold">
                  <Icon name="megaphone" className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-gold-soft">{t("downloads.kitTitle")}</p>
                  <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-emerald-50/75">
                    {t("downloads.kitDesc")}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.open("/promo/index.html", "_blank", "noopener,noreferrer")}
                className="h-11 shrink-0 bg-gold text-xs font-extrabold tracking-widest text-forest-deep hover:bg-gold-soft"
              >
                <Icon name="megaphone" className="me-2 h-4 w-4" aria-hidden />
                {t("downloads.kitCta")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {!items ? (
            <div className="space-y-4" aria-busy="true" aria-label={t("downloads.loading")}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center">
              <Icon aria-hidden name="file-text" className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <h3 className="mt-3 font-bold">{t("downloads.emptyTitle")}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("downloads.emptyDesc")}</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groups.map((g) => (
                <div key={g.category}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-9 w-9 rounded-xl bg-gold/15 grid place-items-center text-gold-deep shrink-0">
                      <Icon name="file-text" className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-extrabold">{groupLabel(g.category, t)}</h2>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                      {g.items.length}
                    </span>
                    <span aria-hidden className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-3" aria-label={t("downloads.groupAria", { name: groupLabel(g.category, t) })}>
                    {g.items.map((it) => (
                      <ResourceRow
                        key={it.id}
                        item={{ ...it, downloads: counts[it.id] ?? it.downloads }}
                        busy={busyId === it.id}
                        onDownload={onDownload}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
