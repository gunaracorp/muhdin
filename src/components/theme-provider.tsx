"use client";

/**
 * ThemeProvider — dark mode global (Task 15-a) berbasis next-themes.
 * - attribute="class" → toggle class `.dark` di <html> (token warna lengkap
 *   sudah disiapkan di globals.css, termasuk varian dark utk glass/pattern).
 * - defaultTheme="system" → mengikuti preferensi OS, bisa dioverride user
 *   via ThemeSwitcher (tersimpan di localStorage oleh next-themes).
 * - <html suppressHydrationWarning> sudah diset di app/layout.tsx (wajib).
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
