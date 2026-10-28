"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { MuhdinBrand, MuhdinLogo } from "@/components/site/logo";
import { Icon } from "@/components/site/icon";
import { ThemeSwitcher } from "@/components/site/theme-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import {
  AdminArticles, AdminEcosystems, AdminJourney, AdminRoadmap, AdminMembers,
  AdminTutorials, AdminFaqs, AdminTestimonials, AdminManagement,
  AdminMessages, AdminApplications, AdminNusuk, AdminSettings, AdminTranslator,
} from "@/components/admin/admin-sections";
import { AdminUsers } from "@/components/admin/admin-users";
// v11 — Keanggotaan Power Pack (Academy, Booking, Benefits)
import { AdminAcademy, AdminBooking, AdminBenefits } from "@/components/admin/admin-membership";
import { AdminWhatsAppCard } from "@/components/admin/admin-whatsapp";
import { AdminEmailCard, AdminNotificationLog, AdminNotificationSetupChecklist } from "@/components/admin/admin-notifications";
import { AdminBell } from "@/components/admin/admin-bell";
import { AdminGallery } from "@/components/admin/admin-gallery";
import { AdminAgenda } from "@/components/admin/admin-agenda";
import { AdminResources } from "@/components/admin/admin-resources";
import { AdminComplaints } from "@/components/admin/admin-complaints";
import { AdminSubscribers } from "@/components/admin/admin-subscribers";
import { AdminAudit } from "@/components/admin/admin-audit";
import { AdminBranches } from "@/components/admin/admin-branches";
// v5 Fase 3 — Paspor Haji Digital (QR) + Perangkat GPS rombongan
import { AdminPassport } from "@/components/admin/admin-passport";
// v5 Fase 4 — Tur Virtual 360° (kelola scene panorama)
import { AdminTour } from "@/components/admin/admin-tour";
// v4.0 — AI Content Studio: redaksi berbantuan AI (topik → draf artikel).
import { AdminAiStudio } from "@/components/admin/admin-ai-studio";
import { visibleSections, ROLE_LABELS } from "@/lib/roles";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const MENU = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", group: "Ikhtisar" },
  { id: "ai-studio", label: "AI Content Studio", icon: "sparkles", group: "Layanan Digital" },
  { id: "nusuk", label: "Integrasi Nusuk", icon: "satellite", group: "Layanan Digital" },
  { id: "articles", label: "Berita & Artikel", icon: "newspaper", group: "Konten & Media" },
  { id: "ecosystems", label: "13 Ekosistem", icon: "boxes", group: "Ekosistem & Anggota" },
  { id: "journey", label: "Alur Perjalanan", icon: "workflow", group: "Konten & Media" },
  { id: "roadmap", label: "Roadmap 2026-2030", icon: "target", group: "Konten & Media" },
  { id: "members", label: "Direktori Anggota", icon: "grid-3x3", group: "Ekosistem & Anggota" },
  { id: "applications", label: "Pendaftaran", icon: "user-plus", group: "Ekosistem & Anggota" },
  { id: "tutorials", label: "Tutorial", icon: "graduation-cap", group: "Konten & Media" },
  { id: "messages", label: "Pesan Masuk", icon: "inbox", group: "Komunikasi" },
  { id: "complaints", label: "Pengaduan", icon: "shield-alert", group: "Komunikasi" },
  { id: "subscribers", label: "Pelanggan Berita", icon: "mail", group: "Komunikasi" },
  { id: "faqs", label: "FAQ", icon: "help-circle", group: "Konten & Media" },
  { id: "testimonials", label: "Testimoni", icon: "quote", group: "Konten & Media" },
  { id: "management", label: "Struktur Organisasi", icon: "users", group: "Ekosistem & Anggota" },
  { id: "branches", label: "Jaringan Daerah (DPD)", icon: "landmark", group: "Ekosistem & Anggota" },
  { id: "passport", label: "Paspor & GPS", icon: "wallet-cards", group: "Layanan Digital" },
  // v11 — Keanggotaan Power Pack
  { id: "academy", label: "Akademi & Sertifikat", icon: "graduation-cap", group: "Layanan Digital" },
  { id: "booking", label: "Booking & Slot", icon: "calendar-check", group: "Layanan Digital" },
  { id: "benefits", label: "Benefit & Poin KTA", icon: "gift", group: "Ekosistem & Anggota" },
  { id: "tour", label: "Tur Virtual 360°", icon: "orbit", group: "Layanan Digital" },
  { id: "settings", label: "Pengaturan Situs", icon: "settings", group: "Sistem" },
  { id: "translator", label: "Penerjemah Cerdas", icon: "languages", group: "Layanan Digital" },
  { id: "gallery", label: "Galeri Kegiatan", icon: "instagram", group: "Konten & Media" },
  { id: "agenda", label: "Agenda Kegiatan", icon: "calendar", group: "Konten & Media" },
  { id: "resources", label: "Pusat Unduhan", icon: "download", group: "Konten & Media" },
  { id: "audit", label: "Log Aktivitas", icon: "activity", group: "Sistem" },
  { id: "users", label: "Kelola Admin", icon: "user-cog", group: "Sistem" },
];

