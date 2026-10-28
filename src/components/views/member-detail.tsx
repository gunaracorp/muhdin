"use client";

/**
 * MemberDetail (v4.1) — HALAMAN SENDIRI untuk setiap anggota ekosistem.
 * Route: #/anggota/<id>
 *
 * Menampilkan profil lengkap satu penyelenggara: status verifikasi, izin,
 * jenis, domisili, rating, riwayat keanggotaan, deskripsi, serta kanal
 * kontak resmi (WhatsApp/telepon/email/website) + anggota terkait satu
 * provinsi. Data dari /api/members (dataset kecil — cari di sisi klien).
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { useT, type Locale } from "@/lib/i18n";
import type { Member } from "@/lib/types";
import {
  DetailHero, DetailLoading, DetailNotFound, DetailSectionHead,
  InfoRow, RelatedLinkCard, WaCtaButton,
} from "@/components/views/detail-shell";

const TYPE_LABEL: Record<string, Record<Locale, string>> = {
  PPIU: { id: "PPIU — Penyelenggara Umrah", en: "PPIU — Umrah Operator", ar: "منظم عمرة" },
  PIHK: { id: "PIHK — Penyelenggara Haji Khusus", en: "PIHK — Special Hajj Operator", ar: "منظم حج خاص" },
  KBIHU: { id: "KBIHU — Kelompok Binaan", en: "KBIHU — Guided Group", ar: "مجموعة موجهة" },
  TRAVEL_WISATA: { id: "Travel Wisata", en: "Travel Agency", ar: "وكالة سفر" },
  IPHI: { id: "IPHI — Persaudaraan Haji", en: "IPHI — Hajj Brotherhood", ar: "أخوية الحج" },
};

function typeLabel(type: string, locale: Locale): string {
  return TYPE_LABEL[type]?.[locale] ?? type;
}

export function MemberDetail({ id }: { id: string }) {
  const { t, locale, dir } = useT();
  const [members, setMembers] = useState<Member[] | null>(null);

  useEffect(() => {
    apiGet<Member[]>("/api/members")
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  const member = useMemo(() => members?.find((m) => m.id === id) ?? null, [members, id]);
  const related = useMemo(
    () => (member ? (members ?? []).filter((m) => m.id !== member.id && m.province === member.province).slice(0, 3) : []),
    [members, member]
  );

  if (!members) return <DetailLoading />;

  if (!member) {
    return (
      <DetailNotFound
        message="Anggota tidak ditemukan atau sudah tidak terdaftar dalam direktori MUHDIN."
        backTo="/anggota"
        backLabel="Kembali ke Direktori Anggota"
      />
    );
  }

  const verified = member.status === "VERIFIED";
  const waDigits = (member.phone || "").replace(/[^\d]/g, "").replace(/^0/, "62");
  const initial = member.name.trim().charAt(0).toUpperCase();
  const stars = Math.round(member.rating);

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <DetailHero
        eyebrow={typeLabel(member.type, locale)}
        title={member.name}
        subtitle={[member.city, member.province].filter(Boolean).join(", ")}
        backTo="/anggota"
        backLabel={t("members.title")}
        badge={
          <>
            {verified ? (
              <Badge className="gap-1.5 border-none bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/40">
                <Icon name="badge-check" className="h-3.5 w-3.5" aria-hidden />
                {t("members.status.TERVERIFIKASI")}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                {member.status}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 border-white/30 bg-white/10 text-white">
              <Icon name="star" className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
              {member.rating.toFixed(1)}
            </Badge>
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
              <Icon name="clock" className="h-3.5 w-3.5" aria-hidden />
              {t("members.since", { year: member.memberSince })}
            </Badge>
          </>
        }
      >
        {/* Monogram besar */}
        <div className="mt-6 flex items-center gap-4">
          <span
            aria-hidden
            className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-gold-deep to-primary text-4xl font-black text-white shadow-lg ring-2 ring-white/20"
          >
            {initial}
          </span>
        </div>
      </DetailHero>

      {/* ===== KONTEN ===== */}
      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_340px]">
          {/* Kolom utama */}
          <div className="min-w-0 space-y-8">
            <div>
              <DetailSectionHead icon="building-2" title={t("members.profileTitle")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon="badge-check" label={t("members.licenseLabel")} value={member.licenseNo} />
                <InfoRow icon="grid-3x3" label={t("members.typeLabel")} value={typeLabel(member.type, locale)} />
                <InfoRow icon="map-pin" label={t("members.cityLabel")} value={member.city} />
                <InfoRow icon="map" label={t("members.provinceLabel")} value={member.province} />
                <InfoRow icon="clock" label={t("members.sinceLabel")} value={member.memberSince} />
                <InfoRow
                  icon="star"
                  label={t("members.ratingLabel")}
                  value={
                    <span className="flex items-center gap-1.5">
                      <span className="flex" aria-hidden>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Icon
                            key={i}
                            name="star"
                            className={`h-4 w-4 ${i < stars ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </span>
                      {member.rating.toFixed(1)}
                    </span>
                  }
                />
              </div>
            </div>

            {member.description && (
              <div>
                <DetailSectionHead icon="file-text" title={t("members.aboutTitle")} />
                <div className="rounded-2xl border bg-card p-5 leading-relaxed text-foreground/90 shadow-sm">
                  {member.description}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div>
                <DetailSectionHead icon="users" title={t("members.relatedTitle")} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((m) => (
                    <RelatedLinkCard
                      key={m.id}
                      href={`/anggota/${m.id}`}
                      icon="building-2"
                      title={m.name}
                      meta={[m.city, m.province].filter(Boolean).join(", ")}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar kontak */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                <Icon name="phone" className="h-4 w-4 text-primary" aria-hidden />
                {t("members.contactTitle")}
              </h2>
              <div className="mt-4 space-y-2.5">
                {member.phone && (
                  <InfoRow icon="phone" label="Telepon" value={member.phone} href={`tel:${member.phone.replace(/\s/g, "")}`} />
                )}
                {member.email && (
                  <InfoRow icon="mail" label="Email" value={member.email} href={`mailto:${member.email}`} />
                )}
                {member.website && (
                  <InfoRow icon="globe" label="Website" value={member.website.replace(/^https?:\/\//, "")} href={member.website} external />
                )}
                {!member.phone && !member.email && !member.website && (
                  <p className="text-sm text-muted-foreground">{t("members.noContact")}</p>
                )}
              </div>
              {waDigits && (
                <WaCtaButton
                  className="mt-4 w-full justify-center"
                  message={`Assalamu'alaikum, saya menemukan ${member.name} di direktori resmi MUHDIN dan ingin bertanya tentang layanan Anda.`}
                  label={t("members.waCta")}
                />
              )}
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-primary">
                <Icon name="shield-check" className="h-4 w-4" aria-hidden />
                {t("members.tipTitle")}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("members.tipBody")}</p>
              <button
                type="button"
                onClick={() => navigate("verifikasi")}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                {t("members.verifyCta")}
                <Icon name="chevron-right" className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
