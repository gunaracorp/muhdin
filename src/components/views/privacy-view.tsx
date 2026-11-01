"use client";

/**
 * Task 33-c — PrivacyView: halaman kebijakan privasi (route #/privasi).
 * Task 19 (R-078) — kini hidup sepenuhnya: formulir Hak Subjek Data Pribadi
 * (akses/ekspor & penghapusan) tersambung antrean /api/privacy-requests.
 */
import { useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";

function PolicySection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section aria-label={title} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon name={icon} className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-lg font-extrabold leading-snug">{title}</h2>
        </div>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/80">{children}</div>
      </section>
    </Reveal>
  );
}

export function PrivacyView() {
  const { t } = useT();

  // R-078 — state formulir Hak Subjek Data (DSR)
  const [dsrType, setDsrType] = useState<"EXPORT" | "DELETE">("EXPORT");
  const [dsrName, setDsrName] = useState("");
  const [dsrContact, setDsrContact] = useState("");
  const [dsrMessage, setDsrMessage] = useState("");
  const [dsrBusy, setDsrBusy] = useState(false);
  const [dsrRef, setDsrRef] = useState<string | null>(null);
  const [dsrErr, setDsrErr] = useState("");

  const submitDsr = async () => {
    setDsrErr("");
    setDsrBusy(true);
    try {
      const res = await apiSend<{ id: string; guidance: string }>("/api/privacy-requests", "POST", {
        type: dsrType,
        name: dsrName.trim(),
        contact: dsrContact.trim(),
        message: dsrMessage.trim() || undefined,
      });
      setDsrRef(res.id);
      setDsrName("");
      setDsrContact("");
      setDsrMessage("");
    } catch (e) {
      setDsrErr((e as Error).message || "Gagal mengirim permintaan.");
    } finally {
      setDsrBusy(false);
    }
  };

  const NOT_PUBLISHED = [
    { icon: "fingerprint", key: "notpubNik" },
    { icon: "passport", key: "notpubPassport" },
    { icon: "wallet", key: "notpubBank" },
    { icon: "file-text", key: "notpubDocs" },
    { icon: "eye-off", key: "notpubContact" },
  ] as const;

  return (
    <div className="flex flex-col">
      {/* HERO KECIL */}
      <section aria-label={t("nusTrust.priv.title")} className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {t("nusTrust.priv.eyebrow")}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("nusTrust.priv.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("nusTrust.priv.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section aria-label={t("nusTrust.priv.title")} className="py-12">
        <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
          {/* 1. Data yang kami kumpulkan */}
          <PolicySection icon="database-zap" title={t("nusTrust.priv.collectTitle")}>
            <p>{t("nusTrust.priv.collectDesc")}</p>
          </PolicySection>

          {/* 2. Data yang TIDAK kami publikasikan */}
          <Reveal>
            <section aria-label={t("nusTrust.priv.notpubTitle")} className="rounded-2xl border border-gold/40 bg-gold/5 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                  <Icon name="eye-off" className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-lg font-extrabold leading-snug">{t("nusTrust.priv.notpubTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t("nusTrust.priv.notpubDesc")}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {NOT_PUBLISHED.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-start gap-2 rounded-xl border bg-card p-3 text-sm text-foreground/85"
                  >
                    <Icon name={item.icon} className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden />
                    {t(`nusTrust.priv.${item.key}`)}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          {/* 3. Dasar pemrosesan & persetujuan */}
          <PolicySection icon="shield-check" title={t("nusTrust.priv.basisTitle")}>
            <p>{t("nusTrust.priv.basisDesc")}</p>
          </PolicySection>

          {/* 4. Retensi & penghapusan */}
          <PolicySection icon="timer" title={t("nusTrust.priv.retentionTitle")}>
            <p>{t("nusTrust.priv.retentionDesc")}</p>
          </PolicySection>

          {/* 5. Hak Anda */}
          <PolicySection icon="heart-handshake" title={t("nusTrust.priv.rightsTitle")}>
            <p>{t("nusTrust.priv.rightsDesc")}</p>
          </PolicySection>

          {/* 5-b. R-078 — Formulir Hak Subjek Data Pribadi (hidup, tersambung antrean petugas) */}
          <Reveal>
            <section aria-label={t("nusTrust.priv.dsrTitle")} className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="shield-check" className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-lg font-extrabold leading-snug">{t("nusTrust.priv.dsrTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t("nusTrust.priv.dsrDesc")}</p>

              {dsrRef ? (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
                  <p className="font-extrabold text-emerald-800 dark:text-emerald-300">{t("nusTrust.priv.dsrSuccess")}</p>
                  <code className="mt-1 inline-block rounded bg-emerald-700/15 px-2 py-0.5 font-mono font-extrabold text-emerald-900 dark:text-emerald-200">{dsrRef}</code>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setDsrRef(null); setDsrType("EXPORT"); }}>
                    {t("nusTrust.priv.dsrSubmit")}
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(["EXPORT", "DELETE"] as const).map((tp) => (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => setDsrType(tp)}
                        aria-pressed={dsrType === tp}
                        className={`rounded-xl border p-3 text-start text-sm font-bold transition ${
                          dsrType === tp
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon name={tp === "EXPORT" ? "download" : "trash-2"} className="me-2 inline h-4 w-4" aria-hidden />
                        {t(tp === "EXPORT" ? "nusTrust.priv.dsrTypeAccess" : "nusTrust.priv.dsrTypeDelete")}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dsr-name">{t("nusTrust.priv.dsrName")}</Label>
                    <Input id="dsr-name" value={dsrName} onChange={(e) => setDsrName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dsr-contact">{t("nusTrust.priv.dsrContact")}</Label>
                    <Input id="dsr-contact" value={dsrContact} onChange={(e) => setDsrContact(e.target.value)} placeholder="nama@email.com / 0812…" />
                  </div>
                  {dsrType === "DELETE" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="dsr-msg">{t("nusTrust.priv.dsrMessage")}</Label>
                      <Textarea id="dsr-msg" value={dsrMessage} onChange={(e) => setDsrMessage(e.target.value)} rows={3} />
                    </div>
                  )}
                  {dsrErr && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{dsrErr}</p>
                  )}
                  <Button onClick={submitDsr} disabled={dsrBusy} className="w-full sm:w-auto">
                    {dsrBusy ? (
                      <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Icon name="send" className="h-4 w-4" aria-hidden />
                    )}
                    <span className="ms-2">{t("nusTrust.priv.dsrSubmit")}</span>
                  </Button>
                </div>
              )}
            </section>
          </Reveal>

          {/* 6. Kontak */}
          <Reveal>
            <section aria-label={t("nusTrust.priv.contactTitle")} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="mail" className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold">{t("nusTrust.priv.contactTitle")}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                      {t("nusTrust.priv.contactDesc")}
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:info@muhdin.web.id"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-forest"
                >
                  <Icon name="send" className="h-4 w-4" aria-hidden />
                  info@muhdin.web.id
                </a>
              </div>
            </section>
          </Reveal>

          {/* CATATAN PLACEHOLDER */}
          <Reveal delay={0.08}>
            <aside
              aria-label={t("nusTrust.priv.placeholder")}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5"
            >
              <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground/85">
                <span className="font-extrabold">{t("nusTrust.priv.title")}: </span>
                {t("nusTrust.priv.placeholder")}
              </p>
            </aside>
          </Reveal>

          {/* CTA menuju syarat */}
          <Reveal delay={0.12} className="pt-2 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("syarat")}
              className="rounded-full px-6 font-bold"
            >
              {t("nusTrust.terms.title")}
              <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
