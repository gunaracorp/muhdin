/**
 * whatsapp.ts — Gateway notifikasi WhatsApp (Task 15-d).
 *
 * Mendukung 4 provider populer di Indonesia:
 *  - FONNTE     (https://fonnte.com)     — POST x-www-form-urlencoded, token via header
 *  - WABLAS     (https://wablas.com)     — POST JSON, token via query param
 *  - CALLMEBOT  (https://callmebot.com)  — 100% GRATIS tanpa daftar (Task 61):
 *                admin kirim WA "I enable callmebot on +62xxx" ke +34 644 66 32 62,
 *                balasan berisi API key. Kirim via GET whatsapp.php.
 *  - CUSTOM     — endpoint mandiri, POST JSON { token, target, message }
 *
 * Semua kirim gagal-aman (tidak pernah melempar exception ke pemanggil)
 * dan memiliki timeout 10 detik agar form publik tidak menggantung.
 */
import { db } from "@/lib/db";
import { logNotification, fmtWib } from "@/lib/email"; // Task 60 — audit log terpadu + format WIB (v11.1)

export const WA_PROVIDERS = ["FONNTE", "WABLAS", "CALLMEBOT", "CUSTOM"] as const;

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
    /* body bukan JSON — lanjut cek teks polos */
  }
  // Task 61 — CallMeBot membalas HTTP 200 dengan teks polos "ERROR: …" saat
  // apikey salah; anggap gagal agar tidak salah catat SENT.
  if (/^\s*error/i.test(text)) {
    return { sent: false, detail: text.replace(/<[^>]+>/g, "").slice(0, 160).trim() };
  }
  return { sent: true, detail: text.slice(0, 200) || "OK" };
}

/** Kirim pesan WhatsApp sesuai konfigurasi tersimpan.
 *  Task 60 — mendukung multi-nomor tujuan (dipisah koma); setiap nomor
 *  dikirim paralel, satu nomor gagal tidak menggagalkan yang lain. */
export async function sendWhatsAppMessage(message: string): Promise<WaSendResult> {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled) return { sent: false, detail: "Notifikasi WhatsApp sedang nonaktif." };
    if (!cfg.token) return { sent: false, detail: "Token gateway belum diisi." };
    const targets = cfg.target
      .split(",")
      .map((s) => normalizeWaNumber(s.trim()))
      .filter((s) => s.length >= 10);
    if (targets.length === 0) return { sent: false, detail: "Nomor tujuan admin belum diisi." };
    if (targets.length === 1) return await sendToTarget(cfg.provider, cfg.apiUrl, cfg.token, targets[0], message);

    const results = await Promise.allSettled(
      targets.map((t) => sendToTarget(cfg.provider, cfg.apiUrl, cfg.token, t, message))
    );
    const settled = results.map((r) => (r.status === "fulfilled" ? r.value : { sent: false, detail: String(r.reason) }));
    const okCount = settled.filter((r) => r.sent).length;
    return {
      sent: okCount > 0,
      detail: `${okCount}/${targets.length} terkirim — ${targets.map((t, i) => `${t}=${settled[i]?.sent ? "OK" : "GAGAL"}`).join("; ")}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, detail: msg.includes("timeout") ? "Timeout — gateway tidak merespons 10 detik." : msg };
  }
}

/** Kirim ke satu nomor tujuan pada provider tertentu. */
async function sendToTarget(
  provider: string,
  apiUrl: string,
  token: string,
  target: string,
  message: string
): Promise<WaSendResult> {
  try {
    switch (provider) {
      case "FONNTE":
        return await post("https://api.fonnte.com/send", {
          method: "POST",
          headers: { Authorization: token },
          body: new URLSearchParams({ target, message }),
        });
      case "WABLAS":
        return await post(
          `https://console.wablas.com/api/send-message?token=${encodeURIComponent(token)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: target, message }),
          }
        );
      case "CALLMEBOT": {
        // Task 61 — CallMeBot: gratis, tanpa server, API key dari balasan WA.
        // phone wajib format internasional dengan awalan + (%2B saat di-encode).
        if (!token) return { sent: false, detail: "API key CallMeBot belum diisi." };
        const url =
          `https://api.callmebot.com/whatsapp.php?phone=%2B${encodeURIComponent(target)}` +
          `&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(token)}`;
        return await post(url, { method: "GET" });
      }
      case "CUSTOM": {
        if (!apiUrl) return { sent: false, detail: "URL endpoint CUSTOM belum diisi." };
        return await post(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, target, message }),
        });
      }
      default:
        return { sent: false, detail: `Provider tidak dikenal: ${provider}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, detail: msg.includes("timeout") ? "Timeout — gateway tidak merespons 10 detik." : msg };
  }
}

/* ================= TEMPLATE PESAN ================= */

/**
 * v5 Fase 2 — kirim balasan chatbot AI ke SATU nomor pengirim (bukan admin).
 * Beda dari sendWhatsAppMessage (notifikasi): target = pengirim pesan masuk,
 * memakai kredensial gateway yang sama. CallMeBot tidak mendukung balasan
 * chatbot (hanya notifikasi ke nomor admin terdaftar).
 */
export async function sendBotReply(
  provider: string,
  apiUrl: string,
  token: string,
  target: string,
  message: string
): Promise<WaSendResult> {
  if (provider === "CALLMEBOT") {
    return {
      sent: false,
      detail: "CallMeBot hanya mendukung notifikasi admin — balasan chatbot tidak terkirim.",
    };
  }
  return sendToTarget(provider, apiUrl, token, target, message);
}

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
  queueNumber?: number | null; // Task 53 — nomor urut papan slot
}) {
  return [
    "📋 *Pendaftaran Anggota Baru — MUHDIN*",
    "",
    a.queueNumber ? `*Nomor Urut:* #${a.queueNumber}` : null,
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
  ]
    .filter(Boolean)
    .join("\n");
}

