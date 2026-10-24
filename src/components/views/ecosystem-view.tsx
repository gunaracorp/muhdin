"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { navigate } from "@/hooks/use-hash-route";
import { CLUSTERS } from "@/lib/constants";
import type { Ecosystem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Kode klaster (nilai DB) tetap utk logika/filter; label tampil lewat kamus. */
const CLUSTER_KEY: Record<string, string> = {
  "Akses & Mobilitas": "ecosystem.cluster.access",
  "Pengalaman Ibadah": "ecosystem.cluster.worship",
  "Nilai Tambah & Jaminan Mutu": "ecosystem.cluster.quality",
};

export function EcosystemView({ focusNumber }: { focusNumber?: string }) {
  const { t, locale } = useT();
  const [ecosystems, setEcosystems] = useState<Ecosystem[] | null>(null);
  const [cluster, setCluster] = useState<string>("all");
  const [q, setQ] = useState("");
  /** Task 30 — picked: kartu yang diklik manual; deepLinked: dari URL #/ekosistem/<nomor>. */
  const [picked, setPicked] = useState<Ecosystem | null>(null);

  const clusterLabel = (name: string) => {
    const key = CLUSTER_KEY[name];
    return key ? t(key) : name;
  };

  useEffect(() => {
    apiGet<Ecosystem[]>(`/api/ecosystems?locale=${locale}`)
      .then(setEcosystems)
      .catch(() => setEcosystems([]));
  }, [locale]);

  // Task 30 — deep-link #/ekosistem/<nomor> membuka dialog detail secara derived
  // (dipakai kartu ekosistem di Beranda & kolom Layanan di Footer).
  const deepLinked = useMemo<Ecosystem | null>(() => {
    if (!ecosystems || !focusNumber) return null;
    const num = parseInt(focusNumber, 10);
    if (Number.isNaN(num)) return null;
    return ecosystems.find((e) => e.number === num) ?? null;
  }, [ecosystems, focusNumber]);
  const selected = picked ?? deepLinked;

  const filtered = useMemo(() => {
    if (!ecosystems) return [];
    return ecosystems.filter((e) => {
      const okCluster = cluster === "all" || e.cluster === cluster;
      const okQ =
        !q ||
        e.name.toLowerCase().includes(q.toLowerCase()) ||
        e.scope.toLowerCase().includes(q.toLowerCase());
      return okCluster && okQ;
    });
  }, [ecosystems, cluster, q]);

  return (
    <div className="flex flex-col">
      {/* Banner */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("ecosystem.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("ecosystem.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("ecosystem.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      {/* Filter */}
      <section className="sticky top-16 z-30 glass border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-0.5">
            <FilterChip
              active={cluster === "all"}
              onClick={() => setCluster("all")}
              label={t("ecosystem.filterAll", { count: 13 })}
            />
            {CLUSTERS.map((c) => (
              <FilterChip
                key={c.name}
                active={cluster === c.name}
                onClick={() => setCluster(c.name)}
                label={clusterLabel(c.name)}
              />
            ))}
          </div>
          <div className="relative sm:ms-auto w-full sm:w-64">
            <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("ecosystem.searchPlaceholder")}
              aria-label={t("ecosystem.searchAria")}
              className="ps-9 h-9"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {!ecosystems ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Icon name="search" className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="mt-3 text-muted-foreground">{t("ecosystem.empty")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e, i) => (
                <Reveal key={e.id} delay={Math.min(i * 0.04, 0.4)}>
                  <button
                    onClick={() => setPicked(e)}
                    className="group h-full w-full text-left rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft shadow-md">
                        <Icon name={e.icon} className="h-6 w-6" />
                      </div>
                      <span className="text-4xl font-extrabold text-primary/10 group-hover:text-gold/40 transition-colors">
                        {String(e.number).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold leading-snug">{e.name}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{e.scope}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{clusterLabel(e.cluster)}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        {t("ecosystem.detail")} <Icon name="chevron-right" className="h-3.5 w-3.5 icon-flip" />
                      </span>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Detail dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (o) return;
          setPicked(null);
          // Bersihkan deep-link agar refresh tidak membuka dialog lagi.
          if (window.location.hash.includes("/ekosistem/")) navigate("ekosistem");
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft shadow-md">
                    <Icon name={selected.icon} className="h-7 w-7" />
                  </div>
                  <div>
                    <DialogDescription className="text-xs font-semibold text-gold-deep uppercase tracking-wide">
                      {t("ecosystem.detailEyebrow", {
                        number: String(selected.number).padStart(2, "0"),
                        cluster: clusterLabel(selected.cluster),
                      })}
                    </DialogDescription>
                    <DialogTitle className="text-2xl text-start mt-1">{selected.name}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-5 mt-2">
                {selected.image && (
                   
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="w-full h-52 object-cover rounded-xl bg-gradient-to-br from-forest to-primary"
                  />
                )}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
                    <Icon name="info" className="h-4 w-4" /> {t("ecosystem.aboutTitle")}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">{selected.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <h5 className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide">
                      <Icon name="target" className="h-3.5 w-3.5" /> {t("ecosystem.scopeTitle")}
                    </h5>
                    <p className="mt-1.5 text-sm text-foreground/80">{selected.scope}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <h5 className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide">
                      <Icon name="badge-check" className="h-3.5 w-3.5" /> {t("ecosystem.standardTitle")}
                    </h5>
                    <p className="mt-1.5 text-sm text-foreground/80">{selected.standard}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-gold/10 border border-gold/25 p-4 text-sm">
                  <p className="font-semibold text-gold-deep">{t("ecosystem.commitmentTitle")}</p>
                  <p className="mt-1 text-foreground/75">{t("ecosystem.commitmentText")}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
        active
          ? "bg-primary text-white shadow-md"
          : "bg-muted text-foreground/70 hover:bg-primary/10 hover:text-primary"
      )}
    >
      {label}
    </button>
  );
}
