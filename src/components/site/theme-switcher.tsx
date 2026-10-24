"use client";

/**
 * ThemeSwitcher — pengganti tema Terang / Gelap / Sistem (Task 15-a).
 * Varian:
 *  - desktop  : dropdown ikon + label (Navbar)
 *  - mobile   : grid 3 tombol besar (menu mobile Navbar)
 *  - compact  : ikon-only (header CMS admin)
 *
 * next-themes mengembalikan resolvedTheme setelah mount — sebelum mount kita
 * render ikon netral (moon-star) agar bebas hydration mismatch.
 *
 * Fix hydration lapis 2 (Task 35-h addendum): Radix DropdownMenuTrigger
 * merender atribut `id` dari React useId — di dev Next 16, race bookkeeping
 * TreeContext dapat menggeser useId antara server (Fizz) dan hydration pass.
 * Solusi bulletproof: id EKSPILIT deterministik pada trigger (radix men-spread
 * consumer props SETELAH id internal, jadi id kita selalu menang) — atribut
 * server == client di semua kondisi, mismatch mustahil terjadi.
 */
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useT } from "@/lib/i18n";
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

const THEME_OPTIONS = [
  { value: "light", icon: "sun", key: "common.themeLight" },
  { value: "dark", icon: "moon", key: "common.themeDark" },
  { value: "system", icon: "monitor", key: "common.themeSystem" },
] as const;

export function ThemeSwitcher({
  variant = "desktop",
  onDark = false,
}: {
  variant?: "desktop" | "mobile" | "compact";
  /** true = trigger di atas latar gelap (navbar transparan) → teks terang */
  onDark?: boolean;
}) {
  const { t } = useT();
  const { theme, setTheme, resolvedTheme } = useTheme();
  // Deteksi hydration tanpa setState di effect (react-hooks/set-state-in-effect):
  // server snapshot false, client snapshot true setelah hydrasi selesai.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const resolvedIcon = !mounted ? "moon-star" : resolvedTheme === "dark" ? "moon" : "sun";
  const active = mounted ? theme : undefined;

  /* ---------- Mobile: grid 3 tombol ---------- */
  if (variant === "mobile") {
    return (
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("common.theme")}>
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            aria-pressed={active === opt.value}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
              active === opt.value
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon name={opt.icon} className="h-4 w-4" aria-hidden />
            <span className="truncate w-full text-center">{t(opt.key)}</span>
          </button>
        ))}
      </div>
    );
  }

  /* ---------- Compact: ikon-only (CMS admin) ---------- */
  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id="muhdin-theme-trigger-compact"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground/70 hover:text-primary"
            aria-label={t("common.ariaTheme")}
          >
            <Icon name={resolvedIcon} className="h-[1.05rem] w-[1.05rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuLabel className="text-xs text-muted-foreground">{t("common.theme")}</DropdownMenuLabel>
          {THEME_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn("gap-2", active === opt.value && "bg-primary/10 text-primary font-semibold")}
              aria-current={active === opt.value}
            >
              <Icon name={opt.icon} className="h-4 w-4" />
              <span className="flex-1">{t(opt.key)}</span>
              {active === opt.value && <Icon name="check-circle-2" className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /* ---------- Desktop: dropdown default (Navbar) ---------- */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="muhdin-theme-trigger"
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9",
            onDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-foreground/70 hover:text-primary"
          )}
          aria-label={t("common.ariaTheme")}
        >
          <Icon name={resolvedIcon} className="h-[1.05rem] w-[1.05rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t("common.theme")}</DropdownMenuLabel>
        {THEME_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn("gap-2", active === opt.value && "bg-primary/10 text-primary font-semibold")}
            aria-current={active === opt.value}
          >
            <Icon name={opt.icon} className="h-4 w-4" />
            <span className="flex-1">{t(opt.key)}</span>
            {active === opt.value && <Icon name="check-circle-2" className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
