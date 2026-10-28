"use client";

/**
 * v10 — REAL-PATH ROUTING (pengganti hash routing).
 *
 * Dulu: URL seperti #/layanan/syariah (hash routing era SPA).
 * Kini: URL nyata /layanan/syariah — profesional & SEO-friendly.
 *
 * API publik TIDAK berubah (useHashRoute, navigate, useScrollToTopOnRoute)
 * sehingga seluruh view tidak perlu disentuh.
 *
 * Lapisan migrasi tautan lama berformat #/x/y:
 *  1. Skrip inline sebelum hidrasi di layout.tsx (replaceState tanpa reload).
 *  2. migrateLegacyHash() + reload bersih di MuhdinApp (jaring pengaman).
 *  3. Listener hashchange di bawah menangkap produser hash yang tercecer.
 */

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type RouterPush = { push: (url: string) => void };
let routerRef: RouterPush | null = null;

/** Dipanggil sekali dari MuhdinApp agar navigate() memakai router Next.js. */
export function registerAppRouter(r: RouterPush | null) {
  routerRef = r;
}

/** Hash legacy "#/x/y" → path nyata "/x/y". true bila ada yang dimigrasi. */
export function migrateLegacyHash(): string | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash;
  if (!h || !h.startsWith("#/")) return null;
  const target = h.slice(1); // "#/admin/users" → "/admin/users"
  try {
    window.history.replaceState(null, "", target);
  } catch {
    /* noop */
  }
  return target;
}

function segmentsFromPath(pathname: string | null): string[] {
  return (pathname ?? "").split("/").filter(Boolean);
}

/**
 * Hook pengganti location.hash — kini membaca pathname nyata.
 * SSr-aman: usePathname() konsisten antara server & hidrasi (tanpa mismatch).
 */
export function useHashRoute(): string[] {
  const pathname = usePathname();
  const [migrated, setMigrated] = useState<string[]>([]);

  // Navigasi asal hash legacy yang masih tercecer (mis. anchor lama di embed).
  useEffect(() => {
    const onHashChange = () => {
      const target = migrateLegacyHash();
      if (target) {
        routerRef?.push(target);
        return;
      }
      setMigrated(window.location.pathname.split("/").filter(Boolean));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const segments = useMemo(() => {
    const fromPath = segmentsFromPath(pathname);
    if (fromPath.length) return fromPath;
    return migrated;
  }, [pathname, migrated]);

  return segments;
}

/**
 * Navigasi SPA ke path nyata. Menerima format lama maupun baru:
 * navigate("layanan/syariah"), navigate("/layanan/syariah"), navigate("#/admin").
 */
export function navigate(path: string) {
  const clean = path.replace(/^#?\/?/, "").replace(/\/+$/, "");
  const url = clean ? `/${clean}` : "/";
  if (routerRef) {
    routerRef.push(url);
  } else if (typeof window !== "undefined") {
    window.location.assign(url);
  }
}

export function useScrollToTopOnRoute(deps: unknown[]) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, deps);
}