/** Task 60 — template langganan newsletter baru (footer publik). */
export function waSubscriberTemplate(s: { email: string }) {
  return [
    "📰 *Langganan Newsletter Baru — MUHDIN*",
    "",
    `*Email:* ${s.email}`,
    "",
    "_Tinjau melalui CMS MUHDIN → Pelanggan._",
  ].join("\n");
}

/** Task 60 — template testimoni publik baru (menunggu moderasi). */
export function waTestimonialTemplate(t: { name: string; role: string; rating: number }) {
  return [
    "⭐ *Testimoni Baru — MUHDIN*",
    "",
    `*Nama:* ${t.name}`,
    `*Peran:* ${t.role}`,
    `*Rating:* ${t.rating}/5`,
    "",
    "_Moderasi melalui CMS MUHDIN → Testimoni._",
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
    await logNotification({
      channel: "WHATSAPP",
      eventType: "CONTACT",
      status: res.sent ? "SENT" : "FAILED",
      recipient: cfg.target,
      subject: `Pesan Kontak — ${m.subject}`,
      detail: res.detail,
    });
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
    await logNotification({
      channel: "WHATSAPP",
      eventType: "APPLICATION",
      status: res.sent ? "SENT" : "FAILED",
      recipient: cfg.target,
      subject: `Pendaftaran #${a.queueNumber ?? "-"} — ${a.orgName}`,
      detail: res.detail,
    });
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
    await logNotification({
      channel: "WHATSAPP",
      eventType: "COMPLAINT",
      status: res.sent ? "SENT" : "FAILED",
      recipient: cfg.target,
      subject: `Pengaduan — ${c.category}`,
      detail: res.detail,
    });
  } catch {
    /* notifikasi tidak boleh mengganggu alur utama */
  }
}

/** Task 60 — notifikasi WA langganan newsletter (mengikuti saklar kontak). */
export async function notifySubscriber(s: Parameters<typeof waSubscriberTemplate>[0]) {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled || !cfg.notifyContact) return;
    const res = await sendWhatsAppMessage(waSubscriberTemplate(s));
    await logNotification({
      channel: "WHATSAPP",
      eventType: "SUBSCRIBER",
      status: res.sent ? "SENT" : "FAILED",
      recipient: cfg.target,
      subject: `Langganan — ${s.email}`,
      detail: res.detail,
    });
  } catch {
    /* diamkan */
  }
}

/** Task 60 — notifikasi WA testimoni baru (mengikuti saklar kontak). */
export async function notifyTestimonial(t: Parameters<typeof waTestimonialTemplate>[0]) {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled || !cfg.notifyContact) return;
    const res = await sendWhatsAppMessage(waTestimonialTemplate(t));
    await logNotification({
      channel: "WHATSAPP",
      eventType: "TESTIMONIAL",
      status: res.sent ? "SENT" : "FAILED",
      recipient: cfg.target,
      subject: `Testimoni — ${t.name}`,
      detail: res.detail,
    });
  } catch {
    /* diamkan */
  }
}

