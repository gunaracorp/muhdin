/**
 * whatsapp.ts — Gateway notifikasi WhatsApp (Task 15-d).
 *
 * Mendukung 3 provider populer di Indonesia:
 *  - FONNTE  (https://fonnte.com)  — POST x-www-form-urlencoded, token via header
 *  - WABLAS  (https://wablas.com)  — POST JSON, token via query param
 *  - CUSTOM  — endpoint mandiri, POST JSON { token, target, message }
 *
 * Semua kirim gagal-aman (tidak pernah melempar exception ke pemanggil)
 * dan memiliki timeout 10 detik agar form publik tidak menggantung.
 */
import { db } from "@/lib/db";

export const WA_PROVIDERS = ["FONNTE", "WABLAS", "CUSTOM"] as const;

export type WaSendResult = { sent: boolean; detail: string };

/** Ambil baris konfigurasi singleton (dibuat otomatis bila belum ada). */
export async function getWhatsAppSetting() {
  const existing = await db.whatsAppSetting.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return db.whatsAppSetting.create({ data: {} });
}

/** Normalisasi nomor Indonesia: buang non-digit, 0/8 awal → awalan 62. */
export function normalizeWaNumber(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return digits;
}

async function post(url: string, init: RequestInit): Promise<WaSendResult> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    return { sent: false, detail: `HTTP ${res.status} — ${text.slice(0, 160) || "tanpa isi"}` };
  }
  // Beberapa gateway membalas HTTP 200 dengan flag kegagalan di body
  // (cth. Fonnte: { "status": false, "reason": "invalid token" }).
  try {
    const json = JSON.parse(text) as { status?: boolean | string | number; reason?: string; message?: string };
    if (json.status === false || json.status === "false" || json.status === 0) {
      return { sent: false, detail: json.reason || json.message || "Gateway menolak pesan." };
    }
  } catch {
    /* body bukan JSON — anggap sukses (HTTP 200) */
  }
  return { sent: true, detail: text.slice(0, 200) || "OK" };
}

/** Kirim pesan WhatsApp sesuai konfigurasi tersimpan. */
export async function sendWhatsAppMessage(message: string): Promise<WaSendResult> {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled) return { sent: false, detail: "Notifikasi WhatsApp sedang nonaktif." };
    if (!cfg.token) return { sent: false, detail: "Token gateway belum diisi." };
    if (!cfg.target) return { sent: false, detail: "Nomor tujuan admin belum diisi." };
    const target = normalizeWaNumber(cfg.target);

    switch (cfg.provider) {
      case "FONNTE":
        return await post("https://api.fonnte.com/send", {
          method: "POST",
          headers: { Authorization: cfg.token },
          body: new URLSearchParams({ target, message }),
        });
      case "WABLAS":
        return await post(
          `https://console.wablas.com/api/send-message?token=${encodeURIComponent(cfg.token)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: target, message }),
          }
        );
      case "CUSTOM": {
        if (!cfg.apiUrl) return { sent: false, detail: "URL endpoint CUSTOM belum diisi." };
        return await post(cfg.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: cfg.token, target, message }),
        });
      }
      default:
        return { sent: false, detail: `Provider tidak dikenal: ${cfg.provider}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, detail: msg.includes("timeout") ? "Timeout — gateway tidak merespons 10 detik." : msg };
  }
}

/* ================= TEMPLATE PESAN ================= */

export function waContactTemplate(m: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}) {
  return [
    "🔔 *Pesan Baru — Portal MUHDIN*",
    "",
    `*Nama:* ${m.name}`,
    `*Email:* ${m.email}`,
    m.phone ? `*Telepon:* ${m.phone}` : null,
    `*Subjek:* ${m.subject}`,
    "",
    m.message.length > 500 ? `${m.message.slice(0, 500)}…` : m.message,
    "",
    "_Silakan balas melalui CMS MUHDIN → Pesan Masuk._",
  ]
    .filter(Boolean)
    .join("\n");
}

export function waApplicationTemplate(a: {
  orgName: string;
  type: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  licenseNo: string;
  ticketCode: string; // Task 18 — kode tiket pelacakan publik
}) {
  return [
    "📋 *Pendaftaran Anggota Baru — MUHDIN*",
    "",
    `*Kode Tiket:* ${a.ticketCode}`,
    `*Organisasi:* ${a.orgName}`,
    `*Tipe:* ${a.type}`,
    `*Kontak:* ${a.contactName}`,
    `*Email:* ${a.email}`,
    `*Telepon:* ${a.phone}`,
    `*Kota:* ${a.city}`,
    `*No. Izin:* ${a.licenseNo}`,
    "",
    "_Tinjau melalui CMS MUHDIN → Pendaftaran._",
  ].join("\n");
}

/** Task 18 — template pengaduan jamaah baru (halaman #/lapor). */
export function waComplaintTemplate(c: {
  name: string;
  targetMember?: string | null;
  category: string;
}) {
  return [
    "⚠️ *Pengaduan Jamaah Baru — MUHDIN*",
    "",
    `*Pelapor:* ${c.name}`,
    c.targetMember ? `*Penyelenggara Dilaporkan:* ${c.targetMember}` : null,
    `*Kategori:* ${c.category}`,
    "",
    "_Tinjau melalui CMS MUHDIN → Pengaduan._",
  ]
    .filter(Boolean)
    .join("\n");
}

/* ================= NOTIFIER (gagal-aman, fire-and-forget) ================= */

export async function notifyContactMessage(m: Parameters<typeof waContactTemplate>[0]) {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled || !cfg.notifyContact) return;
    const res = await sendWhatsAppMessage(waContactTemplate(m));
    await db.whatsAppSetting
      .update({
        where: { id: cfg.id },
        data: { lastTestAt: new Date(), lastTestStatus: `${res.sent ? "OK" : "GAGAL"} — ${res.detail.slice(0, 180)}` },
      })
      .catch(() => {});
  } catch {
    /* notifikasi tidak boleh mengganggu alur utama */
  }
}

export async function notifyMembershipApplication(a: Parameters<typeof waApplicationTemplate>[0]) {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled || !cfg.notifyApplication) return;
    const res = await sendWhatsAppMessage(waApplicationTemplate(a));
    await db.whatsAppSetting
      .update({
        where: { id: cfg.id },
        data: { lastTestAt: new Date(), lastTestStatus: `${res.sent ? "OK" : "GAGAL"} — ${res.detail.slice(0, 180)}` },
      })
      .catch(() => {});
  } catch {
    /* notifikasi tidak boleh mengganggu alur utama */
  }
}

// Task 18 — notifikasi pengaduan jamaah (mengikuti saklar "pesan kontak",
// karena pengaduan adalah laporan masuk dari publik).
export async function notifyComplaint(c: Parameters<typeof waComplaintTemplate>[0]) {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled || !cfg.notifyContact) return;
    const res = await sendWhatsAppMessage(waComplaintTemplate(c));
    await db.whatsAppSetting
      .update({
        where: { id: cfg.id },
        data: { lastTestAt: new Date(), lastTestStatus: `${res.sent ? "OK" : "GAGAL"} — ${res.detail.slice(0, 180)}` },
      })
      .catch(() => {});
  } catch {
    /* notifikasi tidak boleh mengganggu alur utama */
  }
}
