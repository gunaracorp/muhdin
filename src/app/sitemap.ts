/**
 * v10 — sitemap.xml dengan URL nyata (tanpa hash).
 * Seluruh halaman publik portal kini memiliki URL terindeks masing-masing.
 */
import type { MetadataRoute } from "next";

// Statis murni — kompatibel mode BUILD_STATIC (shared hosting export).
export const dynamic = "force-static";

/** Rute publik utama (root pertama) + prioritas. */
const ROUTES: Array<[string, number]> = [
  ["beranda", 1.0],
  ["ekosistem", 0.9],
  ["anggota", 0.9],
  ["berita", 0.8],
  ["layanan/syariah", 0.8],
  ["layanan/ppiu", 0.8],
  ["layanan/pihk", 0.8],
  ["layanan/visa-umroh", 0.7],
  ["layanan/visa-haji", 0.7],
  ["layanan/bus", 0.7],
  ["layanan/kereta-cepat", 0.7],
  ["layanan/vaksin-meningitis", 0.7],
  ["layanan/tl", 0.7],
  ["layanan/tg", 0.7],
  ["layanan/muthowif", 0.7],
  ["pengurus/bakornas", 0.7],
  ["dpd", 0.7],
  ["regulasi", 0.8],
  ["transparansi", 0.8],
  ["etik", 0.7],
  ["pdp", 0.6],
  ["darurat", 0.6],
  ["verifikasi", 0.8],
  // v11 — Keanggotaan Power Pack
  ["kartu-anggota", 0.8],
  ["academy", 0.8],
  ["benefit", 0.7],
  ["booking", 0.7],
  ["verifikasi-kta", 0.6],
  ["verifikasi-sertifikat", 0.6],
  ["daftar", 0.9],
  ["gabung", 0.7],
  ["galeri", 0.6],
  ["agenda", 0.6],
  ["tutorial", 0.7],
  ["faq", 0.6],
  ["kontak", 0.6],
  ["tentang", 0.6],
  ["alur", 0.6],
  ["nusuk", 0.5],
  ["paspor", 0.6],
  ["tracking", 0.5],
  ["tur-virtual", 0.5],
  ["kalkulator", 0.5],
  ["sehat", 0.5],
  ["unduhan", 0.5],
  ["lapor", 0.6],
  ["whatsapp-ai", 0.4],
  ["widget", 0.3],
  ["privasi", 0.3],
  ["syarat", 0.3],
  ["peta-situs", 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://muhdin.web.id").replace(/\/+$/, "");
  const now = new Date();
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...ROUTES.map(([route, priority]) => ({
      url: `${base}/${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
    })),
  ];
}
