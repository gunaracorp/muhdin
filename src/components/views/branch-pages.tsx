"use client";

/**
 * BranchPages (v4.1) — HALAMAN SENDIRI jaringan kepengurusan daerah.
 * Route: #/dpd            → indeks semua cabang (Bakorwil/Bakorcab/BO)
 *        #/dpd/<code>     → halaman detail satu cabang (by code BAKORWIL-JABAR, dst)
 *
 * Detail: kantor, kode wilayah, PIC, kontak WA/telp/email, alamat + Maps,
 * deskripsi, CTA pembentukan cabang baru. Data dari /api/branches.
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { RegionalBranchItem } from "@/lib/types";
import { navigate } from "@/hooks/use-hash-route";
import {
  DetailHero, DetailLoading, DetailNotFound, DetailSectionHead,
  InfoRow, WaCtaButton,
} from "@/components/views/detail-shell";

function waDigits(phone: string): string {
  return (phone || "").replace(/[^\d]/g, "").replace(/^0/, "62");
}

/** ===== INDEKS SEMUA CABANG ===== */
export function BranchIndex() {
  const { t } = useT();
  const [branches, setBranches] = useState<RegionalBranchItem[] | null>(null);

  useEffect(() => {
    apiGet<RegionalBranchItem[]>("/api/branches")
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("detail.branch.indexEyebrow")}
        title={t("detail.branch.indexTitle")}
        subtitle={t("detail.branch.indexSubtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      />

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {!branches ? (
            <DetailLoading />
          ) : branches.length === 0 ? (
            <div className="rounded-2xl border bg-muted/30 p-12 text-center">
              <Icon name="landmark" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">{t("detail.branch.empty")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => navigate(`/dpd/${b.code}`)}
                  className="group flex h-full flex-col rounded-2xl border bg-card p-5 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-[10px] font-bold text-primary border-primary/30">
                      {b.code}
                    </Badge>
                    <Icon name="chevron-right" className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
                  </div>
                  <h2 className="mt-3 flex items-start gap-2 text-base font-extrabold leading-snug group-hover:text-primary">
                    <Icon name="landmark" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden />
                    {b.name}
                  </h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name="map-pin" className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                    {[b.city, b.province].filter(Boolean).join(", ")}
                  </p>
                  {b.officeName && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon name="building-2" className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                      <span className="truncate">{b.officeName}</span>
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* CTA bentuk cabang baru */}
          <div className="mt-10 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-primary">
              <Icon name="user-plus" className="h-5 w-5" aria-hidden />
              {t("detail.branch.joinCta")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("detail.branch.joinBody")}</p>
            <WaCtaButton
              className="mt-4"
              message="Assalamu'alaikum, saya tertarik membangun jaringan kepengurusan daerah MUHDIN (Bakorwil/Bakorcab) di kota saya. Boleh dibahas lebih lanjut?"
              label={t("detail.branch.call")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/** ===== DETAIL SATU CABANG (by code) ===== */
export function BranchDetail({ code }: { code: string }) {
  const { t } = useT();
  const [branches, setBranches] = useState<RegionalBranchItem[] | null>(null);

  useEffect(() => {
    apiGet<RegionalBranchItem[]>("/api/branches")
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  const branch = useMemo(() => branches?.find((b) => b.code === code) ?? null, [branches, code]);
  const others = useMemo(
    () => (branch ? (branches ?? []).filter((b) => b.id !== branch.id).slice(0, 3) : []),
    [branches, branch]
  );

  if (!branches) return <DetailLoading />;

  if (!branch) {
    return (
      <DetailNotFound
        message={t("detail.branch.notFound")}
        backTo="/dpd"
        backLabel={t("detail.branch.allBranches")}
      />
    );
  }

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={branch.code}
        title={branch.name}
        subtitle={[branch.city, branch.province].filter(Boolean).join(", ")}
        backTo="/dpd"
        backLabel={t("detail.branch.allBranches")}
        badge={
          branch.officeName ? (
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
              <Icon name="building-2" className="h-3.5 w-3.5" aria-hidden />
              {branch.officeName}
            </Badge>
          ) : undefined
        }
      />

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-8">
            <div>
              <DetailSectionHead icon="landmark" title={t("detail.branch.office")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon="badge-check" label={t("detail.branch.code")} value={branch.code} />
                <InfoRow icon="map" label={t("detail.branch.coverage")} value={branch.province || "—"} />
                <InfoRow icon="building-2" label={t("detail.branch.office")} value={branch.officeName || "—"} />
                <InfoRow icon="user-cog" label={t("detail.branch.pic")} value={branch.picName || "—"} />
              </div>
              <div className="mt-3">
                <InfoRow icon="map-pin" label="Alamat" value={branch.address} href={mapsHref} external />
              </div>
            </div>

            {branch.description && (
              <div>
                <DetailSectionHead icon="scroll-text" title="Profil" />
                <div className="rounded-2xl border bg-card p-6 leading-relaxed text-foreground/90 shadow-sm">
                  {branch.description}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div>
                <DetailSectionHead icon="network" title={t("detail.branch.allBranches")} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {others.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => navigate(`/dpd/${b.code}`)}
                      className="group flex h-full w-full items-center gap-3 rounded-2xl border bg-card p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-deep to-primary text-white shadow-sm">
                        <Icon name="landmark" className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold group-hover:text-primary">{b.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{[b.city, b.province].filter(Boolean).join(", ")}</span>
                      </span>
                      <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar kontak cabang */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                <Icon name="phone" className="h-4 w-4 text-primary" aria-hidden />
                {t("detail.common.contactTitle")}
              </h2>
              <div className="mt-4 space-y-2.5">
                <InfoRow icon="user-cog" label={t("detail.branch.pic")} value={branch.picName || "—"} />
                {branch.picPhone && (
                  <InfoRow icon="phone" label="Telepon / WA" value={branch.picPhone} href={`tel:${branch.picPhone.replace(/\s/g, "")}`} />
                )}
                {branch.email && (
                  <InfoRow icon="mail" label="Email" value={branch.email} href={`mailto:${branch.email}`} />
                )}
              </div>
              <div className="mt-4 space-y-2.5">
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
                >
                  <Icon name="map-pin" className="h-4 w-4" aria-hidden />
                  {t("detail.branch.directions")}
                </a>
                {branch.picPhone && (
                  <WaCtaButton
                    className="w-full justify-center"
                    message={`Assalamu'alaikum, saya menemukan ${branch.name} di portal MUHDIN dan ingin bertanya tentang layanan di wilayah kami.`}
                    label={t("detail.branch.call")}
                  />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-primary">
                <Icon name="info" className="h-4 w-4" aria-hidden />
                {t("detail.common.infoTitle")}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("detail.common.infoBody")}</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
