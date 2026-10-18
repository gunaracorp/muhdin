"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useHashRoute, navigate, useScrollToTopOnRoute } from "@/hooks/use-hash-route";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { HomeView } from "@/components/views/home-view";
import { EcosystemView } from "@/components/views/ecosystem-view";
import { JourneyView } from "@/components/views/journey-view";
import { MembersView } from "@/components/views/members-view";
import { TutorialView } from "@/components/views/tutorial-view";
import { NewsView } from "@/components/views/news-view";
import { AboutView } from "@/components/views/about-view";
import { ContactView } from "@/components/views/contact-view";
import { JoinView } from "@/components/views/join-view";
import { NusukView } from "@/components/views/nusuk-view";
import { TrackView } from "@/components/views/track-view";
import { GalleryView } from "@/components/views/gallery-view";
import { AgendaView } from "@/components/views/agenda-view";
import { DownloadsView } from "@/components/views/downloads-view";
import { ReportView } from "@/components/views/report-view";
import { PengurusView } from "@/components/views/pengurus-view";
// Task 50 — Pusat Layanan dinamis (#/layanan/<slug>)
import { LayananView } from "@/components/views/layanan-view";
import { AdminView } from "@/components/admin/admin-view";
// Task 33 — MUHDIN NUSANTARA (Trusted Pilgrim Ecosystem)
import { DaftarView } from "@/components/views/daftar-view";
import { VerifyView } from "@/components/views/verify-view";
import { PrivacyView } from "@/components/views/privacy-view";
import { TermsView } from "@/components/views/terms-view";
// Task 48 — Super Dashboard Trio (#/dashboard): DashboardView (portal tiket lama) digantikan
import { DashboardHub } from "@/components/views/dashboard-hub";
import { JamaahDashboard } from "@/components/views/jamaah-dashboard";
import { MitraDashboard } from "@/components/views/mitra-dashboard";
// Task 51 — Dashboard PPIU & PPIHK + sinkronisasi Nusuk
import { PpiuPpihkDashboard } from "@/components/views/ppiu-pihk-dashboard";
import { LocaleProvider, useT } from "@/lib/i18n";
import { RegisterSW } from "@/components/pwa/register-sw";
import { WaFab } from "@/components/site/wa-fab";

function LoadingSplash() {
  const { t } = useT();
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{t("misc.loading")}</p>
      </div>
    </div>
  );
}

/**
 * Task 21 — Scroll Progress: garis rambut emas di puncak viewport yang
 * mengikuti posisi gulir (sentuhan konsultan kelas dunia, ala McKinsey).
 * RTL-aware (dari kanan di bahasa Arab), tersembunyi di rute admin.
 *
 * Fix hydration (Task 35-d): hooks framer-motion (useScroll/useSpring)
 * menggeser counter useId React di client saat hydration, sehingga seluruh
 * ID internal Radix SETELAHNYA (switcher tema & bahasa di Navbar) berbeda
 * dari yang dirender server → hydration mismatch (radix-_R_...).
 * Solusi: <ScrollProgressBar /> hanya disertakan di tree SETELAH mount
 * (gate `mounted` di MuhdinApp) — SSR & hydration tidak pernah mengeksekusi
 * hooks framer, counter useId server == client, ID Radix tetap sinkron.
 * Visual tidak berubah: bar memang tak terlihat di posisi gulir teratas.
 *
 * Addendum (Task 35-h, akar masalah diperbarui): investigasi lanjutan membuktikan
 * gejala radix-_R_... yang persisten/intermiten BUKAN regresi kode aplikasi —
 * SSR 100% deterministik (10/10 probe identik), fiber tree client pun identik
 * setelah hydrasi. Sumber sesungguhnya: race bookkeeping TreeContext useId
 * React 19 selama hydration pass di region puncak tree yang diisi komponen
 * DEV-ONLY Next 16 (SegmentStateProvider, SegmentViewNode, HotReload,
 * AppDevOverlayErrorBoundary, NavigationPromisesContext) — diperparah OOM
 * (next-server tewas dibunuh kernel saat RAM penuh). Tidak ada di production
 * build; dampak fungsional nihil (React mempertahankan id server; menu tetap
 * berfungsi). Remedy operator: `bun run dev:clean` (purge .next) + restart,
 * dan jaga memori bebas. Gate `mounted` dipertahankan sebagai lapisan aman.
 *
 * LAPISAN 2 — id deterministik (fix final, user-reported 3×): seluruh trigger
 * Radix yang merender atribut turunan useId saat SSR kini diberi id/aria
 * EKSPLISIT (consumer props menimpa id internal Radix yang di-spread lebih
 * awal — terverifikasi di dist @radix-ui): ThemeSwitcher (desktop+compact),
 * LocaleSwitcher, AdminBell, TabsTrigger/TabsContent (kontak & anggota).
 * Dengan atribut yang 100% sama di server & client, mismatch radix-_R_...
 * MUSTAHIL terjadi apapun kondisi race dev — tanpa efek samping fungsional.
 */
