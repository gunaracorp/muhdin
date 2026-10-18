"use client";

/**
 * AdminWhatsAppCard (Task 15-d) — konfigurasi gateway notifikasi WhatsApp.
 * Token tidak pernah dikirim balik ke klien (hanya mask) — mengisi ulang
 * field kosong berarti tetap memakai token tersimpan.
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { WhatsAppConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  {
    value: "FONNTE",
    label: "Fonnte",
    help: "Daftar di fonnte.com, hubungkan device WhatsApp, salin token dari dashboard.",
  },
  {
    value: "WABLAS",
    label: "Wablas",
    help: "Buat device di console.wablas.com lalu salin token API dari menu Device.",
  },
  {
    value: "CUSTOM",
    label: "Gateway Mandiri",
    help: "Endpoint POST JSON { token, target, message } milik server Anda sendiri.",
  },
];

export function AdminWhatsAppCard() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<WhatsAppConfig | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = useCallback(() => {
    apiGet<WhatsAppConfig>("/api/whatsapp")
      .then((d) => setCfg(d))
      .catch((e) => {
        toast({ title: "Gagal memuat konfigurasi", description: (e as Error).message, variant: "destructive" });
        setCfg(null);
      });
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!cfg)
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    );

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        provider: cfg.provider,
        apiUrl: cfg.apiUrl,
        target: cfg.target,
        enabled: cfg.enabled,
        notifyContact: cfg.notifyContact,
        notifyApplication: cfg.notifyApplication,
      };
      if (tokenInput.trim()) payload.token = tokenInput.trim();
      const updated = await apiSend<WhatsAppConfig>("/api/whatsapp", "PUT", payload);
      setCfg(updated);
      setTokenInput("");
      toast({
        title: "Konfigurasi tersimpan ✓",
        description: cfg.enabled
          ? "Notifikasi WhatsApp aktif — coba kirim pesan uji."
          : "Konfigurasi disimpan dalam keadaan nonaktif.",
      });
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res = await apiSend<{ sent: boolean; detail: string }>("/api/whatsapp/test", "POST");
      if (res.sent) {
        toast({ title: "Pesan uji terkirim ✓", description: "Periksa WhatsApp di nomor tujuan." });
      } else {
        toast({ title: "Pesan uji gagal", description: res.detail, variant: "destructive" });
      }
      load();
    } catch (e) {
      toast({ title: "Gagal menguji", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const providerHelp = PROVIDERS.find((p) => p.value === cfg.provider)?.help;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <Icon name="message-circle" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Notifikasi WhatsApp</h3>
            <p className="text-sm text-muted-foreground">
              Teruskan pesan kontak & pendaftaran anggota baru langsung ke WhatsApp admin.
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2.5 shrink-0">
          <span className="text-sm font-semibold">{cfg.enabled ? "Aktif" : "Nonaktif"}</span>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })}
            aria-label="Aktifkan notifikasi WhatsApp"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Kolom kiri: gateway */}
        <div className="space-y-3.5 rounded-xl border bg-muted/30 p-4">
          <div className="space-y-1.5">
            <Label>Provider Gateway</Label>
            <Select value={cfg.provider} onValueChange={(v) => setCfg({ ...cfg, provider: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {providerHelp && <p className="text-[11px] text-muted-foreground leading-relaxed">{providerHelp}</p>}
          </div>

          {cfg.provider === "CUSTOM" && (
            <div className="space-y-1.5">
              <Label htmlFor="wa-url">URL Endpoint</Label>
              <Input
                id="wa-url"
                value={cfg.apiUrl}
                onChange={(e) => setCfg({ ...cfg, apiUrl: e.target.value })}
                placeholder="https://gateway-anda.com/send"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="wa-token">API Token {cfg.hasToken && <span className="text-[11px] font-normal text-muted-foreground">(tersimpan: {cfg.tokenMasked})</span>}</Label>
            <div className="relative">
              <Icon
                name="keyround"
                className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input
                id="wa-token"
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={cfg.hasToken ? "Kosongkan untuk memakai token tersimpan" : "Tempel token gateway di sini"}
                className="ps-9 pe-10 font-mono text-sm"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showToken ? "Sembunyikan token" : "Tampilkan token"}
              >
                <Icon name={showToken ? "eye-off" : "eye"} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-target">Nomor Tujuan Admin</Label>
            <Input
              id="wa-target"
              value={cfg.target}
              onChange={(e) => setCfg({ ...cfg, target: e.target.value })}
              placeholder="6281234567890"
              inputMode="tel"
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Format internasional tanpa tanda + (otomatis dinormalkan dari 08xxx / 8xxx).
            </p>
          </div>
        </div>

        {/* Kolom kanan: event */}
        <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Notifikasi per Event
          </p>
          {[
            {
              key: "notifyContact" as const,
              icon: "inbox",
              title: "Pesan Kontak Baru",
              desc: "Setiap form kontak terkirim di halaman publik.",
            },
            {
              key: "notifyApplication" as const,
              icon: "user-plus",
              title: "Pendaftaran Anggota Baru",
              desc: "Setiap organisasi mendaftar via halaman Gabung.",
            },
          ].map((ev) => (
            <div key={ev.key} className="flex items-start gap-3 rounded-lg border bg-card p-3.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                <Icon name={ev.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.desc}</p>
              </div>
              <Switch
                checked={cfg[ev.key]}
                onCheckedChange={(v) => setCfg({ ...cfg, [ev.key]: v })}
                aria-label={ev.title}
              />
            </div>
          ))}

          {/* Status uji terakhir */}
          <div className="rounded-lg border bg-card p-3.5 text-xs">
            <p className="font-bold flex items-center gap-1.5">
              <Icon name="activity" className="h-3.5 w-3.5 text-primary" />
              Status Uji Terakhir
            </p>
            {cfg.lastTestAt ? (
              <>
                <p className="mt-1 text-muted-foreground">{formatDateTime(cfg.lastTestAt)}</p>
                <p
                  className={cn(
                    "mt-0.5 font-mono break-all",
                    cfg.lastTestStatus.startsWith("OK") ? "text-primary" : "text-destructive"
                  )}
                >
                  {cfg.lastTestStatus}
                </p>
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">Belum pernah diuji.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-gradient-to-r from-primary to-forest text-white sm:order-2"
        >
          {saving ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="save" className="h-4 w-4 mr-2" />}
          Simpan Konfigurasi
        </Button>
        <Button onClick={test} disabled={testing || !cfg.enabled} variant="outline" className="sm:order-1">
          {testing ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="bell-ring" className="h-4 w-4 mr-2" />}
          Kirim Pesan Uji
        </Button>
        {!cfg.enabled && (
          <p className="text-xs text-muted-foreground sm:order-3 sm:ms-auto self-center">
            Aktifkan saklar induk & simpan sebelum menguji.
          </p>
        )}
      </div>
    </div>
  );
}
