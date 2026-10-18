"use client";

/**
 * Task 33-c — DashboardView: portal anggota sederhana (route #/dashboard).
 * Tanpa auth kompleks — cukup kode tiket (MHD-XXXXXX) yang tersimpan aman di
 * localStorage "muhdin-ticket". Sumber data: GET /api/applications/track.
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, formatDateL10n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TICKET_KEY = "muhdin-ticket";

/** Respons track non-sensitif (tanpa email/telepon/kontak). */
type TrackApp = {
  found: boolean;
  ticketCode: string;
  orgName: string;
  type: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

type Phase = "form" | "loading" | "active" | "notFound" | "error";

/** Label jenis mitra: pakai kamus track.mt* bila ada, fallback kode mentah. */
function typeLabel(ty: string, t: (k: string) => string): string {
  const key = `track.mt${ty}`;
  const val = t(key);
  return val === key ? ty : val;
}

export function DashboardView() {
  const { t, locale } = useT();
  const [phase, setPhase] = useState<Phase>("form");
  const [input, setInput] = useState("");
  const [app, setApp] = useState<TrackApp | null>(null);
  const [inlineErr, setInlineErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [stored, setStored] = useState(false);

  const load = useCallback(
    async (raw: string) => {
      const code = raw.replace(/\s+/g, "").toUpperCase();
      if (!code) {
        setPhase("form");
        setInlineErr(t("nusTrust.dash.formEmpty"));
        return;
      }
      setPhase("loading");
      setInlineErr("");
      try {
        const res = await apiGet<TrackApp>(`/api/applications/track?code=${encodeURIComponent(code)}`);
        setApp(res);
        setPhase("active");
        try {
          window.localStorage.setItem(TICKET_KEY, res.ticketCode || code);
          setStored(true);
        } catch {
          /* localStorage tidak tersedia — abaikan */
        }
      } catch (e) {
        const msg = (e as Error).message || "";
        setApp(null);
        // Tiket tersimpan tidak valid → bersihkan agar tidak menggantung.
        try {
          window.localStorage.removeItem(TICKET_KEY);
        } catch {
          /* ignore */
        }
        setStored(false);
        if (/404|tidak ditemukan|not found/i.test(msg)) setPhase("notFound");
        else setPhase("error");
      }
    },
    [t]
  );

  // Boot: jika localStorage "muhdin-ticket" ada → langsung muat status.
  // Pembacaan localStorage ditunda satu tick (pola defer React) agar tidak
  // memicu cascading render sinkron di dalam effect.
  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      if (!alive) return;
      let saved = "";
      try {
        saved = window.localStorage.getItem(TICKET_KEY) || "";
      } catch {
        /* ignore */
      }
      if (saved) void load(saved);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [load]);

  const exit = () => {
    try {
      window.localStorage.removeItem(TICKET_KEY);
    } catch {
      /* ignore */
    }
    setStored(false);
    setApp(null);
    setInput("");
    setPhase("form");
  };

  const copyCode = async () => {
    if (!app) return;
    try {
      await navigator.clipboard.writeText(app.ticketCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard tidak tersedia — abaikan */
    }
  };

  const isApproved = app?.status === "APPROVED";
  const isRejected = app?.status === "REJECTED";
  const decided = isApproved || isRejected;
  // Label status dengan fallback kode mentah bila key kamus tak tersedia.
  const statusKey = `nusTrust.dash.status${app?.status ?? ""}`;
  const statusLabel = app ? (t(statusKey) === statusKey ? app.status : t(statusKey)) : "";

  /* TIMELINE: Diterima → Ditinjau → Keputusan (PENDING=Ditinjau). */
  const steps: { key: string; desc: string; state: "done" | "current" | "rejected" | "waiting" }[] = app
    ? [
        { key: t("nusTrust.dash.step1"), desc: t("nusTrust.dash.step1Desc"), state: "done" },
        {
          key: t("nusTrust.dash.step2"),
          desc: t("nusTrust.dash.step2Desc"),
          state: decided ? "done" : "current",
        },
        {
          key: t("nusTrust.dash.step3"),
          desc: t("nusTrust.dash.step3Desc"),
          state: isApproved ? "done" : isRejected ? "rejected" : "waiting",
        },
      ]
    : [];

  const stepCls: Record<string, string> = {
    done: "border-primary/40 bg-card text-primary",
    current: "border-gold bg-card text-gold-deep",
    rejected: "border-destructive/40 bg-card text-destructive",
    waiting: "border-border bg-muted text-muted-foreground",
  };
  const stepIcon: Record<string, string> = {
    done: "check-circle-2",
    current: "clock",
    rejected: "ban",
    waiting: "circle",
  };
  const stepAria: Record<string, string> = {
    done: "nusTrust.dash.ariaDone",
    current: "nusTrust.dash.ariaCurrent",
    rejected: "nusTrust.dash.ariaDone",
    waiting: "nusTrust.dash.ariaWaiting",
  };

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section aria-label={t("nusTrust.dash.title")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {t("nusTrust.dash.eyebrow")}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("nusTrust.dash.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("nusTrust.dash.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section aria-label={t("nusTrust.dash.title")} className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* FORM: Masukkan Kode Tiket */}
          {(phase === "form" || phase === "notFound" || phase === "error") && (
            <Reveal>
              <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-forest text-gold-soft">
                    <Icon name="keyround" className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold">{t("nusTrust.dash.formTitle")}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t("nusTrust.dash.formDesc")}</p>
                  </div>
                </div>
                <form
                  className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void load(input);
                  }}
                  noValidate
                >
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="dash-ticket">{t("nusTrust.dash.formLabel")}</Label>
                    <Input
                      id="dash-ticket"
                      value={input}
                      onChange={(e) => setInput(e.target.value.toUpperCase())}
                      placeholder={t("nusTrust.dash.formPlaceholder")}
                      aria-label={t("nusTrust.dash.formAria")}
                      aria-invalid={!!inlineErr || phase === "notFound"}
                      autoComplete="off"
                      autoCapitalize="characters"
                      className="font-mono tracking-widest"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
                  >
                    <Icon name="layout-dashboard" className="me-1.5 h-4 w-4" aria-hidden />
                    {t("nusTrust.dash.formButton")}
                  </Button>
                </form>

                {/* Inline error elegan */}
                {phase === "notFound" ? (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 p-4"
                  >
                    <Icon name="search" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden />
                    <div>
                      <p className="text-sm font-bold text-gold-deep">{t("nusTrust.empty.title")}</p>
                      <p className="mt-0.5 text-sm text-foreground/80">{t("nusTrust.dash.notFound")}</p>
                    </div>
                  </div>
                ) : phase === "error" ? (
                  <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                    {t("nusTrust.dash.error")}
                  </p>
                ) : (
                  inlineErr && (
                    <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                      <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                      {inlineErr}
                    </p>
                  )
                )}
              </div>
            </Reveal>
          )}

          {/* LOADING */}
          {phase === "loading" && (
            <div className="space-y-4" role="status" aria-label={t("nusTrust.dash.loading")}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="loader-2" className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                {t("nusTrust.dash.loading")}
              </div>
              <Skeleton className="h-36 rounded-3xl" />
              <Skeleton className="h-32 rounded-3xl" />
            </div>
          )}

          {/* HASIL AKTIF */}
          {phase === "active" && app && (
            <div className="space-y-5">
              {/* Kartu identitas */}
              <Reveal>
                <section aria-label={app.orgName} className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                  <div className="bg-gradient-to-r from-primary to-forest p-6 text-white sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100/80">
                          {t("nusTrust.dash.identityOrg")}
                        </p>
                        <h2 className="mt-1 text-2xl font-extrabold leading-tight">{app.orgName}</h2>
                        <p className="mt-1 text-xs text-emerald-100/80">
                          {t("nusTrust.dash.identityType")}: <span className="font-bold">{typeLabel(app.type, t)}</span>
                          {app.submittedAt && (
                            <>
                              {" · "}
                              {formatDateL10n(app.submittedAt, locale)}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-xl bg-white/15 px-4 py-2 font-mono text-lg font-extrabold tracking-[0.18em]" dir="ltr">
                          {app.ticketCode}
                        </span>
                        <button
                          type="button"
                          onClick={copyCode}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-white/20"
                          aria-label={copied ? t("nusTrust.dash.copied") : t("nusTrust.dash.copy")}
                        >
                          <Icon name={copied ? "check-circle-2" : "clipboard-list"} className="h-3.5 w-3.5" aria-hidden />
                          {copied ? t("nusTrust.dash.copied") : t("nusTrust.dash.copy")}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="gap-1.5 border-white/30 bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white"
                      >
                        <Icon name={isApproved ? "badge-check" : isRejected ? "ban" : "clock"} className="h-3.5 w-3.5" aria-hidden />
                        {statusLabel}
                      </Badge>
                      {stored && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-100/80">
                          <Icon name="check-circle-2" className="h-3 w-3" aria-hidden />
                          {t("nusTrust.dash.storedNote")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline animasi */}
                  <div className="p-6 sm:p-7">
                    <h3 className="text-sm font-extrabold">{t("nusTrust.dash.timelineTitle")}</h3>
                    <ol className="relative mt-4 grid grid-cols-3 gap-2" aria-label={t("nusTrust.dash.ariaTimeline")}>
                      <span aria-hidden className="absolute start-[16.6%] end-[16.6%] top-5 z-0 h-0.5 bg-border" />
                      {steps.map((s) => (
                        <li key={s.key} className="relative z-10 flex flex-col items-center text-center">
                          <span
                            aria-label={t(stepAria[s.state], { step: s.key })}
                            className={cn(
                              "grid h-10 w-10 place-items-center rounded-full border-2 transition-colors duration-500 motion-reduce:transition-none",
                              stepCls[s.state]
                            )}
                          >
                            <Icon
                              name={stepIcon[s.state]}
                              className={cn("h-5 w-5", s.state === "current" && "animate-pulse motion-reduce:animate-none")}
                            />
                          </span>
                          <span
                            className={cn(
                              "mt-2 text-xs font-extrabold",
                              s.state === "done" && "text-primary",
                              s.state === "current" && "text-gold-deep",
                              s.state === "rejected" && "text-destructive",
                              s.state === "waiting" && "text-muted-foreground"
                            )}
                          >
                            {s.key}
                          </span>
                          <span className="mt-0.5 hidden text-[11px] leading-snug text-muted-foreground sm:block">
                            {s.desc}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>
              </Reveal>

              {/* Catatan verifikator (REJECTED / bila ada) */}
              {app.reviewNote && (
                <Reveal>
                  <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4" role="note">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-gold-deep">
                      <Icon name="info" className="h-4 w-4" aria-hidden />
                      {t("nusTrust.dash.reviewNoteTitle")}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{app.reviewNote}</p>
                  </div>
                </Reveal>
              )}

              {/* Langkah Selanjutnya */}
              <Reveal>
                <section
                  aria-label={t("nusTrust.dash.nextTitle")}
                  className={cn(
                    "rounded-3xl border p-6 sm:p-7",
                    isApproved && "border-primary/30 bg-gradient-to-br from-primary/10 to-forest/10",
                    isRejected && "border-destructive/30 bg-destructive/5",
                    !decided && "border-gold/40 bg-gold/5"
                  )}
                >
                  {isApproved ? (
                    <div className="text-center">
                      <span className="relative mx-auto grid h-16 w-16 place-items-center" role="img" aria-label={t("nusTrust.dash.statusAPPROVED")}>
                        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/25 animate-ping motion-reduce:animate-none" />
                        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/15" />
                        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-forest text-white shadow-lg">
                          <Icon name="badge-check" className="h-6 w-6" aria-hidden />
                        </span>
                      </span>
                      <h3 className="mt-4 text-xl font-extrabold">{t("nusTrust.dash.congratsTitle")}</h3>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/80">
                        {t("nusTrust.dash.congratsDesc")}
                      </p>
                      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button
                          onClick={() => navigate("anggota")}
                          className="bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
                        >
                          <Icon name="grid-3x3" className="me-1.5 h-4 w-4" aria-hidden />
                          {t("nusTrust.dash.ctaDirectory")}
                        </Button>
                        <Button
                          onClick={() => navigate("anggota/verifikasi")}
                          variant="outline"
                          className="font-bold"
                        >
                          <Icon name="shield-check" className="me-1.5 h-4 w-4" aria-hidden />
                          {t("nusTrust.dash.ctaVerify")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="flex items-center gap-2 text-base font-extrabold">
                        <Icon name="target" className={cn("h-5 w-5", isRejected ? "text-destructive" : "text-gold-deep")} aria-hidden />
                        {t("nusTrust.dash.nextTitle")}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                        {isRejected ? t("nusTrust.dash.nextRejected") : t("nusTrust.dash.nextPending")}
                      </p>
                      {isRejected && (
                        <div className="mt-4">
                          <Button
                            onClick={() => navigate("daftar")}
                            variant="outline"
                            className="border-destructive/40 font-bold text-destructive hover:bg-destructive/10"
                          >
                            <Icon name="rotate" className="me-1.5 h-4 w-4" aria-hidden />
                            {t("nusTrust.dash.ctaReapply")}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </Reveal>
            </div>
          )}

          {/* Akses cepat */}
          <Reveal delay={0.08} className="mt-8">
            <section aria-label={t("nusTrust.dash.quickTitle")}>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                {t("nusTrust.dash.quickTitle")}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <a
                  href="#/anggota"
                  className="group rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <Icon name="users" className="h-5 w-5 text-primary" aria-hidden />
                  <p className="mt-2 text-sm font-extrabold">{t("nusTrust.dash.quickMembership")}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {t("nusTrust.dash.quickMembershipDesc")}
                  </p>
                </a>
                <button
                  type="button"
                  onClick={() => navigate("tutorial")}
                  className="rounded-2xl border bg-card p-4 text-start shadow-sm transition-shadow hover:shadow-md"
                >
                  <Icon name="graduation-cap" className="h-5 w-5 text-primary" aria-hidden />
                  <p className="mt-2 text-sm font-extrabold">{t("nusTrust.dash.quickAcademy")}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t("nusTrust.dash.quickAcademyDesc")}</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("kontak")}
                  className="rounded-2xl border bg-card p-4 text-start shadow-sm transition-shadow hover:shadow-md"
                >
                  <Icon name="help-circle" className="h-5 w-5 text-primary" aria-hidden />
                  <p className="mt-2 text-sm font-extrabold">{t("nusTrust.dash.quickHelp")}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t("nusTrust.dash.quickHelpDesc")}</p>
                </button>
              </div>
            </section>
          </Reveal>

          {/* Keluar: hapus tiket tersimpan */}
          {phase === "active" && (
            <Reveal delay={0.12} className="mt-6">
              <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row">
                <p className="text-xs text-muted-foreground">{t("nusTrust.dash.exitDesc")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exit}
                  className="shrink-0 font-bold text-destructive hover:bg-destructive/10"
                >
                  <Icon name="logout" className="me-1.5 h-4 w-4" aria-hidden />
                  {t("nusTrust.dash.exit")}
                </Button>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
}
