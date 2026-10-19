"use client";

/**
 * AgendaDetail (v4.1) — HALAMAN SENDIRI untuk setiap agenda kegiatan.
 * Route: #/agenda/<id>
 *
 * Detail penuh satu kegiatan: tanggal/jam (mulai–selesai), status hidup
 * (mendatang / berlangsung / selesai), lokasi + tautan Google Maps,
 * deskripsi lengkap, tombol Tambah ke Google Calendar, CTA WhatsApp,
 * dan agenda terkait. Data dari /api/events (dataset kecil — cari klien).
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { useT, formatDateL10n, type Locale } from "@/lib/i18n";
import type { EventItem } from "@/lib/types";
import {
  DetailHero, DetailLoading, DetailNotFound, DetailSectionHead,
  InfoRow, RelatedLinkCard, WaCtaButton,
} from "@/components/views/detail-shell";

const locTag = (locale: Locale) => (locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-GB");

function catLabel(cat: string, t: (k: string) => string): string {
  const key = `agenda.cat.${cat}`;
  const val = t(key);
  return val === key ? cat : val;
}

function gcalLink(ev: EventItem): string {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = ev.endsAt ? fmt(ev.endsAt) : fmt(new Date(new Date(ev.startsAt).getTime() + 2 * 3600_000).toISOString());
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${fmt(ev.startsAt)}/${end}`,
    location: ev.location,
    details: ev.description?.slice(0, 300) || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function AgendaDetail({ id }: { id: string }) {
  const { t, locale } = useT();
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    apiGet<EventItem[]>("/api/events")
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const ev = useMemo(() => events?.find((e) => e.id === id) ?? null, [events, id]);
  const related = useMemo(
    () => (ev ? (events ?? []).filter((e) => e.id !== ev.id).slice(0, 3) : []),
    [events, ev]
  );

  if (!events) return <DetailLoading />;

  if (!ev) {
    return (
      <DetailNotFound
        message={t("detail.agenda.notFound")}
        backTo="/agenda"
        backLabel={t("agenda.title")}
      />
    );
  }

  const start = new Date(ev.startsAt);
  const end = ev.endsAt ? new Date(ev.endsAt) : null;
  const now = Date.now();
  const ongoing = !!end && now >= start.getTime() && now <= end.getTime();
  const past = now > (end ? end.getTime() : start.getTime());
  const sameDay = !!end && start.toDateString() === end.toDateString();
  const timeFmt = (d: Date) => d.toLocaleTimeString(locTag(locale), { hour: "2-digit", minute: "2-digit" });
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`;

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <DetailHero
        eyebrow={t("agenda.eyebrow")}
        title={ev.title}
        backTo="/agenda"
        backLabel={t("agenda.title")}
        badge={
          <>
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
              {catLabel(ev.category, t)}
            </Badge>
            {ongoing && (
              <Badge className="gap-1.5 border-none bg-gold text-forest-deep">
                <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest-deep" />
                {t("agenda.badgeOngoing")}
              </Badge>
            )}
            {past && !ongoing && (
              <Badge variant="outline" className="border-white/30 bg-white/10 text-white/85">
                {t("detail.agenda.past")}
              </Badge>
            )}
          </>
        }
      >
        {/* Blok tanggal besar di hero */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-emerald-50/90">
          <span className="flex items-center gap-2">
            <Icon name="calendar" className="h-4 w-4 text-gold" aria-hidden />
            {formatDateL10n(ev.startsAt, locale)}
            {end &&
              (sameDay ? (
                <span dir="ltr">· {timeFmt(start)} – {timeFmt(end)}</span>
              ) : (
                <span>· {t("agenda.until", { date: formatDateL10n(ev.endsAt, locale) })}</span>
              ))}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="map-pin" className="h-4 w-4 text-gold" aria-hidden />
            {ev.location}
          </span>
        </div>
      </DetailHero>

      {/* ===== KONTEN ===== */}
      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-8">
            <div>
              <DetailSectionHead icon="scroll-text" title={t("detail.agenda.about")} />
              <div className="rounded-2xl border bg-card p-6 leading-relaxed text-foreground/90 shadow-sm whitespace-pre-wrap">
                {ev.description || t("detail.agenda.noDesc")}
              </div>
            </div>

            <div>
              <DetailSectionHead icon="calendar" title={t("detail.agenda.when")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon="clock" label={t("detail.agenda.start")} value={`${formatDateL10n(ev.startsAt, locale)}${!sameDay || end ? ` · ${timeFmt(start)}` : ""}`} />
                <InfoRow icon="clock" label={t("detail.agenda.end")} value={end ? `${formatDateL10n(ev.endsAt, locale)} · ${timeFmt(end)}` : "—"} />
                <InfoRow icon="map-pin" label={t("detail.agenda.location")} value={ev.location} href={mapsHref} external />
                <InfoRow icon="tag" label={t("detail.agenda.category")} value={catLabel(ev.category, t)} />
              </div>
            </div>

            {related.length > 0 && (
              <div>
                <DetailSectionHead icon="users" title={t("detail.agenda.related")} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((e) => (
                    <RelatedLinkCard
                      key={e.id}
                      href={`/agenda/${e.id}`}
                      icon="calendar"
                      title={e.title}
                      meta={formatDateL10n(e.startsAt, locale)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar aksi */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                <Icon name="bell-ring" className="h-4 w-4 text-primary" aria-hidden />
                {t("detail.common.contactTitle")}
              </h2>
              <div className="mt-4 space-y-2.5">
                <a
                  href={gcalLink(ev)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
                >
                  <Icon name="calendar" className="h-4 w-4" aria-hidden />
                  {t("detail.agenda.gcal")}
                </a>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
                >
                  <Icon name="map-pin" className="h-4 w-4" aria-hidden />
                  {t("detail.agenda.map")}
                </a>
                <WaCtaButton
                  className="w-full justify-center"
                  message={`Assalamu'alaikum, saya ingin bertanya tentang agenda "${ev.title}" pada ${formatDateL10n(ev.startsAt, "id")}.`}
                  label={t("detail.agenda.ask")}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-primary">
                <Icon name="info" className="h-4 w-4" aria-hidden />
                {t("detail.common.infoTitle")}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("detail.common.infoBody")}</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
