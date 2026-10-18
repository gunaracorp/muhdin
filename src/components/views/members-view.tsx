"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT, formatNumberL10n } from "@/lib/i18n";
import { MEMBER_TYPES } from "@/lib/constants";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Kode tipe member (DB) tetap utk filter/query; label tampil lewat kamus. */
function memberTypeLabel(ty: string, t: (k: string) => string): string {
  const val = t(`members.type.${ty}`);
  return val === `members.type.${ty}` ? ty : val;
}

export function MembersView({ initialTab = "direktori" }: { initialTab?: string }) {
  const { t } = useT();
  // Task 30 — deep-link #/anggota/verifikasi membuka tab Verifikasi.
  // Dihidupkan lewat key-remount di muhdin-app (key berubah saat hash berubah).
  const [tab, setTab] = useState(initialTab === "verifikasi" ? "verifikasi" : "direktori");
  return (
    <div className="flex flex-col">
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("members.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("members.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("members.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              {/* id/aria deterministik (Task 35-h addendum) — imun geser useId dev */}
              <TabsTrigger
                value="direktori"
                id="muhdin-members-tab-direktori"
                aria-controls="muhdin-members-panel-direktori"
                className="gap-2"
              >
                <Icon name="grid-3x3" className="h-4 w-4" /> {t("members.tabDirectory")}
              </TabsTrigger>
              <TabsTrigger
                value="verifikasi"
                id="muhdin-members-tab-verifikasi"
                aria-controls="muhdin-members-panel-verifikasi"
                className="gap-2"
              >
                <Icon name="shield-check" className="h-4 w-4" /> {t("members.tabVerify")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="direktori" id="muhdin-members-panel-direktori" aria-labelledby="muhdin-members-tab-direktori">
              <DirectoryTab />
            </TabsContent>
            <TabsContent value="verifikasi" id="muhdin-members-panel-verifikasi" aria-labelledby="muhdin-members-tab-verifikasi">
              <VerifyTab />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

/* ============ DIREKTORI ============ */
function DirectoryTab() {
  const { t, locale } = useT();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");

  const TYPE_FILTERS = [
    { value: "all", label: t("members.filterAll") },
    ...MEMBER_TYPES.map((ty) => ({ value: ty, label: memberTypeLabel(ty, t) })),
  ];

  useEffect(() => {
    apiGet<Member[]>(`/api/members?locale=${locale}`)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [locale]);

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => {
      const okType = type === "all" || m.type === type;
      const okQ =
        !q ||
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        m.city.toLowerCase().includes(q.toLowerCase()) ||
        m.province.toLowerCase().includes(q.toLowerCase());
      return okType && okQ;
    });
  }, [members, type, q]);

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-0.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setType(f.value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                type === f.value
                  ? "bg-primary text-white shadow-md"
                  : "bg-muted text-foreground/70 hover:bg-primary/10 hover:text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative lg:ms-auto w-full lg:w-72">
          <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("members.searchPlaceholder")}
            aria-label={t("members.searchAria")}
            className="ps-9"
          />
        </div>
      </div>

      {!members ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Icon aria-hidden name="search" className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="mt-3 text-muted-foreground">{t("members.empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <Reveal key={m.id} delay={Math.min(i * 0.04, 0.4)}>
              <div className="h-full rounded-2xl border bg-card p-5 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft font-extrabold">
                      {m.name.replace(/^PT\s|^Koperasi\s+/i, "").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-snug">{m.name}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {memberTypeLabel(m.type, t)} · {t("members.since", { year: formatNumberL10n(m.memberSince, locale) })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground flex-1">
                  <p className="flex items-center gap-1.5">
                    <Icon name="map-pin" className="h-3.5 w-3.5 text-primary" />
                    {m.city}, {m.province}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Icon name="file-text" className="h-3.5 w-3.5 text-primary" />
                    {t("members.licensePrefix")}: <span className="font-mono font-semibold text-foreground/80">{m.licenseNo}</span>
                  </p>
                  {m.description && <p className="line-clamp-2 pt-1">{m.description}</p>}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div
                    className="flex items-center gap-1"
                    role="img"
                    aria-label={`${t("members.ratingLabel")}: ${formatNumberL10n(m.rating, locale)}`}
                  >
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Icon
                        key={s}
                        name="star"
                        className={cn(
                          "h-3.5 w-3.5",
                          s < Math.round(m.rating) ? "fill-gold-deep text-gold-deep" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                    <span className="ms-1 text-xs font-bold">{formatNumberL10n(m.rating, locale)}</span>
                  </div>
                  {m.phone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon name="phone" className="h-3 w-3" /> {m.phone}
                    </span>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const cls: Record<string, string> = {
    TERVERIFIKASI: "bg-primary/10 text-primary border-primary/30",
    PENDING: "bg-gold/15 text-gold-deep border-gold/40",
    SUSPENDED: "bg-destructive/10 text-destructive border-destructive/30",
  };
  const code = cls[status] ? status : "PENDING";
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold shrink-0", cls[code])}>
      {code === "TERVERIFIKASI" && <Icon name="badge-check" className="h-3 w-3 me-1" />}
      {t(`members.status.${code}`)}
    </Badge>
  );
}

/* ============ VERIFIKASI ============ */
function VerifyTab() {
  const { t, locale } = useT();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: boolean; warning: string | null; results: Member[] } | null>(null);
  const [error, setError] = useState("");

  const verify = async () => {
    setError("");
    setResult(null);
    if (query.trim().length < 3) {
      setError(t("members.minCharsError"));
      return;
    }
    setLoading(true);
    try {
      const res = await apiGet<{ found: boolean; warning: string | null; results: Member[] }>(
        `/api/members/verify?q=${encodeURIComponent(query.trim())}&locale=${locale}`
      );
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeading
        eyebrow={t("members.verifyEyebrow")}
        title={t("members.verifyTitle")}
        subtitle={t("members.verifySubtitle")}
      />

      <Reveal className="mt-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Icon name="shield-check" className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder={t("members.verifyPlaceholder")}
                aria-label={t("members.verifyAria")}
                className="ps-9 h-11"
              />
            </div>
            <Button onClick={verify} disabled={loading} className="h-11 px-6 bg-gradient-to-r from-primary to-forest text-white">
              {loading ? <Icon name="loader-2" className="h-4 w-4 me-2 animate-spin" /> : <Icon name="search" className="h-4 w-4 me-2" />}
              {t("members.verifyButton")}
            </Button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-destructive flex items-center gap-1.5">
              <Icon name="alert-triangle" className="h-4 w-4" /> {error}
            </p>
          )}

          {result && (
            <div className="mt-5">
              {result.warning && (
                <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive font-medium">
                  {result.warning}
                </div>
              )}
              {result.found ? (
                <div className="space-y-3">
                  {result.results.map((m) => (
                    <div key={m.id} className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {memberTypeLabel(m.type, t)} · {m.city}, {m.province} · {t("members.licensePrefix")} {m.licenseNo}
                        </p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-gold/10 border border-gold/30 p-4">
                  <p className="font-bold text-gold-deep flex items-center gap-2">
                    <Icon name="alert-triangle" className="h-4 w-4" /> {t("members.notFoundTitle")}
                  </p>
                  <p className="mt-1.5 text-sm text-foreground/75">{t("members.notFoundDesc")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "badge-check", title: t("members.trustTitle"), desc: t("members.trustDesc") },
          { icon: "wallet", title: t("members.fundsTitle"), desc: t("members.fundsDesc") },
          { icon: "shield-alert", title: t("members.fraudTitle"), desc: t("members.fraudDesc") },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border bg-muted/30 p-4 text-center">
            <Icon name={c.icon} className="h-6 w-6 mx-auto text-primary" />
            <p className="mt-2 text-sm font-bold">{c.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