/* ============ TEMPLATE v11.1 — LAYANAN ANGGOTA ============ */

/** v11.1 — pendaftaran kursus Akademi. */
export function waAcademyTemplate(e: { name: string; email: string; courseTitle: string }) {
  return [
    "🎓 *Pendaftaran Kursus Akademi — MUHDIN*",
    "",
    `*Peserta:* ${e.name}`,
    `*Email:* ${e.email}`,
    `*Kursus:* ${e.courseTitle}`,
    "",
    "_Pantau via CMS MUHDIN → Akademi._",
  ].join("\n");
}

/** v11.1 — sertifikat terbit setelah lulus quiz. */
export function waCertificateTemplate(c: { name: string; courseTitle: string; score: number; certCode: string }) {
  return [
    "🏅 *Sertifikat Digital Terbit — MUHDIN*",
    "",
    `*Peserta:* ${c.name}`,
    `*Kursus:* ${c.courseTitle}`,
    `*Skor:* ${c.score}/100 — LULUS`,
    `*Kode Sertifikat:* ${c.certCode}`,
    "",
    "_Verifikasi publik: portal → Verifikasi Sertifikat._",
  ].join("\n");
}

/** v11.1 — booking slot layanan (BKG). */
export function waBookingTemplate(b: {
  code: string;
  name: string;
  phone: string;
  pax: number;
  service: string;
  slotTitle: string;
  city: string;
  startsAt: Date;
}) {
  return [
    "📅 *Booking Slot Layanan — MUHDIN*",
    "",
    `*Kode:* ${b.code}`,
    `*Nama:* ${b.name}`,
    `*Telepon:* ${b.phone}`,
    `*Layanan:* ${b.service}`,
    `*Sesi:* ${b.slotTitle} — ${b.city}`,
    `*Jadwal:* ${fmtWib(b.startsAt)}`,
    `*Peserta:* ${b.pax} orang`,
    "",
    "_Tinjau melalui CMS MUHDIN → Booking._",
  ].join("\n");
}

/** v11.1 — penebusan benefit mitra dengan poin KTA (BNF). */
export function waBenefitTemplate(r: {
  code: string;
  holderName: string;
  cardNo: string;
  benefitTitle: string;
  pointsCost: number;
}) {
  return [
    "🎁 *Tebus Benefit Mitra — MUHDIN*",
    "",
    `*Kode Tebus:* ${r.code}`,
    `*Pemegang:* ${r.holderName}`,
    `*No. KTA:* ${r.cardNo}`,
    `*Benefit:* ${r.benefitTitle}`,
    `*Poin Ditukar:* ${r.pointsCost}`,
    "",
    "_Mitra memverifikasi kode saat penukaran._",
  ].join("\n");
}

/* ============ NOTIFIER v11.1 (gagal-aman) ============ */

async function notifyWaEvent(
  eventType: "ACADEMY" | "CERTIFICATE" | "BOOKING" | "BENEFIT",
  message: string,
  subject: string,
  switchKey: "notifyAcademy" | "notifyBooking" | "notifyBenefit"
) {
  try {
    const cfg = await getWhatsAppSetting();
    if (!cfg.enabled || !cfg[switchKey]) return;
    const res = await sendWhatsAppMessage(message);
    await logNotification({
      channel: "WHATSAPP",
      eventType,
      status: res.sent ? "SENT" : "FAILED",
      recipient: cfg.target,
      subject,
      detail: res.detail,
    });
  } catch {
    /* notifikasi tidak boleh mengganggu alur utama */
  }
}

export function notifyAcademyEnroll(e: Parameters<typeof waAcademyTemplate>[0]) {
  return notifyWaEvent("ACADEMY", waAcademyTemplate(e), `Akademi — ${e.name}`, "notifyAcademy");
}

export function notifyCertificate(c: Parameters<typeof waCertificateTemplate>[0]) {
  return notifyWaEvent("CERTIFICATE", waCertificateTemplate(c), `Sertifikat — ${c.name}`, "notifyAcademy");
}

export function notifyBooking(b: Parameters<typeof waBookingTemplate>[0]) {
  return notifyWaEvent("BOOKING", waBookingTemplate(b), `Booking ${b.code}`, "notifyBooking");
}

export function notifyBenefit(r: Parameters<typeof waBenefitTemplate>[0]) {
  return notifyWaEvent("BENEFIT", waBenefitTemplate(r), `Tebus ${r.code}`, "notifyBenefit");
}
