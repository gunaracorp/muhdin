"use client";

/**
 * v5.0 — Kartu Jamaah Digital (verifikasi publik).
 * Route: #/kartu            → form pencarian nomor kartu
 *        #/kartu/<cardNo>   → langsung tampilkan kartu (target QR)
 *
 * Menampilkan kartu digital bergaya forest/gold dengan QR (react-qr-code)
 * yang menaut ke halaman ini, status real-time dari /api/pilgrim-cards/verify.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, formatDate } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { MuhdinLogo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { DetailHero } from "@/components/views/detail-shell";

interface VerifyResult {
  cardNo: string;
  fullName: string;
  type: string;
  groupName: string;
  status: string; // ACTIVE | SUSPENDED | EXPIRED (efektif)
  validUntil: string | null;
  scans: number;
  member: { name: string; city: string; licenseNo: string } | null;
  checkedAt: string;
}

export function KartuView({ initialCardNo }: { initialCardNo?: string }) {
  const { t } = useT();
  const [input, setInput] = useState(initialCardNo ?? "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const verify = useCallback(async (no: string) => {
    const clean = no.trim().toUpperCase();
    if (!clean) return;
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const res = await apiGet<VerifyResult>(`/api/pilgrim-cards/verify?no=${encodeURIComponent(clean)}`);
      setResult(res);
    } catch (e) {
      setError((e as Error).message || t("kartu.notFound"));
    } finally {
      setChecking(false);
    }
  }, [t]);

  useEffect(() => {
    if (initialCardNo) verify(initialCardNo);
  }, [initialCardNo, verify]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.trim().toUpperCase();
    if (!clean) return;
    navigate(`kartu/${encodeURIComponent(clean)}`);
    verify(clean);
  };

  const statusVisual = (status: string) =>
    status === "ACTIVE"
      ? { label: t("kartu.stACTIVE"), cls: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary" }
      : status === "SUSPENDED"
        ? { label: t("kartu.stSUSPENDED"), cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" }
        : { label: t("kartu.stEXPIRED"), cls: "bg-gold/15 text-gold-deep border-gold/40", dot: "bg-gold-deep" };

  const statusNote = (status: string) =>
    status === "SUSPENDED" ? t("kartu.suspendedNote") : status === "EXPIRED" ? t("kartu.expiredNote") : null;

  const typeLabel = (tp: string) =>
    tp === "PENDAMPING" ? t("kartu.tPENDAMPING") : tp === "PETUGAS" ? t("kartu.tPETUGAS") : t("kartu.tJAMAAH");

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("kartu.eyebrow")}
        title={t("kartu.title")}
        subtitle={t("kartu.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      />

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Form pencarian */}
          <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Icon name="qr-code" className="pointer-events-none absolute start-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("kartu.placeholder")}
                aria-label={t("kartu.inputAria")}
                className="h-12 rounded-2xl border-border ps-11 font-mono text-sm uppercase shadow-sm focus-visible:ring-gold/40"
              />
            </div>
            <Button
              type="submit"
              disabled={checking}
              className="h-12 bg-gradient-to-r from-primary to-forest px-6 text-white shadow-lg"
            >
              {checking ? (
                <>
                  <Icon name="loader-2" className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t("kartu.checking")}
                </>
              ) : (
                <>
                  <Icon name="scan" className="mr-2 h-4 w-4" aria-hidden />
                  {t("kartu.cta")}
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          {checking && !result && (
            <div className="mt-8 space-y-3" aria-busy="true">
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          )}

          {/* Kartu digital */}
          {result && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-bold">{t("kartu.digitalCard")}</span>
                <span>
                  {t("kartu.checkedAt")} {new Date(result.checkedAt).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-forest-deep p-6 text-white shadow-2xl sm:p-8">
                <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MuhdinLogo className="h-11 w-11" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80">
                          MUHDIN · {t("kartu.digitalCard")}
                        </p>
                        <p className="font-mono text-sm font-extrabold text-gold">{result.cardNo}</p>
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold", statusVisual(result.status).cls)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusVisual(result.status).dot)} aria-hidden />
                      {statusVisual(result.status).label}
                    </span>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/70">{t("kartu.cardType")}</p>
                      <h2 className="truncate text-2xl font-extrabold leading-tight">{result.fullName}</h2>
                      <p className="mt-1 text-xs text-emerald-100/85">
                        {typeLabel(result.type)}
                        {result.groupName ? ` · ${t("kartu.group")}: ${result.groupName}` : ""}
                      </p>
                      {result.member && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px]">
                          <Icon name="building-2" className="h-3 w-3 text-gold" aria-hidden />
                          {t("kartu.member")}: <b>{result.member.name}</b>
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 rounded-xl bg-white p-2.5 shadow-lg">
                      <QRCode
                        value={`${window.location.origin}/#/kartu/${encodeURIComponent(result.cardNo)}`}
                        size={92}
                        bgColor="#ffffff"
                        fgColor="#1a2e25"
                        role="img"
                        aria-label={`QR ${result.cardNo}`}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/15 pt-4 text-center">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/70">{t("kartu.validUntil")}</p>
                      <p className="mt-0.5 text-xs font-extrabold">
                        {result.validUntil ? formatDate(result.validUntil) : t("kartu.validForever")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/70">{t("kartu.scans")}</p>
                      <p className="mt-0.5 text-xs font-extrabold tabular-nums">{result.scans}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/70">{t("kartu.status")}</p>
                      <p className="mt-0.5 text-xs font-extrabold">{statusVisual(result.status).label}</p>
                    </div>
                  </div>
                </div>
              </div>

              {statusNote(result.status) && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold-deep">
                  <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {statusNote(result.status)}
                </div>
              )}

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <Icon name="qr-code" className="h-3.5 w-3.5" aria-hidden />
                {t("kartu.qrNote")} · {t("kartu.scanCount")} {result.scans}
              </p>
            </div>
          )}

          {/* Cara mendapatkan kartu */}
          <div className="mt-12 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-extrabold">
              <Icon name="id-card" className="h-5 w-5 text-primary" aria-hidden />
              {t("kartu.howTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("kartu.howBody")}</p>
            <p className="mt-3 rounded-xl border bg-background/70 px-4 py-3 text-xs font-semibold leading-relaxed text-foreground/80">
              {t("kartu.howSteps")}
            </p>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {t("kartu.tip")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
