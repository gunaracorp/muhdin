"use client";

/**
 * v6.0 — AI Trip Composer (diferensiasi): masukkan budget/durasi/jumlah/kota
 * → API mencocokkan paket nyata (PUBLISHED) lalu Sahabat MUHDIN merangkai
 * rencana + tips. Ditampilkan di #/paket sebagai seksi interaktif.
 */

import { useState } from "react";
import { apiSend } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ComposerMatch {
  id: string;
  title: string;
  memberName: string;
  memberLicense: string;
  city: string;
  price: number;
  durationDays: number;
  departureDate: string | null;
  slotsLeft: number;
  withinBudget: boolean;
}
interface ComposerResult {
  matches: ComposerMatch[];
  plan: string;
}

const TYPES = ["UMROH", "HAJI", "ZIARAH", "WISATA_ISLAMI"] as const;

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

/** Pecah teks rencana AI berlabel sederhana menjadi blok [judul, baris[]]. */
function parsePlan(plan: string): { label: string; lines: string[] }[] {
  const blocks: { label: string; lines: string[] }[] = [];
  let current: { label: string; lines: string[] } | null = null;
  for (const raw of plan.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const head = line.match(/^(REKOMENDASI|RINTEGAN|TIPS)\s*[:：]/i);
    if (head) {
      current = { label: head[1].toUpperCase(), lines: [line.slice(head[0].length).trim()] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line.replace(/^[-•*\d.)\s]+/, "").trim());
    } else {
      current = { label: "CATATAN", lines: [line] };
      blocks.push(current);
    }
  }
  return blocks.filter((b) => b.lines.some(Boolean));
}

export function TripComposer() {
  const { t } = useT();
  const [form, setForm] = useState({ budget: "", days: "9", pilgrims: "2", city: "", type: "UMROH" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ComposerResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiSend<ComposerResult>("/api/trip-composer", "POST", {
        budget: Number(form.budget) || 0,
        days: Number(form.days) || 9,
        pilgrims: Number(form.pilgrims) || 1,
        city: form.city,
        type: form.type,
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message || t("composer.error"));
    } finally {
      setLoading(false);
    }
  };

  const planBlocks = result ? parsePlan(result.plan) : [];

  return (
    <Reveal>
      <div className="mt-12 overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 via-background to-primary/5 shadow-sm">
        <div className="border-b border-gold/20 bg-gold/5 px-6 py-5 sm:px-8">
          <Badge variant="outline" className="mb-2 border-gold/40 bg-gold/15 text-[10px] font-extrabold text-gold-deep">
            <Icon name="brain-circuit" className="h-3 w-3" aria-hidden /> {t("composer.badge")}
          </Badge>
          <h2 className="text-xl font-extrabold sm:text-2xl">{t("composer.title")}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("composer.subtitle")}</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={run} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label>{t("composer.budget")}</Label>
              <Input
                type="number" min={1000000} step={500000}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder={t("composer.budgetPh")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("composer.days")}</Label>
              <Input type="number" min={1} max={60} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("composer.pilgrims")}</Label>
              <Input type="number" min={1} max={100} value={form.pilgrims} onChange={(e) => setForm({ ...form, pilgrims: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("composer.city")}</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder={t("composer.cityPh")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("composer.type")}</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                aria-label={t("composer.type")}
              >
                {TYPES.map((tp) => (
                  <option key={tp} value={tp}>{t(`paket.type${tp}`)}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-5">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="h-12 bg-gradient-to-r from-primary to-forest text-white shadow-md"
              >
                {loading ? (
                  <><Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> {t("composer.loading")}</>
                ) : (
                  <><Icon name="brain-circuit" className="h-4 w-4" aria-hidden /> {t("composer.cta")}</>
                )}
              </Button>
            </div>
          </form>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
              <Icon name="alert-triangle" className="h-4 w-4" aria-hidden /> {error}
            </p>
          )}

          {result && (
            <div className="mt-8">
              <h3 className="flex items-center gap-2 text-base font-extrabold">
                <Icon name="package" className="h-4.5 w-4.5 text-primary" aria-hidden />
                {t("composer.resultTitle")} ({result.matches.length})
              </h3>

              {result.matches.length === 0 ? (
                <p className="mt-3 rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">{t("composer.empty")}</p>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {result.matches.map((m, i) => (
                    <article
                      key={m.id}
                      className={cn(
                        "flex flex-col rounded-2xl border bg-card p-5 shadow-sm",
                        i === 0 && "border-gold/50 shadow-[0_0_24px_-8px_oklch(0.72_0.135_85/0.45)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {i === 0 ? (
                          <Badge className="border-none bg-gold text-[10px] font-extrabold text-forest-deep">
                            <Icon name="star" className="h-3 w-3" aria-hidden /> #1
                          </Badge>
                        ) : (
                          <span className="text-xs font-extrabold text-muted-foreground">#{i + 1}</span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold",
                            m.withinBudget
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                              : "bg-gold/15 text-gold-deep border-gold/40"
                          )}
                        >
                          {m.withinBudget ? t("composer.withinBudget") : t("composer.overBudget")}
                        </Badge>
                      </div>
                      <h4 className="mt-3 line-clamp-2 font-extrabold leading-snug">{m.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{m.memberName} · {m.city}</p>
                      <p className="mt-2 text-lg font-extrabold text-gold-deep">
                        {rupiah(m.price)}
                        <span className="text-xs font-semibold text-muted-foreground">{t("composer.perPax")}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {m.durationDays} {t("composer.daysUnit")} · {m.slotsLeft} {t("composer.slotsLeft")}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`paket/${m.id}`)}
                        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                      >
                        {t("composer.viewPkg")}
                        <Icon name="chevron-right" className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </article>
                  ))}
                </div>
              )}

              {planBlocks.length > 0 && (
                <div className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
                  <h3 className="flex items-center gap-2 text-base font-extrabold">
                    <Icon name="sparkles" className="h-4.5 w-4.5 text-gold-deep" aria-hidden />
                    {t("composer.planTitle")}
                  </h3>
                  <div className="mt-4 space-y-4">
                    {planBlocks.map((b, i) => (
                      <div key={i}>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">
                          {b.label === "REKOMENDASI" ? "Rekomendasi" : b.label === "RINTEGAN" ? "Rintegan" : b.label === "TIPS" ? "Tips" : b.label}
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {b.lines.map((line, j) => (
                            <li key={j} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
