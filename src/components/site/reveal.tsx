"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { formatNumberL10n, type Locale } from "@/lib/i18n";

/* Task 21 — kurva easing premium (dipakai ulang di seluruh toolkit gerak) */
const EASE_PREMIUM: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: EASE_PREMIUM }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Task 21 — Stagger: orkestrasi cascade premium ala konsultan kelas dunia.
 * Bungkus grid/flex dgn <Stagger>, lalu tiap anak kartu jadi <StaggerItem> —
 * seluruh baris muncul berurutan mulus saat masuk viewport (once).
 */
export function Stagger({
  children,
  className,
  delayChildren = 0,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  delayChildren?: number;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 26,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: EASE_PREMIUM },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Task 21 — CountUp: angka berhitung naik sinematik saat masuk viewport.
 * Aman SSR (render awal = 0 di server & klien → tak ada hydration mismatch),
 * hormati prefers-reduced-motion, dan format angka mengikuti locale
 * (1.000.000 / 1,000,000 / ١٠٠٠٠٠٠) via formatNumberL10n.
 */
export function CountUp({
  value,
  suffix = "",
  locale = "id",
  duration = 1.8,
  className,
}: {
  value: number;
  suffix?: string;
  locale?: Locale;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion: lompat langsung ke nilai akhir (via rAF agar tidak
      // memicu cascading render sinkron).
      raf = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3); // cubic out
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {formatNumberL10n(display, locale)}
      {suffix}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  light = false,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
  align?: "center" | "left";
}) {
  return (
    <Reveal className={align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-2xl"}>
      {eyebrow && (
        <span
          className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${
            light ? "text-gold" : "text-primary"
          }`}
        >
          <span className="h-px w-6 bg-current opacity-60" />
          {eyebrow}
          <span className="h-px w-6 bg-current opacity-60" />
        </span>
      )}
      <h2
        className={`mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight ${
          light ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base leading-relaxed ${light ? "text-emerald-100/80" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