const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 inset-x-0 z-[70] h-[3px] origin-left rtl:origin-right bg-gradient-to-r from-gold via-gold-soft to-gold shadow-[0_0_12px_rgba(212,175,55,0.55)]"
    />
  );
}

function NotFound() {
  const { t } = useT();
  return (
    <div className="flex-1 grid place-items-center py-32 px-4">
      <div className="text-center space-y-4">
        <p className="text-7xl font-extrabold text-primary/20">{t("misc.notfound.code")}</p>
        <h1 className="text-2xl font-bold">{t("misc.notfound.title")}</h1>
        <p className="text-muted-foreground max-w-md">
          {t("misc.notfound.body")}
        </p>
        <button
          onClick={() => navigate("beranda")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest transition-colors"
        >
          {t("misc.notfound.cta")}
        </button>
      </div>
    </div>
  );
}

export function MuhdinApp({ initialLocale = "id" }: { initialLocale?: "id" | "en" | "ar" }) {
  const route = useHashRoute();
  const root = route[0] || "beranda";
  const isAdmin = root === "admin";
  // Task 35-d — ScrollProgress (framer-motion) memanggil useId internal saat SSR
  // sehingga seluruh ID Radix setelahnya (switcher Navbar) tidak sinkron saat
  // hydration. Gate di PARENT: elemen TIDAK disertakan di tree sampai mount
  // (replikasi persis kondisi uji yang terbukti bebas hydration mismatch).
  const mounted = useMounted();

  useScrollToTopOnRoute([root, route[1]]);

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/beranda");
    }
  }, []);

  let content: React.ReactNode;
  switch (root) {
    case "beranda":
      content = <HomeView />;
      break;
    case "ekosistem":
      // Task 30 — deep-link #/ekosistem/<nomor> membuka dialog detail langsung.
      content = <EcosystemView focusNumber={route[1]} />;
      break;
    case "alur":
      content = <JourneyView />;
      break;
    case "anggota":
      // Task 30 — deep-link #/anggota/verifikasi membuka tab Cek Verifikasi.
      // key-remount agar state tab mengikuti hash terbaru.
      content = <MembersView key={`anggota-${route[1] ?? ""}`} initialTab={route[1]} />;
      break;
    case "tutorial":
      content = <TutorialView slug={route[1]} />;
      break;
    case "berita":
      content = <NewsView slug={route[1]} />;
      break;
    case "tentang":
      content = <AboutView />;
      break;
    // Task 37 — Susunan Pengurus MUHDIN (struktur organisasi internasional)
    case "pengurus":
      content = <PengurusView />;
      break;
    // Task 50 — Pusat Layanan, Perizinan & Sertifikasi (menu baru)
    case "layanan":
      content = <LayananView slug={route[1]} />;
      break;
    case "kontak":
      content = <ContactView />;
      break;
    case "gabung":
      content = <JoinView />;
      break;
    // Task 33 — engine pendaftaran cerdas multi-step (15 peran; Task 49: individu & profesional dihapus)
    case "daftar":
      content = <DaftarView />;
      break;
    // Task 33 — halaman verifikasi publik + QR (ROLE 13)
    case "verifikasi":
      content = <VerifyView key={route[1] ?? "search"} query={route[1]} />;
      break;
    // Task 33 — portal anggota (ROLE 16) → Task 48: Super Dashboard Trio
    case "dashboard":
      content =
        route[1] === "jamaah" ? (
          <JamaahDashboard />
        ) : route[1] === "mitra" ? (
          <MitraDashboard />
        ) : route[1] === "ppiu-pihk" ? (
          // Task 51 — konsol operasional PPIU & PPIHK + sinkronisasi Nusuk
          <PpiuPpihkDashboard />
        ) : (
          <DashboardHub />
        );
      break;
    // Task 33 — privasi & ketentuan (ROLE 21)
    case "privasi":
      content = <PrivacyView />;
      break;
    case "syarat":
      content = <TermsView />;
      break;
    case "nusuk":
      content = <NusukView />;
      break;
    case "lacak":
      content = <TrackView />;
      break;
    case "galeri":
      content = <GalleryView />;
      break;
    case "agenda":
      content = <AgendaView />;
      break;
    case "unduhan":
      content = <DownloadsView />;
      break;
    case "lapor":
      content = <ReportView />;
      break;
    case "admin":
      content = <AdminView />;
      break;
    default:
      content = <NotFound />;
  }

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <RegisterSW />
      {!isAdmin && mounted && (
        <>
          <ScrollProgressBar />
          <WaFab />
        </>
      )}
      {isAdmin ? (
        <div className="min-h-screen bg-muted/40 flex flex-col">
          <AdminView />
        </div>
      ) : (
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <main className="flex-1 flex flex-col">{content}</main>
          <Footer />
        </div>
      )}
    </LocaleProvider>
  );
}

export default MuhdinApp;
