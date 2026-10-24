"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { JourneyStep } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function JourneyView() {
  const { t, locale } = useT();
  const [steps, setSteps] = useState<JourneyStep[] | null>(null);
  const [active, setActive] = useState(1);

  useEffect(() => {
    apiGet<JourneyStep[]>(`/api/journey?locale=${locale}`)
      .then(setSteps)
      .catch(() => setSteps([]));
  }, [locale]);

  return (
    <div className="flex flex-col">
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("journey.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("journey.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">
              {t("journey.subtitleBefore")}
              <span className="text-gold font-semibold">{t("journey.handover")}</span>
              {t("journey.subtitleAfter")}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {!steps ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* connector line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-gold/50 to-primary/30 hidden sm:block" />
              <div className="space-y-4">
                {steps.map((s, i) => (
                  <Reveal key={s.id} delay={Math.min(i * 0.05, 0.5)}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setActive(active === s.step ? 0 : s.step)}
                      onKeyDown={(e) => e.key === "Enter" && setActive(active === s.step ? 0 : s.step)}
                      className={cn(
                        "relative sm:ml-16 rounded-2xl border bg-card p-5 shadow-sm cursor-pointer transition-all duration-300",
                        active === s.step
                          ? "border-primary shadow-lg ring-1 ring-primary/30"
                          : "hover:border-primary/40 hover:shadow-md"
                      )}
                    >
                      {/* number bubble */}
                      <span
                        className={cn(
                          "absolute -left-[52px] top-5 hidden sm:grid h-11 w-11 place-items-center rounded-full font-extrabold text-sm shadow-md transition-all",
                          active === s.step
                            ? "bg-gold text-forest-deep scale-110"
                            : "bg-primary text-white"
                        )}
                      >
                        {s.step}
                      </span>
                      <span className="sm:hidden inline-grid h-9 w-9 place-items-center rounded-full bg-primary text-white font-extrabold text-sm mb-3">
                        {s.step}
                      </span>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Icon name={s.icon} className="h-5 w-5 text-primary" />
                          <h3 className="font-bold">
                            {s.step}. {s.title}
                          </h3>
                        </div>
                        <Icon
                          name="chevron-down"
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            active === s.step && "rotate-180"
                          )}
                        />
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{s.activity}</p>

                      {active === s.step && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 border-t pt-4">
                          <div className="rounded-xl bg-primary/5 p-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{t("journey.actorLabel")}</p>
                            <p className="mt-1 text-sm font-medium">{s.actor}</p>
                          </div>
                          <div className="rounded-xl bg-gold/10 p-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gold-deep">{t("journey.outputLabel")}</p>
                            <p className="mt-1 text-sm font-medium">{s.output}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          <Reveal className="mt-12">
            <SectionHeading
              title={t("journey.ownershipTitle")}
              subtitle={t("journey.ownershipSubtitle")}
            />
            <div className="mt-6 text-center">
              <Button onClick={() => navigate("gabung")} size="lg" className="bg-gradient-to-r from-primary to-forest text-white">
                <Icon name="handshake" className="h-5 w-5 me-2" />
                {t("journey.cta")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
