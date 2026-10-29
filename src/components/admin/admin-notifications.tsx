"use client";

/**
 * Task 60 — Panel notifikasi email sekretariat + log audit terpadu.
 *
 * AdminEmailCard  — konfigurasi SMTP Gmail (App Password), daftar penerima
 *                   (default: asosiasi.muhdin@gmail.com & muhdin.indonesia@gmail.com),
 *                   saklar per jenis formulir, tombol kirim email uji nyata.
 * AdminNotificationLog — audit SEMUA upaya notifikasi (EMAIL & WHATSAPP),
 *                   filter channel/status, statistik, bersihkan log.
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EmailConfig, NotificationLogItem, NotificationLogResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ==================== KARTU KONFIGURASI EMAIL ==================== */

export function AdminEmailCard() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<EmailConfig | null>(null);
  const [passInput, setPassInput] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [recipientsText, setRecipientsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = useCallback(() => {
    apiGet<EmailConfig>("/api/email-settings")
      .then((d) => {
        setCfg(d);
        setRecipientsText(d.recipients.join(", "));
      })
      .catch((e) => {
        toast({ title: "Gagal memuat konfigurasi email", description: (e as Error).message, variant: "destructive" });
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
        smtpHost: cfg.smtpHost,
        smtpPort: cfg.smtpPort,
        smtpSecure: cfg.smtpSecure,
        smtpUser: cfg.smtpUser,
        fromName: cfg.fromName,
        recipients: recipientsText,
        enabled: cfg.enabled,
        notifyContact: cfg.notifyContact,
        notifyApplication: cfg.notifyApplication,
        notifyComplaint: cfg.notifyComplaint,
        notifySubscriber: cfg.notifySubscriber,
        notifyTestimonial: cfg.notifyTestimonial,
        notifyAcademy: cfg.notifyAcademy,
        notifyBooking: cfg.notifyBooking,
        notifyBenefit: cfg.notifyBenefit,
      };
      if (passInput.trim()) payload.smtpPass = passInput.trim();
      const updated = await apiSend<EmailConfig>("/api/email-settings", "PUT", payload);
      setCfg(updated);
      setRecipientsText(updated.recipients.join(", "));
      setPassInput("");
      toast({
        title: "Konfigurasi email tersimpan ✓",
        description: updated.enabled
          ? "Notifikasi email aktif — kirim email uji untuk memastikan."
          : "Disimpan dalam keadaan nonaktif. Aktifkan saklar lalu simpan.",
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
      const res = await apiSend<{ sent: boolean; detail: string }>("/api/email-settings/test", "POST");
      if (res.sent) {
        toast({ title: "Email uji terkirim ✓", description: `Periksa inbox: ${res.detail.slice(0, 120)}` });
      } else {
        toast({ title: "Email uji gagal", description: res.detail, variant: "destructive" });
      }
      load();
    } catch (e) {
      toast({ title: "Gagal menguji", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const EVENTS = [
    { key: "notifyContact" as const, icon: "inbox", title: "Pesan Kontak & DSAR PDP", desc: "Form kontak publik + permintaan hak subjek data." },
    { key: "notifyApplication" as const, icon: "user-plus", title: "Pendaftaran Anggota Baru", desc: "Termasuk nomor urut papan slot & kode tiket." },
    { key: "notifyComplaint" as const, icon: "siren", title: "Pengaduan Jamaah", desc: "Laporan dari halaman Posko Pengaduan." },
    { key: "notifySubscriber" as const, icon: "newspaper", title: "Langganan Newsletter", desc: "Pendaftar kabar via footer portal." },
    { key: "notifyTestimonial" as const, icon: "star", title: "Testimoni Baru", desc: "Testimoni jamaah yang menunggu moderasi." },
    { key: "notifyAcademy" as const, icon: "graduation-cap", title: "Akademi (Kursus & Sertifikat)", desc: "Pendaftaran kursus + kelulusan ber-sertifikat QR." },
    { key: "notifyBooking" as const, icon: "calendar", title: "Booking Slot Layanan", desc: "Kelas manasik, konsultasi syariah, klinik vaksin (BKG)." },
    { key: "notifyBenefit" as const, icon: "award", title: "Tebus Benefit Mitra", desc: "Penukaran poin KTA ke benefit mitra (BNF)." },
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <Icon name="mail" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Notifikasi Email Sekretariat</h3>
            <p className="text-sm text-muted-foreground">
              Setiap formulir yang dikirim publik otomatis diteruskan ke mailbox sekretariat.
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2.5 shrink-0">
          <span className="text-sm font-semibold">{cfg.enabled ? "Aktif" : "Nonaktif"}</span>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })}
            aria-label="Aktifkan notifikasi email"
          />
        </div>
      </div>

      {/* Status ringkas */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={cfg.effective ? "default" : "destructive"} className={cfg.effective ? "bg-primary" : ""}>
          {cfg.effective ? "SMTP siap" : "SMTP belum diisi"}
        </Badge>
        <Badge variant="outline">{cfg.recipients.length} penerima</Badge>
        {cfg.envFallback && <Badge variant="outline">Fallback env aktif</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Kolom kiri: SMTP + penerima */}
        <div className="space-y-3.5 rounded-xl border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="em-host">Server SMTP</Label>
              <Input id="em-host" value={cfg.smtpHost} onChange={(e) => setCfg({ ...cfg, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-port">Port</Label>
              <Input
                id="em-port"
                type="number"
                value={cfg.smtpPort}
                onChange={(e) => {
                  const port = parseInt(e.target.value, 10) || 465;
                  setCfg({ ...cfg, smtpPort: port, smtpSecure: port === 465 });
                }}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1.5">
            Gmail: <span className="font-mono">smtp.gmail.com</span> port <span className="font-mono">465</span> (TLS langsung). Port 587 = STARTTLS.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="em-user">Akun Gmail Pengirim</Label>
            <div className="relative">
              <Icon name="at-sign" className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="em-user"
                type="email"
                value={cfg.smtpUser}
                onChange={(e) => setCfg({ ...cfg, smtpUser: e.target.value })}
                placeholder="sekretariat.muhdin@gmail.com"
                className="ps-9 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="em-pass">
              App Password {cfg.hasPass && <span className="text-[11px] font-normal text-muted-foreground">(tersimpan: {cfg.passMasked})</span>}
            </Label>
            <div className="relative">
              <Icon name="keyround" className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="em-pass"
                type={showPass ? "text" : "password"}
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder={cfg.hasPass ? "Kosongkan untuk memakai password tersimpan" : "16 karakter, tanpa spasi"}
                className="ps-9 pe-10 font-mono text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPass ? "Sembunyikan App Password" : "Tampilkan App Password"}
              >
                <Icon name={showPass ? "eye-off" : "eye"} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="em-to">Email Tujuan Sekretariat</Label>
            <Input
              id="em-to"
              value={recipientsText}
              onChange={(e) => setRecipientsText(e.target.value)}
              placeholder="asosiasi.muhdin@gmail.com, muhdin.indonesia@gmail.com"
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Beberapa email dipisah koma. Default resmi: <span className="font-mono">asosiasi.muhdin@gmail.com</span> &amp; <span className="font-mono">muhdin.indonesia@gmail.com</span>.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="em-name">Nama Pengirim</Label>
            <Input id="em-name" value={cfg.fromName} onChange={(e) => setCfg({ ...cfg, fromName: e.target.value })} className="text-sm" />
          </div>
        </div>

        {/* Kolom kanan: panduan + event + status uji */}
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Icon name="info" className="h-3.5 w-3.5" />
              Cara Mendapatkan App Password Gmail
            </p>
            <ol className="mt-2 space-y-1 text-xs text-muted-foreground leading-relaxed list-decimal ms-4">
              <li>Aktifkan <b>Verifikasi 2 Langkah</b> di akun Google pengirim.</li>
              <li>Buka <span className="font-mono">myaccount.google.com/apppasswords</span>.</li>
              <li>Buat App Password baru (nama: mis. <b>MUHDIN Portal</b>).</li>
              <li>Salin 16 karakter, tempel di kolom App Password di sini.</li>
              <li>Aktifkan saklar induk → <b>Simpan</b> → <b>Kirim Email Uji</b>.</li>
            </ol>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifikasi per Formulir</p>
            {EVENTS.map((ev) => (
              <div key={ev.key} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                  <Icon name={ev.icon} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.desc}</p>
                </div>
                <Switch checked={cfg[ev.key]} onCheckedChange={(v) => setCfg({ ...cfg, [ev.key]: v })} aria-label={ev.title} />
              </div>
            ))}
          </div>

          {/* Status uji terakhir */}
          <div className="rounded-lg border bg-card p-3.5 text-xs">
            <p className="font-bold flex items-center gap-1.5">
              <Icon name="activity" className="h-3.5 w-3.5 text-primary" />
              Status Kirim Terakhir
            </p>
            {cfg.lastTestAt ? (
              <>
                <p className="mt-1 text-muted-foreground">{formatDateTime(cfg.lastTestAt)}</p>
                <p className={cn("mt-0.5 font-mono break-all", cfg.lastTestStatus.startsWith("OK") ? "text-primary" : "text-destructive")}>
                  {cfg.lastTestStatus}
                </p>
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">Belum pernah mengirim — isi App Password lalu uji.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
        <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-forest text-white sm:order-2">
          {saving ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="save" className="h-4 w-4 mr-2" />}
          Simpan Konfigurasi
        </Button>
        <Button onClick={test} disabled={testing || !cfg.enabled} variant="outline" className="sm:order-1">
          {testing ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="send" className="h-4 w-4 mr-2" />}
          Kirim Email Uji
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

/* ==================== CHECKLIST SETUP NOTIFIKASI ==================== */

/** Task 61 — ringkasan status persiapan notifikasi (email + WA) satu layar. */
export function AdminNotificationSetupChecklist() {
  const [email, setEmail] = useState<EmailConfig | null>(null);
  const [wa, setWa] = useState<WhatsAppConfig | null>(null);

  useEffect(() => {
    apiGet<EmailConfig>("/api/email-settings").then(setEmail).catch(() => setEmail(null));
    apiGet<WhatsAppConfig>("/api/whatsapp").then(setWa).catch(() => setWa(null));
  }, []);

  if (!email || !wa) return null;

  const emailOk = email.effective;
  const waTargetOk = wa.target.length >= 10;
  const waGatewayOk = wa.hasToken;

  const rows = [
    {
      icon: "at-sign",
      ok: email.recipients.length > 0,
      title: "Email penerima sekretariat",
      desc: email.recipients.join(", ") || "Belum ada penerima.",
      pending: "Isi minimal satu email tujuan di kartu Notifikasi Email.",
    },
    {
      icon: "mail",
      ok: emailOk,
      title: "Akun Gmail pengirim + App Password (SMTP)",
      desc: emailOk ? `Terpasang untuk ${email.smtpUser || "fallback env"}.` : "Email hanya bisa terkirim setelah SMTP diisi.",
      pending:
        "Aktifkan Verifikasi 2 Langkah di akun Google → myaccount.google.com/apppasswords → buat App Password → tempel di kartu Notifikasi Email → Simpan.",
    },
    {
      icon: "message-circle",
      ok: waTargetOk,
      title: "Nomor WhatsApp admin tujuan",
      desc: waTargetOk ? `Notifikasi dikirim ke +${wa.target.split(",").join(", +")}.` : "Nomor tujuan belum diisi.",
      pending: "Isi nomor di kartu Notifikasi WhatsApp (format 62xxx).",
    },
    {
      icon: "keyround",
      ok: waGatewayOk,
      title: `Gateway WhatsApp — ${wa.provider === "CALLMEBOT" ? "CallMeBot (gratis)" : wa.provider}`,
      desc: waGatewayOk ? "API key/token terpasang — kirim pesan uji untuk memastikan." : "Menunggu API key/token gateway.",
      pending:
        wa.provider === "CALLMEBOT"
          ? "Dari WhatsApp admin, kirim: I enable callmebot on +" + wa.target + " ke nomor +34 644 66 32 62 → salin API key dari balasan → tempel di kartu WhatsApp → Simpan."
          : "Buat token di dashboard provider, tempel di kartu Notifikasi WhatsApp, lalu Simpan.",
    },
    {
      icon: "bell-ring",
      ok: email.enabled || wa.enabled,
      title: "Saklar notifikasi aktif",
      desc: [email.enabled && "Email", wa.enabled && "WhatsApp"].filter(Boolean).join(" & ") + " sedang aktif.",
      pending: "Aktifkan saklar induk di kartu Email dan/atau WhatsApp.",
    },
  ];

  const doneCount = rows.filter((r) => r.ok).length;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <Icon name="clipboard-list" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Checklist Setup Notifikasi</h3>
            <p className="text-sm text-muted-foreground">
              {doneCount === rows.length
                ? "Semua siap — setiap formulir otomatis diteruskan ke sekretariat. ✓"
                : `${doneCount} dari ${rows.length} langkah selesai — lengkapi item bertanda MENUNGGU.`}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto shrink-0">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
              doneCount === rows.length ? "bg-primary text-primary-foreground" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
            )}
          >
            {doneCount}/{rows.length} SIAP
          </span>
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <div key={r.title} className={cn("rounded-xl border p-3.5", r.ok ? "border-primary/30 bg-primary/5" : "border-amber-500/40 bg-amber-500/5")}>
            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg grid place-items-center shrink-0",
                  r.ok ? "bg-primary/10 text-primary" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                <Icon name={r.ok ? "check-circle-2" : r.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug">{r.title}</p>
                {r.ok ? (
                  <p className="text-xs text-muted-foreground mt-1 break-words">{r.desc}</p>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed break-words">
                    <b>MENUNGGU —</b> {r.pending}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== LOG AUDIT NOTIFIKASI ==================== */

const EVENT_LABEL: Record<string, string> = {
  CONTACT: "Pesan Kontak",
  APPLICATION: "Pendaftaran",
  COMPLAINT: "Pengaduan",
  SUBSCRIBER: "Langganan",
  TESTIMONIAL: "Testimoni",
  TEST: "Uji Konfigurasi",
};

const EVENT_ICON: Record<string, string> = {
  CONTACT: "inbox",
  APPLICATION: "user-plus",
  COMPLAINT: "siren",
  SUBSCRIBER: "newspaper",
  TESTIMONIAL: "star",
  TEST: "bell-ring",
};

export function AdminNotificationLog() {
  const { toast } = useToast();
  const [data, setData] = useState<NotificationLogResponse | null>(null);
  const [channel, setChannel] = useState<"ALL" | "EMAIL" | "WHATSAPP">("ALL");
  const [status, setStatus] = useState<"ALL" | "SENT" | "FAILED">("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiGet<NotificationLogResponse>(`/api/notifications?channel=${channel}&status=${status}`)
      .then(setData)
      .catch((e) => toast({ title: "Gagal memuat log", description: (e as Error).message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [channel, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const clearLog = async () => {
    try {
      await apiSend("/api/notifications", "DELETE");
      toast({ title: "Log dibersihkan ✓" });
      load();
    } catch (e) {
      toast({ title: "Gagal membersihkan log", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <Icon name="history" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Log Audit Notifikasi</h3>
            <p className="text-sm text-muted-foreground">
              Bukti pengiriman setiap formulir ke email sekretariat & WhatsApp admin.
            </p>
          </div>
        </div>
        <div className="lg:ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-primary">{data?.stats.sent ?? 0} terkirim</span>
          <span className="text-sm font-semibold text-destructive">{data?.stats.failed ?? 0} gagal</span>
          <Button onClick={refresh} variant="outline" size="sm" disabled={loading} aria-label="Muat ulang log">
            <Icon name="refresh" className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="ms-1.5">Muat Ulang</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" aria-label="Bersihkan log">
                <Icon name="trash" className="h-4 w-4" />
                <span className="ms-1.5">Bersihkan</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bersihkan semua log notifikasi?</AlertDialogTitle>
                <AlertDialogDescription>
                  Seluruh riwayat upaya kirim email & WhatsApp akan dihapus permanen. Riwayat formulir itu sendiri tidak terpengaruh.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={clearLog}>Ya, bersihkan</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["ALL", "EMAIL", "WHATSAPP"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              channel === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {c === "ALL" ? "Semua Channel" : c === "EMAIL" ? "Email" : "WhatsApp"}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border hidden sm:block" />
        {(["ALL", "SENT", "FAILED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              status === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {s === "ALL" ? "Semua Status" : s === "SENT" ? "Terkirim" : "Gagal"}
          </button>
        ))}
      </div>

      {/* Daftar log */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Icon name="inbox" className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold">Belum ada upaya notifikasi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Log muncul otomatis setiap kali publik mengirim formulir (kontak, pendaftaran, pengaduan, langganan, testimoni).
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-xl border divide-y">
          {data.logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3.5 hover:bg-muted/40 transition-colors">
              <div
                className={cn(
                  "h-9 w-9 rounded-lg grid place-items-center shrink-0",
                  log.channel === "EMAIL" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}
                title={log.channel}
              >
                <Icon name={log.channel === "EMAIL" ? "mail" : "message-circle"} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-bold">{EVENT_LABEL[log.eventType] || log.eventType}</span>
                  <Badge
                    variant={log.status === "SENT" ? "default" : "destructive"}
                    className={cn("text-[10px] px-1.5 py-0", log.status === "SENT" && "bg-primary")}
                  >
                    {log.status === "SENT" ? "Terkirim" : "Gagal"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Icon name="clock" className="h-3 w-3" />
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={log.subject}>
                  {log.subject || "—"} → <span className="font-mono">{log.recipient || "—"}</span>
                </p>
                {log.status !== "SENT" && log.detail && (
                  <p className="text-[11px] font-mono text-destructive mt-0.5 break-all" title={log.detail}>
                    {log.detail.slice(0, 160)}
                  </p>
                )}
              </div>
              <Icon name={EVENT_ICON[log.eventType] || "activity"} className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
