import { cookies } from "next/headers";
import type { Metadata } from "next";
import MuhdinApp from "@/components/muhdin-app";

/**
 * v10 — CATCH-ALL REAL ROUTE.
 * Semua URL nyata (/beranda, /layanan/syariah, /admin/users, ...) dirender
 * oleh satu route ini. MuhdinApp membaca pathname via usePathname sehingga
 * SSR langsung menyajikan halaman yang benar (SEO-friendly, tanpa #).
 *
 * Mode BUILD_STATIC (shared hosting export) tidak punya request scope →
 * locale awal "id"; provider i18n klien menegaskan kembali lang/dir/teks
 * dari cookie muhdin-locale begitu halaman hidup.
 */

const TITLES: Record<string, string> = {
  beranda: "Ekosistem Umrah & Haji Digital Pertama di Indonesia",
  ekosistem: "13 Layanan Bisnis Ekosistem",
  alur: "Alur Perjalanan Jamaah",
  anggota: "Direktori Anggota Terverifikasi",
  tutorial: "Pusat Tutorial",
  berita: "Berita & Artikel",
  tentang: "Tentang MUHDIN",
  pengurus: "Susunan Pengurus",
  layanan: "Pusat Layanan, Perizinan & Sertifikasi",
  kontak: "Kontak",
  gabung: "Gabung Ekosistem",
  daftar: "Pendaftaran Anggota",
  verifikasi: "Cek Verifikasi",
  dashboard: "Portal Anggota",
  privasi: "Kebijakan Privasi",
  syarat: "Syarat & Ketentuan",
  nusuk: "Integrasi Nusuk",
  lacak: "Lacak Jamaah",
  galeri: "Galeri Kegiatan",
  agenda: "Agenda Kegiatan",
  dpd: "Jaringan Daerah (DPD)",
  faq: "Pusat Bantuan",
  "peta-situs": "Peta Situs",
  "whatsapp-ai": "WhatsApp AI Concierge",
  paspor: "Paspor Haji Digital",
  "verifikasi-paspor": "Verifikasi Paspor Haji",
  tracking: "Pelacakan GPS Rombongan",
  "tur-virtual": "Tur Virtual 360°",
  unduhan: "Pusat Unduhan",
  lapor: "Laporkan Penipuan",
  regulasi: "Regulasi",
  transparansi: "Transparansi",
  etik: "Dewan Etik",
  pdp: "Perlindungan Data Pribadi",
  darurat: "Jalur Darurat",
  sehat: "Kesehatan Jamaah",
  kalkulator: "Kalkulator Biaya",
  widget: "Widget Portal",
  "kartu-anggota": "KTA Digital — Kartu Tanda Anggota",
  academy: "Manasik Academy",
  booking: "Booking Layanan",
  benefit: "Benefit Mitra Anggota",
  "verifikasi-kta": "Verifikasi KTA Digital",
  "verifikasi-sertifikat": "Verifikasi Sertifikat Digital",
  admin: "Admin CMS",
};

/** Halaman privat — tidak untuk mesin pencari. */
const NO_INDEX = new Set(["admin", "dashboard"]);

function pretty(value: string): string {
  return value
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  const root = slug[0] ?? "beranda";
  const known = TITLES[root];
  const sub = slug[1] ? ` — ${pretty(slug[1])}` : "";
  const title = known ? `${known}${sub}` : pretty(root);
  return {
    title,
    robots: NO_INDEX.has(root) ? { index: false, follow: false } : undefined,
  };
}

async function readInitialLocale(): Promise<"id" | "en" | "ar"> {
  if (process.env.BUILD_STATIC === "1") return "id";
  try {
    const store = await cookies();
    const raw = store.get("muhdin-locale")?.value;
    return raw === "en" || raw === "ar" ? raw : "id";
  } catch {
    return "id";
  }
}

export default async function Page() {
  // Locale tersimpan di cookie agar SSR (html lang/dir + teks) langsung
  // konsisten dengan client — bebas hydration mismatch.
  const initialLocale = await readInitialLocale();
  return <MuhdinApp initialLocale={initialLocale} />;
}
