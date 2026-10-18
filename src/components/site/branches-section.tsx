"use client";

/**
 * Task 19 — Section "Jaringan Kepengurusan Daerah" (DPD & Branch Office).
 * Dipakai bersama oleh about-view (#/tentang) dan contact-view (#/kontak).
 * Ambil data dari GET /api/branches (publik, hanya published) dengan locale.
 */

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import type { RegionalBranchItem } from "@/lib/types";

/** "+6281316516524" → "6281316516524" (untuk link wa.me). */
function waDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function initials(name: string): string {
  const clean = name
    .replace(/^(Hj?\.|Drs\.|Prof\.|Dr\.|Ir\.|KH\.|Tn\.|Ny\.)*\s*/gi, "")
    .trim();
  return clean.charAt(0).toUpperCase() || "?";
}

export function BranchesSection() {
  const { t, locale } = useT();
  const [branches, setBranches] = useState<RegionalBranchItem[] | null>(null);

  useEffect(() => {
    apiGet<RegionalBranchItem[]>(`/api/branches?locale=${locale}`)
      .then(setBranches)
      .catch(() => setBranches([]));
  }, [locale]);

  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("branches.eyebrow")}
          title={t("branches.title")}
          subtitle={t("branches.subtitle")}
        />

        {!branches ? (
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="mt-10 rounded-2xl border bg-card p-10 text-center">
            <Icon name="network" className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <h3 className="mt-3 font-bold">{t("branches.emptyTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("branches.emptyDesc")}</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground" aria-live="polite">
              {t("branches.countLabel", { n: branches.length })}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {branches.map((b, i) => (
                <Reveal key={b.id} delay={Math.min(i * 0.08, 0.3)}>
                  <article
                    className="h-full min-w-0 rounded-2xl border bg-card shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                    aria-label={b.name}
                  >
                    {/* Header kartu */}
                    <div className="relative bg-gradient-to-br from-forest to-forest-deep p-5 text-white overflow-hidden">
                      <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
                      <div className="relative flex items-start gap-3">
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-white/10 border border-white/20 grid place-items-center">
                          <Icon name="landmark" className="h-5 w-5 text-gold" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold leading-snug text-sm sm:text-base">{b.name}</h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {b.code && (
                              <span className="rounded bg-white/10 border border-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold" dir="ltr">
                                {b.code}
                              </span>
                            )}
                            {(b.city || b.province) && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-50/80">
                                <Icon name="map-pin" className="h-3 w-3" />
                                {[b.city, b.province].filter(Boolean).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Isi kartu */}
                    <div className="p-5 space-y-4">
                      {b.description && (
                        <p className="text-xs leading-relaxed text-muted-foreground">{b.description}</p>
                      )}

                      {/* Kantor + alamat */}
                      {b.address && (
                        <div className="flex gap-2.5">
                          <Icon name="building" className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                              {t("branches.officeLabel")}
                            </p>
                            {b.officeName && <p className="text-sm font-bold">{b.officeName}</p>}
                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed break-words">
                              {b.address}
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              aria-label={t("branches.mapAria", { name: b.name })}
                            >
                              <Icon name="external-link" className="h-3 w-3" />
                              {t("branches.mapCta")}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* PIC */}
                      {(b.picName || b.picPhone) && (
                        <div className="flex gap-2.5 rounded-xl bg-primary/[0.04] border border-primary/15 p-3">
                          {b.picName && (
                            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-forest grid place-items-center text-white text-xs font-extrabold">
                              {initials(b.picName)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                              {t("branches.picLabel")}
                            </p>
                            {b.picName && <p className="text-sm font-bold leading-snug">{b.picName}</p>}
                            {b.picPhone && (
                              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Icon name="phone" className="h-3 w-3" />
                                <span dir="ltr" className="font-mono">{b.picPhone}</span>
                              </p>
                            )}
                          </div>
                          {b.picPhone && waDigits(b.picPhone).length >= 8 && (
                            <Button
                              asChild
                              size="sm"
                              className="h-8 shrink-0 self-center bg-gradient-to-r from-primary to-forest text-white"
                            >
                              <a
                                href={`https://wa.me/${waDigits(b.picPhone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t("branches.waAria", { name: b.picName || t("branches.picLabel") })}
                              >
                                <Icon name="message-circle" className="h-3.5 w-3.5 me-1" />
                                {t("branches.waCta")}
                              </a>
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Status terbit — hanya penanda kecil */}
                      <div className="flex justify-end">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold">
                          <Icon name="badge-check" className="h-3 w-3 me-1" />
                          Resmi
                        </Badge>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
