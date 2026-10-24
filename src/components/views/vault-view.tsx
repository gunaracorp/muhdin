"use client";

/**
 * v6.0 — Brankas Jamaah (#/vault).
 * Pencarian berdasarkan nomor kartu (publik, mode=public — data sensitif dimask
 * server): daftar dokumen + status verifikasi + peringatan kedaluwarsa otomatis,
 * plus formulir pengajuan dokumen baru (PENDING → diverifikasi panitia CMS).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailHero } from "@/components/views/detail-shell";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VaultDoc {
  id: string;
  kind: string;
  docNoMasked: string;
  issueDate: string | null;
  expiryDate: string | null;
  verifyStatus: string;
  note: string | null;
  lifecycle: string;
  daysLeft: number | null;
}
interface VaultResponse {
  card: { id: string; cardNo: string; fullName: string; groupName: string; status: string };
  docs: VaultDoc[];
}

const KINDS = ["PASPOR", "VISA", "VAKSIN", "TIKET", "ASURANSI", "LAINNYA"];

function fmtDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : null;
}

const KIND_ICON: Record<string, string> = {
  PASPOR: "id-card",
  VISA: "stamp",
  VAKSIN: "shield-check",
  TIKET: "plane-takeoff",
  ASURANSI: "heart-pulse",
  LAINNYA: "file-text",
};

export function VaultView() {
  const { t } = useT();
  const { toast } = useToast();
  const [cardNo, setCardNo] = useState("");
  const [data, setData] = useState<VaultResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ kind: "PASPOR", docNo: "", issueDate: "", expiryDate: "", note: "" });

  const lookup = useCallback(
    async (no: string) => {
      const clean = no.trim().toUpperCase();
      if (!clean) return;
      setLoading(true);
      setNotFound(false);
      try {
        const res = await apiGet<VaultResponse>(`/api/jamaah-docs?mode=public&cardNo=${encodeURIComponent(clean)}`);
        setData(res);
      } catch {
        setData(null);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Dukungan deep-link #/vault/<cardNo> — target lanjutan QR kartu.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/vault\/?/, "").trim();
    if (hash) {
      setCardNo(decodeURIComponent(hash));
      void lookup(decodeURIComponent(hash));
    }
  }, [lookup]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiSend("/api/jamaah-docs", "POST", {
        cardNo: cardNo.trim().toUpperCase(),
        kind: form.kind,
        docNo: form.docNo,
        issueDate: form.issueDate || undefined,
        expiryDate: form.expiryDate || undefined,
        note: form.note || undefined,
      });
      toast({ title: t("vault.addSuccess"), description: `${t(`vault.kind${form.kind}`)} — ${data?.card.fullName ?? ""}` });
      setForm({ kind: "PASPOR", docNo: "", issueDate: "", expiryDate: "", note: "" });
      setShowForm(false);
      await lookup(cardNo);
    } catch (err) {
      toast({ title: "Gagal mengirim", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const docs = data?.docs ?? [];
  const expiring = docs.filter((d) => d.lifecycle === "EXPIRING").length;
  const expired = docs.filter((d) => d.lifecycle === "EXPIRED").length;

  const lifecycleBadge = (lc: string) =>
    lc === "VALID"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
      : lc === "EXPIRING"
        ? "bg-gold/15 text-gold-deep border-gold/40"
        : "bg-destructive/10 text-destructive border-destructive/30";
  const verifyBadge = (vs: string) =>
    vs === "VERIFIED"
      ? "bg-primary/10 text-primary border-primary/30"
      : vs === "PENDING"
        ? "bg-gold/15 text-gold-deep border-gold/40"
        : "bg-destructive/10 text-destructive border-destructive/30";

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("vault.eyebrow")}
        title={t("vault.title")}
        subtitle={t("vault.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      >
        <form
          className="mt-6 flex max-w-lg flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(cardNo);
          }}
        >
          <div className="relative flex-1">
            <Icon name="id-card" className="pointer-events-none absolute start-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-emerald-100/60" aria-hidden />
            <Input
              value={cardNo}
              onChange={(e) => setCardNo(e.target.value)}
              placeholder={t("vault.lookupPlaceholder")}
              aria-label={t("vault.lookupLabel")}
              className="h-12 rounded-2xl border-white/20 bg-white/10 ps-11 text-sm text-white placeholder:text-emerald-100/50 focus-visible:ring-gold/50"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !cardNo.trim()}
            className="h-12 bg-gold px-7 text-sm font-extrabold text-forest-deep hover:bg-gold-soft"
          >
            {loading ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="search" className="h-4 w-4" aria-hidden />}
            {t("vault.lookupCta")}
          </Button>
        </form>
        <p className="mt-2 max-w-lg text-start text-[11px] text-emerald-100/70">{t("vault.lookupHint")}</p>
      </DetailHero>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {loading && !data && <Skeleton className="h-64 rounded-2xl" />}

          {notFound && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
              <Icon name="alert-triangle" className="mx-auto h-10 w-10 text-destructive/70" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-destructive">{t("vault.notFound")}</p>
            </div>
          )}

          {data && (
            <>
              {/* Kartu pemilik */}
              <Reveal>
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-forest text-xl font-extrabold text-gold-soft" aria-hidden>
                    {data.card.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{t("vault.hello")}</p>
                    <p className="truncate text-lg font-extrabold">{data.card.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.card.cardNo} · {t("vault.group")}: {data.card.groupName || "—"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold",
                      data.card.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    )}
                  >
                    {data.card.status}
                  </Badge>
                </div>
              </Reveal>

              {/* Peringatan kedaluwarsa */}
              {(expiring > 0 || expired > 0) && (
                <Reveal delay={0.05}>
                  <div className="mt-4 space-y-2">
                    {expired > 0 && (
                      <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-bold text-destructive">
                        <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                        {t("vault.alertExpired", { n: expired })}
                      </p>
                    )}
                    {expiring > 0 && (
                      <p className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-bold text-gold-deep">
                        <Icon name="alert-triangle" className="h-4 w-4" aria-hidden />
                        {t("vault.alertExpiring", { n: expiring })}
                      </p>
                    )}
                  </div>
                </Reveal>
              )}

              {/* Dokumen */}
              <Reveal delay={0.08}>
                <h2 className="mt-8 flex items-center gap-2 text-lg font-extrabold">
                  <Icon name="hard-drive" className="h-5 w-5 text-primary" aria-hidden />
                  {t("vault.docsTitle")} ({docs.length})
                </h2>
              </Reveal>
              {docs.length === 0 ? (
                <div className="mt-4 rounded-2xl border bg-muted/30 p-10 text-center">
                  <Icon name="hard-drive" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                  <p className="mt-3 text-sm text-muted-foreground">{t("vault.empty")}</p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {docs.map((d) => (
                    <article key={d.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Icon name={KIND_ICON[d.kind] ?? "file-text"} className="h-5 w-5 text-primary" aria-hidden />
                          </div>
                          <div>
                            <p className="font-bold">{t(`vault.kind${d.kind}`)}</p>
                            {d.docNoMasked && <p className="font-mono text-[11px] text-muted-foreground">{d.docNoMasked}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge variant="outline" className={cn("text-[10px] font-bold", lifecycleBadge(d.lifecycle))}>
                            {t(`vault.lc${d.lifecycle}`)}
                          </Badge>
                          <Badge variant="outline" className={cn("text-[10px] font-bold", verifyBadge(d.verifyStatus))}>
                            {t(`vault.verify${d.verifyStatus}`)}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {d.issueDate && <span>Terbit: {fmtDate(d.issueDate)}</span>}
                        <span className="flex items-center gap-1">
                          <Icon name="clock" className="h-3.5 w-3.5" aria-hidden />
                          {d.expiryDate
                            ? `${fmtDate(d.expiryDate)} · ${
                                d.daysLeft !== null && d.daysLeft >= 0
                                  ? t("vault.daysLeft", { n: d.daysLeft })
                                  : d.daysLeft !== null
                                    ? t("vault.daysOver", { n: Math.abs(d.daysLeft) })
                                    : ""
                              }`
                            : t("vault.noExpiry")}
                        </span>
                      </div>
                      {d.note && <p className="mt-2 text-xs italic text-muted-foreground">“{d.note}”</p>}
                    </article>
                  ))}
                </div>
              )}

              {/* Pengajuan dokumen baru */}
              <Reveal delay={0.12}>
                <div className="mt-8 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-base font-extrabold">
                      <Icon name="file-check" className="h-5 w-5 text-primary" aria-hidden />
                      {t("vault.addTitle")}
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>
                      <Icon name={showForm ? "chevron-down" : "plus"} className="h-4 w-4" aria-hidden />
                      {showForm ? "Tutup" : "Ajukan"}
                    </Button>
                  </div>

                  {showForm && (
                    <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>{t("vault.addKind")}</Label>
                        <select
                          value={form.kind}
                          onChange={(e) => setForm({ ...form, kind: e.target.value })}
                          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                        >
                          {KINDS.map((k) => (
                            <option key={k} value={k}>{t(`vault.kind${k}`)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("vault.addDocNo")}</Label>
                        <Input value={form.docNo} onChange={(e) => setForm({ ...form, docNo: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("vault.addIssue")}</Label>
                        <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("vault.addExpiry")}</Label>
                        <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>{t("vault.addNote")}</Label>
                        <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="w-full bg-gradient-to-r from-primary to-forest text-white sm:w-auto"
                        >
                          {saving ? (
                            <><Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> …</>
                          ) : (
                            <><Icon name="send" className="h-4 w-4" aria-hidden /> {t("vault.addCta")}</>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                  <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">{t("vault.securityNote")}</p>
                </div>
              </Reveal>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
