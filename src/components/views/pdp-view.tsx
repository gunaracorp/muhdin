"use client";

/**
 * Task 5-c — PdpView: kepatuhan UU PDP No. 27 Tahun 2022 (route #/pdp).
 * Hero + callout berlaku, prinsip pemrosesan (6), hak subjek data (7 kartu
 * Pasal 5–13), FORM DSAR fungsional (POST /api/messages + toast + 429-safe),
 * perlindungan teknis & organisasi (6), DPO & kanal keluhan.
 * Pola view mengikuti privacy-view; pola form mengikuti contact-view.
 */
import { useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { TrustHero, TrustSection, TrustCallout } from "@/components/views/p0-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";

/* ---------- daftar item (pola ITEMS + t(ns.x.key)) ---------- */

const PRINCIPLES = [
  { icon: "target", key: "purpose" },
  { icon: "info", key: "notice" },
  { icon: "clipboard-list", key: "minimize" },
  { icon: "badge-check", key: "accuracy" },
  { icon: "lock", key: "security" },
  { icon: "scroll-text", key: "accountability" },
] as const;

const RIGHTS = [
  { icon: "eye", key: "access" },
  { icon: "file-text", key: "copy" },
  { icon: "pencil", key: "correct" },
  { icon: "trash", key: "erase" },
  { icon: "refresh", key: "withdraw" },
  { icon: "ban", key: "objection" },
  { icon: "wallet", key: "compensation" },
] as const;

const SECURITY = [
  { icon: "lock", key: "tls" },
  { icon: "keyround", key: "hash" },
  { icon: "scroll-text", key: "audit" },
  { icon: "eye-off", key: "minimize" },
  { icon: "timer", key: "retention" },
  { icon: "user-cog", key: "rbac" },
] as const;

const DSAR_TYPES = ["akses", "salinan", "koreksi", "hapus", "tarik", "keberatan"] as const;
type DsarKey = (typeof DSAR_TYPES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------ FORM DSAR ------------------------------ */

type DsarErrors = Partial<Record<"name" | "email" | "type" | "desc", string>>;

function DsarForm() {
  const { toast } = useToast();
  const { t } = useT();
  const [form, setForm] = useState({ name: "", email: "", type: "" as DsarKey | "", desc: "", phone: "" });
  const [errors, setErrors] = useState<DsarErrors>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k as keyof DsarErrors]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (): DsarErrors => {
    const errs: DsarErrors = {};
    if (!form.name.trim()) errs.name = t("pdp.dsar.errName");
    if (!EMAIL_RE.test(form.email.trim())) errs.email = t("pdp.dsar.errEmail");
    if (!form.type) errs.type = t("pdp.dsar.errType");
    if (form.desc.trim().length < 10) errs.desc = t("pdp.dsar.errDesc");
    return errs;
  };

  const submit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    try {
      await apiSend("/api/messages", "POST", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: `DSAR — ${t(`pdp.dsar.opt.${form.type}`)}`,
        message: form.desc.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      toast({ title: t("pdp.dsar.toastOkTitle"), description: t("pdp.dsar.toastOkDesc") });
      setForm({ name: "", email: "", type: "", desc: "", phone: "" });
      setErrors({});
    } catch (e) {
      // Termasuk HTTP 429 rate limit (5/menit/IP) — pesan {error} dari server.
      toast({ title: t("pdp.dsar.toastFailTitle"), description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const err = (k: keyof DsarErrors) =>
    errors[k] ? (
      <p className="text-xs font-semibold text-destructive">{errors[k]}</p>
    ) : null;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pdp-dsar-name">{t("pdp.dsar.labelName")}</Label>
          <Input
            id="pdp-dsar-name"
            value={form.name}
            onChange={set("name")}
            placeholder={t("pdp.dsar.phName")}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
          />
          {err("name")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pdp-dsar-email">{t("pdp.dsar.labelEmail")}</Label>
          <Input
            id="pdp-dsar-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder={t("pdp.dsar.phEmail")}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            dir="ltr"
          />
          {err("email")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pdp-dsar-type">{t("pdp.dsar.labelType")}</Label>
          <Select
            value={form.type}
            onValueChange={(v: DsarKey) => {
              setForm((f) => ({ ...f, type: v }));
              if (errors.type) setErrors((er) => ({ ...er, type: undefined }));
            }}
          >
            <SelectTrigger id="pdp-dsar-type" aria-invalid={Boolean(errors.type)} className="w-full">
              <SelectValue placeholder={t("pdp.dsar.phType")} />
            </SelectTrigger>
            <SelectContent>
              {DSAR_TYPES.map((o) => (
                <SelectItem key={o} value={o}>
                  {t(`pdp.dsar.opt.${o}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("type")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pdp-dsar-phone">
            {t("pdp.dsar.labelPhone")}{" "}
            <span className="font-normal text-muted-foreground">({t("pdp.dsar.optional")})</span>
          </Label>
          <Input
            id="pdp-dsar-phone"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder={t("pdp.dsar.phPhone")}
            autoComplete="tel"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pdp-dsar-desc">{t("pdp.dsar.labelDesc")}</Label>
          <Textarea
            id="pdp-dsar-desc"
            value={form.desc}
            onChange={set("desc")}
            rows={5}
            placeholder={t("pdp.dsar.phDesc")}
            aria-invalid={Boolean(errors.desc)}
          />
          {err("desc")}
        </div>
      </div>
      <Button
        onClick={submit}
        disabled={loading}
        className="mt-6 h-11 w-full bg-gradient-to-r from-primary to-forest px-8 text-white sm:w-auto"
      >
        {loading ? (
          <Icon name="loader-2" className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon name="send" className="me-2 h-4 w-4" />
        )}
        {loading ? t("pdp.dsar.btnSubmitting") : t("pdp.dsar.btnSubmit")}
      </Button>

      {/* Teks bantuan */}
      <ul className="mt-6 grid gap-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground sm:grid-cols-3">
        {(
          [
            { icon: "shield-check", key: "verify" },
            { icon: "clock", key: "sla" },
            { icon: "info", key: "minimal" },
          ] as const
        ).map((h) => (
          <li key={h.key} className="flex items-start gap-2">
            <Icon name={h.icon} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {t(`pdp.dsar.help.${h.key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- VIEW --------------------------------- */

export function PdpView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        eyebrow={t("pdp.hero.eyebrow")}
        title={t("pdp.hero.title")}
        subtitle={t("pdp.hero.subtitle")}
      />

      <section aria-label={t("pdp.hero.title")} className="py-12">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
          {/* Callout gold — berlaku penuh */}
          <TrustCallout tone="gold" icon="book-marked" title={t("pdp.callout.title")}>
            {t("pdp.callout.text")}
          </TrustCallout>

          {/* Prinsip Pemrosesan Data — grid 3×2 */}
          <TrustSection
            icon="shield-check"
            title={t("pdp.principles.title")}
            desc={t("pdp.principles.desc")}
          >
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.key} delay={Math.min(i * 0.05, 0.25)}>
                  <li className="h-full rounded-xl border bg-background/40 p-4">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon name={p.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                    </span>
                    <p className="mt-2.5 text-sm font-extrabold leading-snug">
                      {t(`pdp.principles.items.${p.key}.t`)}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {t(`pdp.principles.items.${p.key}.d`)}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </TrustSection>

          {/* Hak Subjek Data — grid 2 kolom, 7 kartu Pasal 5–13 */}
          <TrustSection icon="heart-handshake" title={t("pdp.rights.title")} desc={t("pdp.rights.desc")}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {RIGHTS.map((r, i) => (
                <Reveal key={r.key} delay={Math.min(i * 0.04, 0.24)}>
                  <li className="flex h-full items-start gap-3 rounded-xl border bg-background/40 p-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-deep">
                      <Icon name={r.icon} className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold leading-snug">
                          {t(`pdp.rights.items.${r.key}.t`)}
                        </p>
                        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-extrabold text-gold-deep">
                          {t(`pdp.rights.items.${r.key}.article`)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {t(`pdp.rights.items.${r.key}.d`)}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </TrustSection>

          {/* Form DSAR */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="DSAR"
              title={t("pdp.dsar.title")}
              subtitle={t("pdp.dsar.desc")}
            />
            <Reveal className="mt-4">
              <DsarForm />
            </Reveal>
          </div>

          {/* Perlindungan Teknis & Organisasi — 6 poin */}
          <TrustSection
            icon="server"
            title={t("pdp.security.title")}
            desc={t("pdp.security.desc")}
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              {SECURITY.map((s) => (
                <li
                  key={s.key}
                  className="flex items-start gap-2.5 rounded-xl border bg-background/40 p-3.5"
                >
                  <Icon name={s.icon} className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold leading-snug">
                      {t(`pdp.security.items.${s.key}.t`)}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {t(`pdp.security.items.${s.key}.d`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </TrustSection>

          {/* DPO & Kanal Keluhan */}
          <Reveal>
            <section
              aria-label={t("pdp.dpo.title")}
              className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="life-buoy" className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold">{t("pdp.dpo.title")}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">{t("pdp.dpo.desc")}</p>
                  </div>
                </div>
                <div className="shrink-0 text-start sm:text-center">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("pdp.dpo.contactLabel")}
                  </p>
                  <a
                    href="mailto:dpo@muhdin.web.id"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-forest"
                  >
                    <Icon name="mail" className="h-4 w-4" aria-hidden />
                    <span dir="ltr">dpo@muhdin.web.id</span>
                  </a>
                </div>
              </div>
              <p className="mt-4 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                {t("pdp.dpo.note")}
              </p>
            </section>
          </Reveal>

          {/* CTA menuju syarat */}
          <Reveal delay={0.08} className="pt-2 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("syarat")}
              className="rounded-full px-6 font-bold"
            >
              {t("pdp.cta.terms")}
              <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
