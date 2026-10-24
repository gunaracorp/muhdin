"use client";

/**
 * FaqView (v4.1) — HALAMAN SENDIRI Pusat Bantuan / FAQ.
 * Route: #/faq
 *
 * Semua pertanyaan terjawab dari /api/faqs dalam satu halaman: pencarian
 * real-time, filter kategori, accordion jawaban, dan CTA "ajukan
 * pertanyaan" (kontak + WhatsApp resmi).
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Faq } from "@/lib/types";
import { DetailHero, DetailSectionHead, WaCtaButton } from "@/components/views/detail-shell";
import { navigate } from "@/hooks/use-hash-route";

export function FaqView() {
  const { t } = useT();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("ALL");

  useEffect(() => {
    apiGet<Faq[]>("/api/faqs")
      .then(setFaqs)
      .catch(() => setFaqs([]));
  }, []);

  const categories = useMemo(() => {
    const set = new Set((faqs ?? []).map((f) => f.category).filter(Boolean));
    return Array.from(set);
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (faqs ?? []).filter((f) => {
      const okCat = cat === "ALL" || f.category === cat;
      const okQ =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [faqs, query, cat]);

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("detail.faq.eyebrow")}
        title={t("detail.faq.title")}
        subtitle={t("detail.faq.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      />

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Pencarian */}
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute start-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("detail.faq.searchPlaceholder")}
              aria-label={t("detail.faq.searchAria")}
              className="h-12 rounded-2xl border-border ps-11 text-sm shadow-sm focus-visible:ring-gold/40"
            />
          </div>

          {/* Filter kategori */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("detail.faq.allCat")}>
            <button
              type="button"
              onClick={() => setCat("ALL")}
              aria-pressed={cat === "ALL"}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                cat === "ALL" ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
              )}
            >
              {t("detail.faq.allCat")}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  cat === c ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Daftar FAQ */}
          <div className="mt-8">
            <DetailSectionHead icon="help-circle" title={`${t("detail.faq.title")} (${filtered.length})`} />
            {!faqs ? (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border bg-muted/30 p-10 text-center">
                <Icon name="search" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">{t("detail.faq.empty")}</p>
              </div>
            ) : (
              <Reveal>
                <Accordion type="single" collapsible className="space-y-3">
                  {filtered.map((f, i) => (
                    <AccordionItem
                      key={f.id}
                      value={f.id}
                      className="rounded-2xl border bg-card px-5 shadow-sm last:border-b"
                    >
                      <AccordionTrigger className="py-4 text-start text-sm font-bold hover:no-underline hover:text-primary">
                        <span className="flex items-start gap-3">
                          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-black text-primary" aria-hidden>
                            {i + 1}
                          </span>
                          {f.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 ps-9 text-sm leading-relaxed text-muted-foreground">
                        {f.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            )}
          </div>

          {/* Masih bingung? */}
          <div className="mt-12 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6 sm:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold">
                  <Icon name="message-circle" className="h-5 w-5 text-primary" aria-hidden />
                  {t("detail.faq.stillHelp")}
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("detail.faq.stillBody")}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/kontak")}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10"
                >
                  <Icon name="mail" className="h-4 w-4" aria-hidden />
                  {t("detail.faq.askCta")}
                </button>
                <WaCtaButton message="Assalamu'alaikum, saya membaca halaman FAQ MUHDIN dan masih ada pertanyaan yang ingin saya ajukan." />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