/** v10 — urutan kelompok menu sidebar (26 modul, 6 kelompok). */
const GROUP_ORDER = [
  "Ikhtisar",
  "Konten & Media",
  "Ekosistem & Anggota",
  "Layanan Digital",
  "Komunikasi",
  "Sistem",
] as const;

export function AdminView({ initialSection }: { initialSection?: string }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [section, setSectionState] = useState(() => initialSection ?? "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");

  // v10 — ganti seksi + sinkron URL (deep-linkable, tombol back berfungsi).
  const setSection = useCallback((s: string) => {
    setSectionState(s);
    navigate(s === "dashboard" ? "admin" : `admin/${s}`);
  }, []);

  const check = useCallback(() => {
    apiGet<{ user: User | null }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const logout = async () => {
    try {
      await apiSend("/api/auth/logout", "POST");
      setUser(null);
      toast({ title: "Berhasil keluar", description: "Sampai jumpa kembali!" });
    } catch {
      toast({ title: "Gagal keluar", variant: "destructive" });
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginForm onSuccess={check} />;

  const current = MENU.find((m) => m.id === section);
  // Task 15-c — gating menu sesuai peran (SUPER_ADMIN / ADMIN / EDITOR).
  const allowed = visibleSections(user.role);
  const menu = MENU.filter((m) => allowed.has(m.id));
  const activeSection = allowed.has(section) ? section : "dashboard";

  // v10 — filter modul sidebar + pengelompokan.
  const q = menuQuery.trim().toLowerCase();
  const menuFiltered = q ? menu.filter((m) => m.label.toLowerCase().includes(q)) : menu;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b">
        <MuhdinBrand compact />
        <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-semibold">
          CMS Admin Panel · v10
        </p>
      </div>
      <div className="px-3 pt-3">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={menuQuery}
            onChange={(e) => setMenuQuery(e.target.value)}
            placeholder="Cari modul (26)..."
            className="h-9 pl-8 pr-3 text-xs rounded-lg bg-background/60"
            aria-label="Cari modul admin"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-0.5" aria-label="Menu admin">
        {GROUP_ORDER.map((g) => {
          const items = menuFiltered.filter((m) => m.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="mb-1.5">
              {!q && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground/80">
                  {g}
                </p>
              )}
              {items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSection(m.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeSection === m.id
                      ? "bg-gradient-to-r from-primary to-forest text-white shadow-md"
                      : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Icon name={m.icon} className="h-4 w-4 shrink-0" />
                  {m.label}
                </button>
              ))}
            </div>
          );
        })}
        {menuFiltered.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            Tidak ada modul yang cocok.
          </p>
        )}
      </nav>
      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-forest grid place-items-center text-white font-bold text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={logout}>
          <Icon name="logout" className="h-4 w-4 mr-2" /> Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 shrink-0 border-r bg-sidebar sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu Admin</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 glass border-b">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Buka menu admin">
              <Icon name="menu" className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden md:inline text-xs font-semibold text-muted-foreground">Admin</span>
              <span className="hidden md:inline text-muted-foreground/40" aria-hidden>/</span>
              <Icon name={current?.icon || "layout-dashboard"} className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-extrabold text-lg truncate">{current?.label || "Dashboard"}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <AdminBell onSection={setSection} />
              <ThemeSwitcher variant="compact" />
              <Button variant="ghost" size="sm" onClick={() => navigate("beranda")} className="hidden sm:inline-flex text-primary">
                <Icon name="external-link" className="h-4 w-4 mr-1.5" />
                Lihat Situs
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {section === "dashboard" && <AdminDashboard onNavigate={setSection} />}
          {section === "nusuk" && <AdminNusuk />}
          {section === "articles" && <AdminArticles />}
          {section === "ecosystems" && <AdminEcosystems />}
          {section === "journey" && <AdminJourney />}
          {section === "roadmap" && <AdminRoadmap />}
          {section === "members" && <AdminMembers />}
          {section === "applications" && <AdminApplications />}
          {section === "tutorials" && <AdminTutorials />}
          {section === "messages" && <AdminMessages />}
          {section === "complaints" && <AdminComplaints />}
          {section === "subscribers" && <AdminSubscribers />}
          {section === "faqs" && <AdminFaqs />}
          {section === "testimonials" && <AdminTestimonials />}
          {section === "management" && <AdminManagement />}
          {section === "branches" && <AdminBranches />}
          {section === "passport" && <AdminPassport />}
          {/* v11 — Keanggotaan Power Pack */}
          {section === "academy" && <AdminAcademy />}
          {section === "booking" && <AdminBooking />}
          {section === "benefits" && <AdminBenefits />}
          {section === "tour" && <AdminTour />}
          {section === "settings" && (
            <>
              <AdminSettings />
              <AdminNotificationSetupChecklist />
              <AdminEmailCard />
              <AdminWhatsAppCard />
              <AdminNotificationLog />
            </>
          )}
          {section === "translator" && <AdminTranslator />}
          {section === "ai-studio" && <AdminAiStudio />}
          {section === "gallery" && <AdminGallery />}
          {section === "agenda" && <AdminAgenda />}
          {section === "resources" && <AdminResources />}
          {section === "audit" && <AdminAudit />}
          {section === "users" && <AdminUsers meId={user.id} />}
        </main>

        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground pb-[max(1rem,env(safe-area-inset-bottom))]">
          MUHDIN CMS v10.0 — Real-Route Edition · Bersama Melayani Tamu Allah
        </footer>
      </div>
    </div>
  );
}

