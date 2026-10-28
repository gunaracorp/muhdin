"use client";

/**
 * GalleryDetail (v4.1) — HALAMAN SENDIRI untuk setiap dokumentasi galeri.
 * Route: #/galeri/<id>
 *
 * Satu foto/album per halaman: gambar besar, keterangan penuh, kategori,
 * tanggal unggah, navigasi Sebelumnya/Selanjutnya antar dokumentasi, dan
 * grid dokumentasi lain. Data dari /api/gallery (cari di sisi klien).
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { useT, formatDateL10n } from "@/lib/i18n";
import type { GalleryItem } from "@/lib/types";
import {
  DetailHero, DetailLoading, DetailNotFound, DetailSectionHead,
  InfoRow, RelatedLinkCard,
} from "@/components/views/detail-shell";

export function GalleryDetail({ id }: { id: string }) {
  const { t, locale } = useT();
  const [items, setItems] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    apiGet<GalleryItem[]>("/api/gallery")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const item = useMemo(() => items?.find((g) => g.id === id) ?? null, [items, id]);
  const idx = useMemo(() => (items ? items.findIndex((g) => g.id === id) : -1), [items, id]);
  const prev = idx > 0 ? items?.[idx - 1] : undefined;
  const next = items && idx >= 0 && idx < items.length - 1 ? items[idx + 1] : undefined;
  const related = useMemo(
    () => (items ? items.filter((g) => g.id !== id && g.category === item?.category).slice(0, 3) : []),
    [items, id, item]
  );

  if (!items) return <DetailLoading />;

  if (!item) {
    return (
      <DetailNotFound
        message={t("detail.gallery.notFound")}
        backTo="/galeri"
        backLabel={t("gallery.title")}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <DetailHero
        eyebrow={t("gallery.eyebrow")}
        title={item.title}
        backTo="/galeri"
        backLabel={t("gallery.title")}
        badge={
          <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
            {item.category}
          </Badge>
        }
      />

      {/* ===== KONTEN ===== */}
      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_340px]">
          {/* Gambar utama + navigasi */}
          <div className="min-w-0 space-y-6">
            <figure className="overflow-hidden rounded-3xl border bg-card shadow-lg">
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="max-h-[520px] w-full object-cover"
              />
            </figure>

            {/* Prev / Next */}
            <div className="grid grid-cols-2 gap-3">
              {prev ? (
                <button
                  type="button"
                  onClick={() => navigate(`galeri/${prev.id}`)}
                  className="group flex items-center gap-2 rounded-2xl border bg-card p-3.5 text-start shadow-sm transition hover:shadow-md"
                >
                  <Icon name="chevron-right" className="h-4 w-4 shrink-0 rotate-180 text-primary rtl:rotate-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("detail.gallery.prev")}</span>
                    <span className="block truncate text-sm font-bold group-hover:text-primary">{prev.title}</span>
                  </span>
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button
                  type="button"
                  onClick={() => navigate(`galeri/${next.id}`)}
                  className="group flex items-center justify-end gap-2 rounded-2xl border bg-card p-3.5 text-end shadow-sm transition hover:shadow-md"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("detail.gallery.next")}</span>
                    <span className="block truncate text-sm font-bold group-hover:text-primary">{next.title}</span>
                  </span>
                  <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-primary rtl:rotate-180" aria-hidden />
                </button>
              ) : (
                <span />
              )}
            </div>

            {related.length > 0 && (
              <div>
                <DetailSectionHead icon="instagram" title={t("detail.gallery.related")} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((g) => (
                    <RelatedLinkCard
                      key={g.id}
                      href={`/galeri/${g.id}`}
                      icon="instagram"
                      title={g.title}
                      meta={g.category}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div>
              <DetailSectionHead icon="file-text" title={t("detail.gallery.about")} />
              <div className="space-y-3">
                <InfoRow icon="tag" label={t("detail.gallery.category")} value={item.category} />
                <InfoRow icon="calendar" label={t("detail.gallery.date")} value={formatDateL10n(item.createdAt, locale)} />
                {item.caption && (
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("detail.gallery.caption")}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{item.caption}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("galeri")}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
            >
              <Icon name="instagram" className="h-4 w-4" aria-hidden />
              {t("detail.gallery.openAll")}
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}
