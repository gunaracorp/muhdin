"use client";

import { useT, LOCALES, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Pemilih bahasa (Indonesia / English / العربية) — dipakai di Navbar & Footer. */
export function LocaleSwitcher({
  variant = "desktop",
  onDark = false,
}: {
  variant?: "desktop" | "mobile";
  /** true = trigger di atas latar gelap (navbar transparan) → teks terang */
  onDark?: boolean;
}) {
  const { locale, setLocale, t } = useT();
  const active = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  if (variant === "mobile") {
    return (
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("common.language")}>
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLocale(l.code as Locale)}
            aria-pressed={locale === l.code}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
              locale === l.code
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="text-base leading-none" aria-hidden>{l.flag}</span>
            <span className="truncate w-full text-center">{l.code === "ar" ? "العربية" : l.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          // Task 35-h addendum: id deterministik (bukan useId Radix) — imun race
          // TreeContext React 19 di dev; lihat catatan di theme-switcher.tsx.
          id="muhdin-locale-trigger"
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5",
            onDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-foreground/70 hover:text-primary"
          )}
          aria-label={t("common.ariaLanguage")}
        >
          <Icon name="globe" className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">{active.code}</span>
          <span aria-hidden className="text-sm leading-none">{active.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t("common.language")}</DropdownMenuLabel>
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code as Locale)}
            className={cn("gap-2", locale === l.code && "bg-primary/10 text-primary font-semibold")}
            aria-current={locale === l.code}
          >
            <span aria-hidden className="text-base leading-none">{l.flag}</span>
            <span className="flex-1">{l.native}</span>
            {locale === l.code && <Icon name="check-circle-2" className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
