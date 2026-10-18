"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, formatDateL10n, type Locale } from "@/lib/i18n";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Label kategori dari kamus; kategori tak dikenal ditampilkan apa adanya. */
function catLabel(cat: string, t: (k: string) => string): string {
  const key = `agenda.cat.${cat}`;
  const val = t(key);
  return val === key ? cat : val;
}

const locTag = (locale: Locale) => (locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-GB");

function DateBlock({ iso, locale }: { iso: string; locale: Locale }) {
  const d = new Date(iso);
  const loc = locTag(locale);
  return (
    <div
      aria-hidden
      className="shrink-0 w-16 rounded-2xl bg-gradient-to-b from-primary to-forest text-white text-center py-2.5 shadow-md"
    >
      <p className="text-2xl font-extrabold leading-none">{d.toLocaleDateString(loc, { day: "numeric" })}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide">
        {d.toLocaleDateString(loc, { month: "short" })}
      </p>
      <p className="text-[10px] opacity-75">{d.toLocaleDateString(loc, { year: "numeric" })}</p>
    </div>
  );
}

function EventCard({ ev, locale, past }: { ev: EventItem; locale: Locale; past?: boolean }) {
  const { t } = useT();
  const start = new Date(ev.startsAt);
  const end = ev.endsAt ? new Date(ev.endsAt) : null;
  const ongoing = !!end && Date.now() >= start.getTime() && Date.now() <= end.getTime();
  const sameDay = !!end && start.toDateString() === end.toDateString();
  const timeFmt = (d: Date) => d.toLocaleTimeString(locTag(locale), { hour: "2-digit", minute: "2-digit" });

  return (
    <Reveal>
      <article
        className={cn(
          "h-full rounded-2xl border bg-card p-5 shadow-sm hover:shadow-lg transition-shadow flex gap-4",
          past && "opacity-90"
        )}
      >
        <DateBlock iso={ev.startsAt} locale={locale} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
              {catLabel(ev.category, t)}
            </Badge>
            {ongoing && (
              <Badge
                className="text-[10px] font-bold bg-gold text-forest-deep border-none"
                aria-label={t("agenda.ongoingAria")}
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-deep animate-pulse me-1" />
                {t("agenda.badgeOngoing")}
              </Badge>
            )}
          </div>
          <h3 className={cn("mt-2 font-bold leading-snug", past ? "text-sm" : "text-base")}>{ev.title}</h3>
          <p
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
            aria-label={t("agenda.locationAria")}
          >
            <Icon name="map-pin" className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{ev.location}</span>
          </p>
          <p
            className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground"
            aria-label={t("agenda.dateAria")}
          >
            <Icon name="clock" className="h-3.5 w-3.5 text-primary shrink-0" />
            {formatDateL10n(ev.startsAt, locale)}
            {end &&
              (sameDay ? (
                <span dir="ltr">
                  {" · "}
                  {timeFmt(start)} – {timeFmt(end)}
                </span>
              ) : (
                <span> · {t("agenda.until", { date: formatDateL10n(ev.endsAt, locale) })}</span>
              ))}
          </p>
          {ev.description && (
            <p className={cn("mt-2 text-xs text-muted-foreground leading-relaxed", !past && "line-clamp-2")}>
              {ev.description}
            </p>
          )}
        </div>
      </article>
    </Reveal>
  );
}

function SectionHead({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{count}</span>
      )}
      <span aria-hidden className="flex-1 h-px bg-border" />
    </div>
  );
}

export function AgendaView() {
  const { t, locale } = useT();
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    apiGet<EventItem[]>("/api/events")
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: EventItem[] = [];
    const pa: EventItem[] = [];
    for (const ev of events ?? []) {
      (new Date(ev.startsAt).getTime() >= now ? up : pa).push(ev);
    }
    up.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    pa.sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
    return { upcoming: up, past: pa.slice(0, 4) };
  }, [events]);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("agenda.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("agenda.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("agenda.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {!events ? (
            <div className="space-y-4" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {/* MENDATANG */}
              <div>
                <SectionHead icon="calendar" title={t("agenda.sectionUpcoming")} count={upcoming.length} />
                {upcoming.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border bg-muted/30">
                    <Icon aria-hidden name="calendar" className="h-10 w-10 mx-auto text-muted-foreground/60" />
                    <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">{t("agenda.emptyUpcoming")}</p>
                  </div>
                ) : (
                  <div className="space-y-4" aria-label={t("agenda.upcomingAria")}>
                    {upcoming.map((ev) => (
                      <EventCard key={ev.id} ev={ev} locale={locale} />
                    ))}
                  </div>
                )}
              </div>

              {/* TELAH TERLAKSANA */}
              {past.length > 0 && (
                <div>
                  <SectionHead icon="clock" title={t("agenda.sectionPast")} count={past.length} />
                  <div className="space-y-4" aria-label={t("agenda.pastAria")}>
                    {past.map((ev) => (
                      <EventCard key={ev.id} ev={ev} locale={locale} past />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
