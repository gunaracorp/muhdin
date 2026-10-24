"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import type { Member } from "@/lib/types";

const MIN_CONTENT = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = ["Pelayanan", "Pembayaran", "Itinerary", "Lainnya"] as const;

export function ReportView() {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [refId, setRefId] = useState<string | null>(null);
  const [formErr, setFormErr] = useState("");
  const [fieldErr, setFieldErr] = useState<{ name?: string; email?: string; content?: string }>({});
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    targetMember: "",
    category: "Pelayanan",
    content: "",
  });

  // Datalist nama anggota terverifikasi (maks 50) — gagal senyap, bukan halangan.
  useEffect(() => {
    apiGet<Member[]>("/api/members?status=TERVERIFIKASI")
      .then((ms) => setMemberNames(ms.filter((m) => m.status === "TERVERIFIKASI").map((m) => m.name).slice(0, 50)))
      .catch(() => setMemberNames([]));
  }, []);

  const validate = () => {
    const errs: typeof fieldErr = {};
    if (!form.name.trim()) errs.name = t("report.errName");
    if (!EMAIL_RE.test(form.email.trim())) errs.email = t("report.errEmail");
    if (form.content.trim().length < MIN_CONTENT)
      errs.content = t("report.errContent", { min: MIN_CONTENT });
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiSend<{ id: string }>("/api/complaints", "POST", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        targetMember: form.targetMember.trim() || null,
        category: form.category,
        content: form.content.trim(),
      });
      setRefId(res?.id ?? "");
    } catch (err) {
      const msg = (err as Error).message || "";
      setFormErr(/terlalu banyak|terlalu sering|rate|429|tunggu|wait/i.test(msg) ? t("report.rateLimitMsg") : msg);
    } finally {
      setLoading(false);
    }
  };

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const again = () => {
    setRefId(null);
    setForm({ name: "", email: "", phone: "", targetMember: "", category: "Pelayanan", content: "" });
    setFieldErr({});
    setFormErr("");
  };

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("report.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("report.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("report.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {refId !== null ? (
            /* KARTU KONFIRMASI */
            <Reveal>
              <div className="rounded-3xl border border-primary/30 bg-card p-8 sm:p-10 shadow-sm text-center" role="status">
                <span className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center text-primary">
                  <Icon name="check-circle-2" className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-2xl font-extrabold text-primary">{t("report.successTitle")}</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{t("report.successDesc")}</p>
                <div className="mt-6 rounded-2xl border bg-muted/40 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("report.successRefLabel")}
                  </p>
                  <p className="mt-1.5 font-mono text-xl sm:text-2xl font-extrabold text-foreground break-all" dir="ltr">
                    {refId}
                  </p>
                </div>
                <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
                  {t("report.successNote")}
                </p>
                <Button
                  variant="outline"
                  onClick={again}
                  className="mt-6"
                  aria-label={t("report.btnAgainAria")}
                >
                  <Icon name="rotate" className="h-4 w-4 me-1.5" />
                  {t("report.btnAgain")}
                </Button>
              </div>
            </Reveal>
          ) : (
            <>
              {/* FORM */}
              <Reveal>
                <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                      <Icon name="message-square" className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-extrabold">{t("report.formTitle")}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">{t("report.formDesc")}</p>
                    </div>
                  </div>

                  <form
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                    onSubmit={submit}
                    noValidate
                    aria-label={t("report.ariaForm")}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="r-name">{t("report.labelName")}</Label>
                      <Input
                        id="r-name"
                        value={form.name}
                        onChange={set("name")}
                        placeholder={t("report.namePlaceholder")}
                        aria-invalid={!!fieldErr.name}
                        autoComplete="name"
                      />
                      {fieldErr.name && (
                        <p role="alert" className="text-xs font-semibold text-destructive">
                          {fieldErr.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="r-email">{t("report.labelEmail")}</Label>
                      <Input
                        id="r-email"
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        placeholder={t("report.emailPlaceholder")}
                        aria-invalid={!!fieldErr.email}
                        autoComplete="email"
                        dir="ltr"
                      />
                      {fieldErr.email && (
                        <p role="alert" className="text-xs font-semibold text-destructive">
                          {fieldErr.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="r-phone">{t("report.labelPhone")}</Label>
                      <Input
                        id="r-phone"
                        type="tel"
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder={t("report.phonePlaceholder")}
                        autoComplete="tel"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="r-target">{t("report.labelTarget")}</Label>
                      <Input
                        id="r-target"
                        value={form.targetMember}
                        onChange={set("targetMember")}
                        placeholder={t("report.targetPlaceholder")}
                        list="report-members"
                        aria-describedby="r-target-hint"
                      />
                      <datalist id="report-members">
                        {memberNames.map((n) => (
                          <option key={n} value={n} />
                        ))}
                      </datalist>
                      <p id="r-target-hint" className="text-[11px] text-muted-foreground">
                        {t("report.targetHint")}
                      </p>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="r-category">{t("report.labelCategory")}</Label>
                      <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                        <SelectTrigger id="r-category" aria-label={t("report.labelCategory")}>
                          <SelectValue placeholder={t("report.catPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {t(`report.cat${c}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <Label htmlFor="r-content">{t("report.labelContent")}</Label>
                        <span className="text-[11px] text-muted-foreground" aria-live="polite">
                          {t("report.charCount", { n: form.content.length, min: MIN_CONTENT })}
                        </span>
                      </div>
                      <Textarea
                        id="r-content"
                        value={form.content}
                        onChange={set("content")}
                        rows={6}
                        placeholder={t("report.contentPlaceholder")}
                        aria-invalid={!!fieldErr.content}
                      />
                      {fieldErr.content && (
                        <p role="alert" className="text-xs font-semibold text-destructive">
                          {fieldErr.content}
                        </p>
                      )}
                    </div>

                    {formErr && (
                      <p
                        role="alert"
                        className="sm:col-span-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
                      >
                        {formErr}
                      </p>
                    )}

                    <div className="sm:col-span-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 text-base bg-gradient-to-r from-primary to-forest text-white shadow-lg hover:shadow-xl"
                        aria-label={t("report.btnSubmitAria")}
                      >
                        {loading ? (
                          <Icon name="loader-2" className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                          <Icon name="send" className="h-4 w-4 me-2" />
                        )}
                        {t("report.btnSubmit")}
                      </Button>
                    </div>
                  </form>
                </div>
              </Reveal>

              {/* CATATAN PRIVASI & ETIKA */}
              <Reveal delay={0.08} className="mt-6">
                <div className="rounded-3xl border bg-muted/30 p-6">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold">
                    <Icon name="shield-alert" className="h-5 w-5 text-gold-deep" />
                    {t("report.privacyTitle")}
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                    <li className="flex gap-2">
                      <Icon name="check-circle-2" className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      {t("report.privacyList1")}
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check-circle-2" className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      {t("report.privacyList2")}
                    </li>
                  </ul>
                </div>
              </Reveal>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
