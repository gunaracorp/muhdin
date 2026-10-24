"use client";

/**
 * Task 51 — PpiuPpihkDashboard: konsol operasional PPIU & PPIHK
 * (#/dashboard/ppiu-pihk, kartu ke-4 DashboardHub).
 *
 * Data:
 *   GET  /api/ppiu-pihk       → ringkasan + direktori perusahaan + log (publik)
 *   POST /api/ppiu-pihk/sync  → jalankan engine sinkronisasi Nusuk
 *                               (rate-limited, sandbox, audit log)
 *
 * Fitur: strip status koneksi Nusuk, 4 kartu statistik (PPIU / PPIHK /
 * izin aktif / kepatuhan), direktori perusahaan dengan filter jenis +
 * pencarian, sinkronisasi global & per-perusahaan, riwayat sinkronisasi.
 * i18n penuh (id/en/ar) lewat namespace "ppk".
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend, timeAgo } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type PermitStat = {
  total: number;
  active: number;
  pending: number;
  expired: number;
  rejected: number;
  lastSyncedAt: string | null;
};

type Company = {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  licenseNo: string;
  rating: number;
  status: string;
  memberSince: number;
  description: string | null;
  permits: PermitStat;
  eligibility: { code: string; label: string; icon: string }[];
};

type SyncLog = {
  id: string;
  type: string;
  status: string;
  message: string;
  recordsAffected: number;
  durationMs: number;
  createdAt: string;
};

type PpkData = {
  summary: {
    totalPpiu: number;
    totalPihk: number;
    verified: number;
    provinces: number;
    permits: { total: number; active: number; pending: number; expired: number; rejected: number };
    compliance: number;
    companiesWithActive: number;
    connection: {
      environment: string;
      status: string;
      autoSync: boolean;
      totalSyncs: number;
      lastSyncAt: string | null;
    };
  };
  companies: Company[];
  logs: SyncLog[];
};

type SyncResult = {
  summary: { created: number; updated: number; expired: number; skipped: number; recordsAffected: number; durationMs: number };
  message: string;
};

type TypeFilter = "ALL" | "PPIU" | "PIHK";

/** Inisial nama perusahaan untuk avatar kartu (maks 2 huruf). */
function initials(name: string) {
  return name
    .replace(/^(PT|CV|KBIHU|Koperasi|PIHK)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function PpiuPpihkDashboard() {
  const { t } = useT();
  const [data, setData] = useState<PpkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TypeFilter>("ALL");
  const [query, setQuery] = useState("");
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<PpkData>("/api/ppiu-pihk");
      setData(res);
    } catch (e) {
      setError((e as Error).message || t("ppk.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const runSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await apiSend<SyncResult>("/api/ppiu-pihk/sync", "POST", {});
      toast({
        title: t("ppk.syncOkTitle"),
        description: t("ppk.syncOkDesc", {
          created: res.summary.created,
          updated: res.summary.updated,
          expired: res.summary.expired,
          ms: res.summary.durationMs,
        }),
      });
      await load();
    } catch (e) {
      const msg = (e as Error).message;
      toast({
        title: msg.toLowerCase().includes("terlalu banyak") ? t("ppk.rateTitle") : t("ppk.syncFailTitle"),
        description: msg.toLowerCase().includes("terlalu banyak") ? t("ppk.rateDesc") : msg,
        variant: "destructive",
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const runSyncOne = async (company: Company) => {
    setSyncingId(company.id);
    try {
      const res = await apiSend<SyncResult>("/api/ppiu-pihk/sync", "POST", { memberId: company.id });
      toast({
        title: `${company.name} — ${t("ppk.syncOkTitle")}`,
        description: t("ppk.syncOkDesc", {
          created: res.summary.created,
          updated: res.summary.updated,
          expired: res.summary.expired,
          ms: res.summary.durationMs,
        }),
      });
      await load();
    } catch (e) {
      const msg = (e as Error).message;
      toast({
        title: msg.toLowerCase().includes("terlalu banyak") ? t("ppk.rateTitle") : t("ppk.syncFailTitle"),
        description: msg.toLowerCase().includes("terlalu banyak") ? t("ppk.rateDesc") : msg,
        variant: "destructive",
      });
    } finally {
      setSyncingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.companies.filter((c) => {
      if (filter !== "ALL" && c.type !== filter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q) ||
        c.licenseNo.toLowerCase().includes(q)
      );
    });
  }, [data, filter, query]);

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="bg-forest-deep px-4 py-16 text-center text-sm text-emerald-50/85 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/25 border-t-gold" />
            <p>{t("ppk.loading")}</p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- ERROR ---------- */
  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-md space-y-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-500/10">
            <Icon name="alert-triangle" className="h-7 w-7 text-rose-500" aria-hidden />
          </span>
          <p className="font-semibold">{error || t("ppk.loadError")}</p>
          <Button onClick={() => void load()} className="h-11 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="refresh" className="me-2 h-4 w-4" aria-hidden />
            {t("ppk.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const { summary } = data;
  const conn = summary.connection;
  const connected = conn.status === "CONNECTED";

  return (
    <div className="flex flex-col">
      {/* ============ HERO + STATUS KONEKSI ============ */}
      <section aria-label={t("ppk.title")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div
          aria-hidden
          className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl animate-float-soft"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
              <Icon name="satellite" className="h-3.5 w-3.5" aria-hidden />
              {t("ppk.eyebrow")}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              {t("ppk.title").split("&")[0]}
              <span className="text-gold-gradient">&amp; {t("ppk.title").split("&").slice(1).join("&").trim()}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50/85 sm:text-base">
              {t("ppk.subtitle")}
            </p>
          </Reveal>

          {/* status koneksi + aksi */}
          <Reveal delay={0.1}>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  <Icon name="database-zap" className="h-3.5 w-3.5 text-gold-soft" aria-hidden />
                  {t("ppk.connEnv")}: {conn.environment}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                    connected
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/40 bg-rose-400/10 text-rose-300"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      connected ? "animate-pulse bg-emerald-400" : "bg-rose-400"
                    )}
                    aria-hidden
                  />
                  {t("ppk.connStatus")}: {conn.status}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  <Icon name="refresh" className="h-3.5 w-3.5 text-gold-soft" aria-hidden />
                  {t("ppk.connSyncs")}: {conn.totalSyncs}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  <Icon name="clock" className="h-3.5 w-3.5 text-gold-soft" aria-hidden />
                  {t("ppk.connLast")}: {timeAgo(conn.lastSyncAt)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={() => void runSyncAll()}
                  disabled={syncingAll}
                  className="h-11 bg-gold px-6 font-bold text-forest-deep shadow-lg shadow-gold/25 transition-all hover:bg-gold-deep hover:shadow-xl disabled:opacity-70"
                  aria-label={t("ppk.syncAll")}
                >
                  <Icon
                    name={syncingAll ? "loader-2" : "refresh"}
                    className={cn("me-2 h-4 w-4", syncingAll && "animate-spin")}
                    aria-hidden
                  />
                  {syncingAll ? t("ppk.syncing") : t("ppk.syncAll")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("nusuk")}
                  className="h-11 border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  <Icon name="moon-star" className="me-2 h-4 w-4" aria-hidden />
                  {t("ppk.nusukHub")}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ STATISTIK ============ */}
      <section aria-label="statistik" className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            <StaggerItem>
              <Card className="h-full border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15">
                    <Icon name="building-2" className="h-6 w-6 text-gold-deep dark:text-gold-soft" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-3xl font-extrabold leading-none">{summary.totalPpiu}</p>
                    <p className="mt-1.5 truncate text-sm font-semibold">{t("ppk.statPpiu")}</p>
                    <p className="text-xs text-muted-foreground">
                      {summary.totalPpiu} {t("ppk.statPpiuSub")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="h-full border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <Icon name="landmark" className="h-6 w-6 text-primary" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-3xl font-extrabold leading-none">{summary.totalPihk}</p>
                    <p className="mt-1.5 truncate text-sm font-semibold">{t("ppk.statPihk")}</p>
                    <p className="text-xs text-muted-foreground">
                      {summary.totalPihk} {t("ppk.statPihkSub")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="h-full border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/10">
                    <Icon name="badge-check" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-3xl font-extrabold leading-none">{summary.permits.active}</p>
                    <p className="mt-1.5 truncate text-sm font-semibold">{t("ppk.statActive")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("ppk.statActiveSub", { total: summary.permits.total })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="h-full border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15">
                    <Icon name="gauge" className="h-6 w-6 text-gold-deep dark:text-gold-soft" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-3xl font-extrabold leading-none">{summary.compliance}%</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {summary.provinces} {t("ppk.statProvinces")}
                      </p>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-semibold">{t("ppk.statCompliance")}</p>
                    <Progress value={summary.compliance} className="mt-2 h-1.5" aria-label={t("ppk.statCompliance")} />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ============ DIREKTORI PERUSAHAAN ============ */}
      <section aria-label={t("ppk.dirTitle")} className="pb-12 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("ppk.dirTitle")}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("ppk.dirSub")}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as TypeFilter)}>
                  <TabsList>
                    <TabsTrigger value="ALL">{t("ppk.tabAll")}</TabsTrigger>
                    <TabsTrigger value="PPIU">{t("ppk.tabPpiu")}</TabsTrigger>
                    <TabsTrigger value="PIHK">{t("ppk.tabPihk")}</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("ppk.searchPlaceholder")}
                    className="h-10 w-full min-w-56 ps-9 sm:w-72"
                    aria-label={t("ppk.searchPlaceholder")}
                  />
                </div>
              </div>
            </div>
          </Reveal>

          {filtered.length === 0 ? (
            <Reveal delay={0.05}>
              <div className="mt-8 grid place-items-center rounded-3xl border border-dashed py-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-muted">
                  <Icon name="inbox" className="h-7 w-7 text-muted-foreground" aria-hidden />
                </span>
                <p className="mt-4 font-semibold">{t("ppk.empty")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("ppk.emptySub")}</p>
              </div>
            </Reveal>
          ) : (
            <Stagger className="mt-7 grid gap-4 lg:grid-cols-2 xl:grid-cols-3" stagger={0.06}>
              {filtered.map((c) => {
                const isPpiu = c.type === "PPIU";
                const busy = syncingId === c.id || syncingAll;
                return (
                  <StaggerItem key={c.id}>
                    <Card className="flex h-full flex-col border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                      <CardContent className="flex flex-1 flex-col p-5">
                        {/* identitas */}
                        <div className="flex items-start gap-3.5">
                          <span
                            className={cn(
                              "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-extrabold",
                              isPpiu ? "bg-gold/15 text-gold-deep dark:text-gold-soft" : "bg-primary/10 text-primary"
                            )}
                            aria-hidden
                          >
                            {initials(c.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-bold leading-snug sm:text-base">{c.name}</h3>
                              <Badge
                                className={cn(
                                  "shrink-0 border font-bold",
                                  isPpiu
                                    ? "border-gold/40 bg-gold/10 text-gold-deep dark:text-gold-soft"
                                    : "border-primary/30 bg-primary/10 text-primary"
                                )}
                              >
                                {isPpiu ? t("ppk.tabPpiu") : t("ppk.tabPihk")}
                              </Badge>
                            </div>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Icon name="map-pin" className="h-3 w-3" aria-hidden />
                                {c.city}, {c.province}
                              </span>
                              <span aria-hidden>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Icon name="star" className="h-3 w-3 text-gold" aria-hidden />
                                {c.rating.toFixed(1)}
                              </span>
                              <span aria-hidden>·</span>
                              <span>
                                {t("ppk.since")} {c.memberSince}
                              </span>
                            </p>
                            <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                              <Icon name="shield-check" className="h-3 w-3 text-primary" aria-hidden />
                              {t("ppk.license")}: {c.licenseNo}
                            </p>
                            {c.status !== "TERVERIFIKASI" && (
                              <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-gold-deep dark:text-gold-soft">
                                <Icon name="clock" className="h-3 w-3" aria-hidden />
                                {t("ppk.unverified")}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* izin */}
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {c.permits.total === 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
                              <Icon name="info" className="h-3 w-3" aria-hidden />
                              {t("ppk.noPermit")}
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                                <Icon name="badge-check" className="h-3 w-3" aria-hidden />
                                {c.permits.active} {t("ppk.permitsActive")}
                              </span>
                              {c.permits.pending > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold-deep dark:text-gold-soft">
                                  <Icon name="clock" className="h-3 w-3" aria-hidden />
                                  {c.permits.pending} {t("ppk.permitsPending")}
                                </span>
                              )}
                              {c.permits.expired > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                                  <Icon name="alert-triangle" className="h-3 w-3" aria-hidden />
                                  {c.permits.expired} {t("ppk.permitsExpired")}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* lingkup eligibility */}
                        {c.eligibility.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5" title={t("ppk.eligibility")}>
                            {c.eligibility.map((e) => (
                              <span
                                key={e.code}
                                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                              >
                                <Icon name={e.icon} className="h-3 w-3 text-primary" aria-hidden />
                                {e.code}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* footer */}
                        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
                          <p className="text-[11px] text-muted-foreground">
                            {t("ppk.lastSync")}:{" "}
                            <span className="font-semibold text-foreground/80">
                              {c.permits.lastSyncedAt ? timeAgo(c.permits.lastSyncedAt) : t("ppk.never")}
                            </span>
                          </p>
                          <Button
                            size="sm"
                            onClick={() => void runSyncOne(c)}
                            disabled={busy || c.status !== "TERVERIFIKASI"}
                            className="h-9 bg-gradient-to-r from-primary to-forest px-4 text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-60"
                            aria-label={`${t("ppk.syncBtn")} — ${c.name}`}
                          >
                            <Icon
                              name={syncingId === c.id ? "loader-2" : "refresh"}
                              className={cn("me-1.5 h-3.5 w-3.5", syncingId === c.id && "animate-spin")}
                              aria-hidden
                            />
                            {syncingId === c.id ? t("ppk.syncing") : t("ppk.syncBtn")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </div>
      </section>

      {/* ============ RIWAYAT SINKRONISASI ============ */}
      <section aria-label={t("ppk.logTitle")} className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-extrabold sm:text-xl">
                      <Icon name="activity" className="h-5 w-5 text-primary" aria-hidden />
                      {t("ppk.logTitle")}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t("ppk.logSub")}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/5 font-bold text-primary">
                    {data.logs.length}
                  </Badge>
                </div>

                {data.logs.length === 0 ? (
                  <p className="mt-6 rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                    {t("ppk.logEmpty")}
                  </p>
                ) : (
                  <ul className="scrollbar-thin mt-5 max-h-96 space-y-3 overflow-y-auto pe-1">
                    {data.logs.map((l) => (
                      <li key={l.id} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
                        <span
                          className={cn(
                            "mt-1 h-2 w-2 shrink-0 rounded-full",
                            l.status === "SUCCESS" ? "bg-primary" : "bg-rose-500"
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-border/80 bg-muted/60 px-1.5 py-0 font-mono text-[10px] font-bold uppercase text-muted-foreground"
                            >
                              {l.type}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{timeAgo(l.createdAt)}</span>
                            {l.recordsAffected > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                                <Icon name="database-zap" className="h-3 w-3" aria-hidden />
                                {t("ppk.logRecords", { n: l.recordsAffected })}
                              </span>
                            )}
                            {l.durationMs > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Icon name="timer" className="h-3 w-3" aria-hidden />
                                {t("ppk.logDuration", { ms: l.durationMs })}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-foreground/85 sm:text-sm">{l.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
