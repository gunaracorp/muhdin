"use client";

/**
 * Task 5-d — WidgetView: Widget Badge Verifikasi MUHDIN (route #/widget).
 *
 * Halaman untuk penyelenggara anggota: memasang 1 baris <script src="…/muhdin-badge.js">
 * di website travel agar jamaah melihat status keanggotaan real-time dari
 * /api/widget/verify (kontrak: { found, member?, checkedAt } — field minimal).
 *
 * - Preview live mem-embed /widget-demo.html?license=<q> via iframe sandbox.
 * - ORIGIN dihitung dari window.location.origin (tanpa hardcode; guard SSR:
 *   render placeholder sebelum mount — pola adjusting-state-during-render).
 * - RTL-aman (ms/me/start/end + icon-flip), dark-mode-aman, mobile-first.
 */
import { useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { TrustHero, TrustSection, TrustCallout, TrustSteps } from "@/components/views/p0-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";

/* ------------------------------ Konstanta ------------------------------ */

const DEFAULT_LICENSE = "PPIU-2025-0018";

const WHY = [
  { key: "realtime", icon: "qr-code" },
  { key: "anti", icon: "shield-check" },
  { key: "conversion", icon: "trending-up" },
] as const;

const ATTRS = [
  { key: "q", attr: "data-q" },
  { key: "lang", attr: "data-lang" },
  { key: "endpoint", attr: "data-endpoint" },
  { key: "size", attr: "data-size" },
] as const;

const RULES = [
  { key: "data", icon: "database-zap" },
  { key: "owner", icon: "shield-check" },
  { key: "tamper", icon: "gavel" },
] as const;

/* -------------------------------- View --------------------------------- */

export function WidgetView() {
  const { t } = useT();
  const { toast } = useToast();

  const [q, setQ] = useState(DEFAULT_LICENSE);
  const [applied, setApplied] = useState(DEFAULT_LICENSE);

  // ORIGIN dinamis — guard SSR: render placeholder sebelum mount.
  // Pola adjusting-state-during-render (bukan effect) agar lint bersih.
  const [origin, setOrigin] = useState("");
  if (typeof window !== "undefined" && origin === "") {
    setOrigin(window.location.origin);
  }

  const embedCode = `<script src="${origin || "https://www.muhdin.or.id"}/muhdin-badge.js" data-license="${applied}" async></script>`;

  const tryQ = () => {
    const v = q.trim();
    if (v) setApplied(v);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast({ title: t("widget.embed.toastOkTitle"), description: t("widget.embed.toastOkDesc") });
    } catch {
      toast({
        title: t("widget.embed.toastFailTitle"),
        description: t("widget.embed.toastFailDesc"),
        variant: "destructive",
      });
    }
  };

  const steps = [
    { icon: "clipboard-check", title: t("widget.steps.s1.title"), desc: t("widget.steps.s1.desc") },
    { icon: "file-check", title: t("widget.steps.s2.title"), desc: t("widget.steps.s2.desc") },
    { icon: "badge-check", title: t("widget.steps.s3.title"), desc: t("widget.steps.s3.desc") },
  ];

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <TrustHero
        eyebrow={t("widget.hero.eyebrow")}
        title={t("widget.hero.title")}
        subtitle={t("widget.hero.subtitle")}
      />

      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 sm:px-6">
        {/* MENGAPA PENTING */}
        <Reveal>
          <section aria-label={t("widget.why.title")}>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("widget.why.title")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {WHY.map((w) => (
                <div key={w.key} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                    <Icon name={w.icon} className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-extrabold leading-snug">{t(`widget.why.items.${w.key}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`widget.why.items.${w.key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* COBA LIVE */}
        <TrustSection icon="scan" title={t("widget.live.title")} desc={t("widget.live.desc")}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="widget-q" className="text-[13px] font-bold">{t("widget.live.label")}</Label>
              <div className="flex gap-2">
                <Input
                  id="widget-q"
                  dir="ltr"
                  className="font-mono"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") tryQ();
                  }}
                  placeholder={DEFAULT_LICENSE}
                />
                <Button className="shrink-0 font-bold" onClick={tryQ}>
                  <Icon name="search" className="h-4 w-4" aria-hidden />
                  {t("widget.live.try")}
                </Button>
              </div>
            </div>

            <iframe
              key={applied}
              src={`/widget-demo.html?license=${encodeURIComponent(applied)}`}
              title={t("widget.live.iframeTitle")}
              height={150}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              className="w-full rounded-xl border bg-background"
            />

            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{t("widget.live.tip")}</span>
            </p>
          </div>
        </TrustSection>

        {/* KODE EMBED */}
        <TrustSection icon="code-2" title={t("widget.embed.title")} desc={t("widget.embed.desc")}>
          <div className="space-y-4">
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-xl bg-muted p-4 font-mono text-[12px] leading-relaxed text-foreground/90 sm:text-[13px]"
            >
              <code>{embedCode}</code>
            </pre>

            <Button className="font-bold" onClick={copyCode}>
              <Icon name="clipboard-check" className="h-4 w-4" aria-hidden />
              {t("widget.embed.copy")}
            </Button>

            <div>
              <h3 className="text-sm font-extrabold">{t("widget.embed.attrTitle")}</h3>
              <div className="mt-2 overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t("widget.embed.colAttr")}</TableHead>
                      <TableHead className="text-start">{t("widget.embed.colVal")}</TableHead>
                      <TableHead className="text-start">{t("widget.embed.colDesc")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ATTRS.map((a) => (
                      <TableRow key={a.key}>
                        <TableCell>
                          <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {a.attr}
                          </code>
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-xs text-muted-foreground">
                          {t(`widget.embed.attr.${a.key}.val`)}
                        </TableCell>
                        <TableCell className="text-[13px]">{t(`widget.embed.attr.${a.key}.desc`)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TrustSection>

        {/* CARA PASANG */}
        <TrustSection icon="workflow" title={t("widget.steps.title")}>
          <TrustSteps items={steps} />
        </TrustSection>

        {/* PRIVASI & ATURAN */}
        <TrustCallout tone="gold" icon="lock" title={t("widget.rules.title")}>
          <ul className="mt-1 space-y-2">
            {RULES.map((r) => (
              <li key={r.key} className="flex items-start gap-2">
                <Icon name={r.icon} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" aria-hidden />
                <span>
                  {t(`widget.rules.items.${r.key}`)}
                  {r.key === "tamper" && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={() => navigate("etik")}
                        className="font-bold underline underline-offset-2 transition-colors hover:text-primary"
                      >
                        {t("widget.rules.etikLink")}
                      </button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </TrustCallout>

        {/* CTA */}
        <Reveal delay={0.08} className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="rounded-full font-bold" onClick={() => navigate("gabung")}>
            {t("widget.cta.gabung")}
            <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
          </Button>
          <Button size="lg" variant="outline" className="rounded-full font-bold" onClick={() => navigate("verifikasi")}>
            {t("widget.cta.verifikasi")}
            <Icon name="shield-check" className="ms-1.5 h-4 w-4" aria-hidden />
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