/* ================= LOGIN ================= */
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiSend<{ user: User }>("/api/auth/login", "POST", { email, password });
      toast({ title: `Selamat datang, ${res.user.name}!`, description: "Anda berhasil masuk ke CMS MUHDIN." });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex flex-col justify-between bg-forest-deep text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative">
          <MuhdinBrand light />
        </div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Portal Admin<br />
            <span className="text-gold-gradient">MUHDIN</span>
          </h2>
          <p className="mt-4 text-emerald-50/80 max-w-md">
            Kelola konten, anggota, tutorial, dan komunikasi ekosistem — semuanya dari
            satu dasbor terpadu.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: "newspaper", label: "Konten" },
              { icon: "users", label: "Keanggotaan" },
              { icon: "graduation-cap", label: "Tutorial" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <Icon name={f.icon} className="h-5 w-5 mx-auto text-gold" />
                <p className="mt-2 text-xs font-semibold">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-emerald-100/70">© {new Date().getFullYear()} MUHDIN — Bersama Melayani Tamu Allah</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <MuhdinLogo className="h-16 w-16" />
          </div>
          <h1 className="text-2xl font-extrabold">Masuk ke CMS</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gunakan kredensial administrator MUHDIN.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@muhdin.web.id"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Icon name="keyround" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
                <Icon name="alert-triangle" className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-forest text-white shadow-lg"
            >
              {loading ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="login" className="h-4 w-4 mr-2" />}
              Masuk ke Dashboard
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-gold/10 border border-gold/25 p-4 text-xs text-foreground/75">
            <p className="font-bold text-gold-deep flex items-center gap-1.5">
              <Icon name="info" className="h-3.5 w-3.5" />
              Kredensial Demo
            </p>
            <p className="mt-1.5 font-mono">
              Super Admin: <b>admin@muhdin.web.id</b> · <b>muhdin2026</b>
            </p>
            <p className="mt-1 font-mono">
              Verifikator: <b>verifikator@muhdin.web.id</b> · <b>verifikator2026</b>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Segera ganti password setelah implementasi produksi.
            </p>
          </div>

          <button
            onClick={() => navigate("beranda")}
            className="mt-6 text-sm text-primary font-medium hover:underline"
          >
            ← Kembali ke situs utama
          </button>
        </div>
      </div>
    </div>
  );
}
