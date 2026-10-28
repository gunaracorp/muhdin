import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Amiri, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const kufi = Noto_Kufi_Arabic({
  variable: "--font-kufi",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MUHDIN INDONESIA — Trusted Pilgrim Ecosystem",
    template: "%s | MUHDIN INDONESIA",
  },
  description:
    "MUHDIN INDONESIA (Masyarakat Umroh Haji Digital Indonesia) — Trusted Pilgrim Ecosystem. ASOSIASI HAJI UMROH DIGITAL PERTAMA DI INDONESIA — keanggotaan 100% GRATIS, tanpa tarif biaya kepada anggota. Verifikasi, direktori penyelenggara & penyedia, akademi.",
  keywords: [
    "MUHDIN",
    "MUHDIN Indonesia",
    "Trusted Pilgrim Ecosystem",
    "umroh",
    "haji",
    "Nusuk",
    "PPIU",
    "PIHK",
    "KBIHU",
    "IPHI",
    "travel umroh terpercaya",
    "ekosistem umroh digital",
    "ekosistem umroh haji digital termurah bergaransi",
    "umroh murah bergaransi",
    "paket umroh haji digital",
    "asosiasi umroh iuran termurah",
    "asosiasi haji umroh digital pertama gratis",
    "verifikasi penyelenggara umroh",
    "muhdin verified",
    "transformasi digital umroh",
  ],
  authors: [{ name: "MUHDIN" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "MUHDIN",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "MUHDIN INDONESIA — Trusted Pilgrim Ecosystem",
    description:
      "EKOSISTEM UMROH HAJI DIGITAL — asosiasi digital pertama di Indonesia; keanggotaan 100% gratis tanpa tarif biaya kepada anggota. One Ecosystem. One Data. One Standard. One Trust. One Journey.",
    siteName: "MUHDIN INDONESIA",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "MUHDIN INDONESIA — Trusted Pilgrim Ecosystem",
    description:
      "Satu Ekosistem. Satu Data. Satu Standar. Satu Trust.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b5c3f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Locale dari cookie (diset oleh LocaleSwitcher) → html lang/dir SSR konsisten.
  // Mode BUILD_STATIC (export shared hosting) tidak punya request scope →
  // default "id"; provider i18n klien menegaskan kembali lang/dir dari cookie.
  let locale: "id" | "en" | "ar" = "id";
  if (process.env.BUILD_STATIC !== "1") {
    const store = await cookies();
    const raw = store.get("muhdin-locale")?.value;
    if (raw === "en" || raw === "ar") locale = raw;
  }

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} ${amiri.variable} ${kufi.variable} antialiased bg-background text-foreground`}
      >
        {/* v10 — Migrasi tautan lama #/x/y → /x/y SEBELUM hidrasi, sehingga
            router Next.js membaca URL nyata sejak awal (tanpa reload). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var h=location.hash;if(h&&h.indexOf('#/')===0){history.replaceState(null,'',h.slice(1));}}catch(e){}",
          }}
        />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
