"use client";

/**
 * PengurusDetail (v4.1) — HALAMAN SENDIRI untuk setiap tokoh pengurus.
 * Route: #/pengurus/<id>  (pembina | penasehat | ketum | sekjen | bemdum)
 *
 * Profil tokoh nasional: foto/monogram, jabatan (i18n), mandat lengkap
 * (i18n pengurus.mandate.<id>), posisi dalam struktur, bidang fungsional
 * di bawahnya (untuk BEMDUM), CTA kontak, dan navigasi antar tokoh.
 * Data statis dari src/lib/pengurus-data.ts (sumber kebenaran tunggal).
 */

import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { PENGURUS_PERSON, PENGURUS_BIDANG, type PengurusId } from "@/lib/pengurus-data";
import { navigate } from "@/hooks/use-hash-route";
import {
  DetailHero, DetailNotFound, DetailSectionHead, RelatedLinkCard, WaCtaButton,
} from "@/components/views/detail-shell";
import { cn } from "@/lib/utils";

/** Ikhtisar peran (paragraf pembuka halaman) — i18n per tokoh. */
const ROLE_SUMMARY: Record<PengurusId, string> = {
  pembina: "pengurus.role.pembina",
  penasehat: "pengurus.role.penasehat",
  ketum: "pengurus.role.ketum",
  sekjen: "pengurus.role.sekjen",
  bemdum: "pengurus.role.bemdum",
};

const ALL_IDS: PengurusId[] = ["pembina", "penasehat", "ketum", "sekjen", "bemdum"];

export function PengurusDetail({ id }: { id: string }) {
  const { t } = useT();
  const person = PENGURUS_PERSON[id as PengurusId];

  if (!person) {
    return (
      <DetailNotFound
        message="Tokoh pengurus tidak ditemukan. Lihat susunan lengkap di halaman Pengurus."
        backTo="/pengurus"
        backLabel={t("pengurus.title")}
      />
    );
  }

  const idx = ALL_IDS.indexOf(person.id);
  const prev = idx > 0 ? PENGURUS_PERSON[ALL_IDS[idx - 1]] : undefined;
  const next = idx < ALL_IDS.length - 1 ? PENGURUS_PERSON[ALL_IDS[idx + 1]] : undefined;
  const others = ALL_IDS.filter((p) => p !== person.id).map((p) => PENGURUS_PERSON[p]);
  const roleLabel = t(`pengurus.role.${person.id}`);
  const mandate = t(`pengurus.mandate.${person.id}`);

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <DetailHero
        eyebrow={t("pengurus.eyebrow")}
        title={person.name}
        subtitle={roleLabel}
        backTo="/pengurus"
        backLabel={t("pengurus.title")}
        badge={
          <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
            <Icon name="star" className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
            {t("pengurus.statLeaders")}
          </Badge>
        }
      >
        {/* Foto / monogram */}
        <div className="mt-6">
          {person.photo ? (
            <img
              src={person.photo}
              alt={person.name}
              className="h-28 w-28 rounded-3xl object-cover shadow-lg ring-2 ring-white/20"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-gold-deep to-primary text-4xl font-black text-white shadow-lg ring-2 ring-white/20"
            >
              {person.name.replace(/^(Prof\.|Dr\.|Drs\.|KH\.|H\.|Hj\.)\s*/gi, "").charAt(0)}
            </span>
          )}
        </div>

        {/* Navigasi antar tokoh */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {prev && (
            <button
              type="button"
              onClick={() => navigate(`/pengurus/${prev.id}`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Icon name="chevron-right" className="h-3.5 w-3.5 rotate-180 rtl:rotate-0" aria-hidden />
              {prev.name}
            </button>
          )}
          {next && (
            <button
              type="button"
              onClick={() => navigate(`/pengurus/${next.id}`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              {next.name}
              <Icon name="chevron-right" className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </button>
          )}
        </div>
      </DetailHero>

      {/* ===== KONTEN ===== */}
      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-8">
            {/* Mandat */}
            <div>
              <DetailSectionHead icon="scroll-text" title={t("pengurus.central.appoint") || "Mandat"} />
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">{roleLabel}</p>
                <p className="mt-2 text-base leading-relaxed text-foreground/90">{mandate}</p>
                <p className="mt-4 border-t pt-4 text-sm leading-relaxed text-muted-foreground">
                  {person.id === "ketum" || person.id === "sekjen"
                    ? t("pengurus.featured.desc")
                    : t("pengurus.advisory.desc")}
                </p>
              </div>
            </div>

            {/* Bidang fungsional (khusus BEMDUM) — relevan juga untuk semua: struktur pelaksana */}
            {person.id === "bemdum" && (
              <div>
                <DetailSectionHead icon="layout-dashboard" title={t("pengurus.central.title")} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {PENGURUS_BIDANG.map((b, i) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon name={b.icon} className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="text-sm font-bold">{t(`pengurus.bidang.b${i + 1}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tokoh lain */}
            <div>
              <DetailSectionHead icon="users" title={t("pengurus.title")} />
              <div className="grid gap-3 sm:grid-cols-2">
                {others.map((p) => (
                  <RelatedLinkCard
                    key={p.id}
                    href={`/pengurus/${p.id}`}
                    icon={p.icon}
                    title={p.name}
                    meta={t(`pengurus.role.${p.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                <Icon name="phone" className="h-4 w-4 text-primary" aria-hidden />
                {t("detail.common.contactTitle")}
              </h2>
              <div className="mt-4 space-y-2.5">
                <WaCtaButton
                  className="w-full justify-center"
                  message={`Assalamu'alaikum, saya ingin menghubungi Pengurus MUHDIN terkait ${roleLabel} (${person.name}).`}
                  label={t("pengurus.cta.contact")}
                />
                <button
                  type="button"
                  onClick={() => navigate("/tentang")}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/15"
                >
                  <Icon name="info" className="h-4 w-4" aria-hidden />
                  {t("navbar.items.tentang")}
                </button>
              </div>
            </div>

            <div className={cn("rounded-2xl border border-primary/25 bg-primary/5 p-5")}>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-primary">
                <Icon name="shield-check" className="h-4 w-4" aria-hidden />
                {t("pengurus.advisory.eyebrow")}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("pengurus.advisory.desc")}</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
