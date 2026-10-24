"use client";

/**
 * v6.0 — Direktori Darurat Tanah Suci (live dari database): KJRI, KKI,
 * rumah sakit, konsul haji, nomor darurat. Diintegrasikan ke #/darurat
 * sebagai seksi dinamis — panitia memelihara data lewat CMS.
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import type { SosPointItem } from "@/lib/types";

const CATS = ["HOSPITAL", "CLINIC", "EMBASSY", "CONSULATE", "CONSUL_HAJJ", "KKI", "POLICE", "EMERGENCY"];
const CAT_ICON: Record<string, string> = {
  HOSPITAL: "heart-pulse",
  CLINIC: "stethoscope",
  EMBASSY: "landmark",
  CONSULATE: "landmark",
  CONSUL_HAJJ: "moon-star",
  KKI: "heart-pulse",
  POLICE: "shield-check",
  EMERGENCY: "siren",
};

export function SosDirectory() {
  const { t } = useT();
  const [points, setPoints] = useState<SosPointItem[] | null>(null);
  const [cat, setCat] = useState("ALL");
  const [city, setCity] = useState("ALL");

  useEffect(() => {
    apiGet<SosPointItem[]>("/api/sos-points").then(setPoints).catch(() => setPoints([]));
  }, []);

  const cities = useMemo(() => [...new Set((points ?? []).map((p) => p.city).filter(Boolean))], [points]);
  const list = useMemo(
    () => (points ?? []).filter((p) => (cat === "ALL" || p.category === cat) && (city === "ALL" || p.city === city)),
    [points, cat, city]
  );

  return (
    <div>
      <SectionHeading eyebrow="sos" title={t("sos.title")} subtitle={t("sos.subtitle")} />

      {/* Nomor darurat nasional */}
      <p className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-center text-xs font-bold text-red-700 dark:text-red-300">
        {t("sos.noteEmergency")}
      </p>

      {/* Filter */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("sos.filterAll")}>
          <button
            type="button"
            onClick={() => setCat("ALL")}
            aria-pressed={cat === "ALL"}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              cat === "ALL" ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
            )}
          >
            {t("sos.filterAll")}
          </button>
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                cat === c ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
              )}
            >
              {t(`sos.cat${c}`)}
            </button>
          ))}
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label={t("sos.filterCity")}
          className="h-9 rounded-full border border-border bg-card px-3 text-xs font-bold sm:ms-auto"
        >
          <option value="ALL">{t("sos.filterCity")}</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Daftar */}
      {!points ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-muted/30 p-10 text-center">
          <Icon name="siren" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">{t("sos.empty")}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article
              key={p.id}
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm",
                p.featured && "border-gold/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-600/10 text-red-700 dark:text-red-300">
                  <Icon name={CAT_ICON[p.category] ?? "life-buoy"} className="h-5 w-5" aria-hidden />
                </span>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                    {t(`sos.cat${p.category}`)}
                  </Badge>
                  {p.featured && (
                    <Badge variant="outline" className="border-gold/40 bg-gold/15 text-[10px] font-bold text-gold-deep">
                      <Icon name="star" className="h-3 w-3" aria-hidden /> {t("sos.featured")}
                    </Badge>
                  )}
                </div>
              </div>
              <h3 className="mt-3 font-extrabold leading-snug">{p.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {[p.city, p.country].filter(Boolean).join(" · ")} · {p.hours}
              </p>
              {p.address && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{p.address}</p>}
              {p.note && <p className="mt-1.5 line-clamp-2 text-[11px] italic text-muted-foreground/80">{p.note}</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <a
                  href={`tel:${p.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-red-700"
                >
                  <Icon name="phone" className="h-3.5 w-3.5" aria-hidden />
                  {t("sos.call")} <span dir="ltr">{p.phone}</span>
                </a>
                {p.phone2 && (
                  <a
                    href={`tel:${p.phone2.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold text-muted-foreground transition hover:text-primary"
                  >
                    <Icon name="phone" className="h-3.5 w-3.5" aria-hidden />
                    <span dir="ltr">{p.phone2}</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
