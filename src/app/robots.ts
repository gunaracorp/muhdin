/**
 * Task 18 — robots.txt untuk mesin pencari.
 * Semua halaman publik boleh diindeks; area API ditutup.
 */
import type { MetadataRoute } from "next";

// Statis murni — kompatibel mode BUILD_STATIC (shared hosting export).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://muhdin.web.id").replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
