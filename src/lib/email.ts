/**
 * email.ts — Mesin notifikasi email formulir publik (Task 60).
 *
 * Setiap formulir yang dikirim pengunjung (kontak, pendaftaran anggota,
 * pengaduan, langganan, testimoni) diteruskan otomatis ke sekretariat:
 *   • asosiasi.muhdin@gmail.com
 *   • muhdin.indonesia@gmail.com
 *
 * Transport: SMTP Gmail (smtp.gmail.com:465, App Password 16 karakter).
 *  - Konfigurasi tersimpan di DB (model EmailSetting, singleton).
 *  - Fallback env bila kolom DB kosong: SMTP_HOST, SMTP_PORT, SMTP_USER,
 *    SMTP_PASS, SMTP_FROM_NAME, NOTIFY_EMAIL_TO.
 *  - Gagal-aman: tidak pernah melempar exception ke pemanggil (form publik
 *    tetap sukses meskipun SMTP mati), semua upaya tercatat di NotificationLog.
 */
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

/* ==================== KONFIGURASI ==================== */

export const EMAIL_EVENTS = [
  "notifyContact",
  "notifyApplication",
  "notifyComplaint",
  "notifySubscriber",
  "notifyTestimonial",
] as const;

export type EmailEventKey = (typeof EMAIL_EVENTS)[number];

/** Ambil baris konfigurasi singleton (dibuat otomatis bila belum ada). */
export async function getEmailSetting() {
  const existing = await db.emailSetting.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return db.emailSetting.create({ data: {} });
}

type EffectiveSmtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  recipients: string[];
};

/** Resolve konfigurasi efektif: DB menang, env sebagai cadangan. */
export async function resolveEmailConfig(): Promise<EffectiveSmtp> {
  const cfg = await getEmailSetting();
  const envUser = (process.env.SMTP_USER || "").trim();
  const envPass = (process.env.SMTP_PASS || "").trim();
  const envHost = (process.env.SMTP_HOST || "").trim();
  const envPort = Number(process.env.SMTP_PORT || 0);
  const envFromName = (process.env.SMTP_FROM_NAME || "").trim();
  const envTo = (process.env.NOTIFY_EMAIL_TO || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const user = cfg.smtpUser || envUser;
  const pass = cfg.smtpPass || envPass;
  const host = (envHost || cfg.smtpHost || "smtp.gmail.com").trim();
  const port = envPort > 0 ? envPort : cfg.smtpPort || 465;
  const recipients = cfg.recipients
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
  if (recipients.length === 0 && envTo.length > 0 && !cfg.recipients.trim()) recipients.push(...envTo);

  return {
    host,
    port,
    secure: port === 465 ? true : cfg.smtpSecure,
    user,
    pass,
    fromName: cfg.fromName || envFromName || "MUHDIN — Portal Asosiasi",
    recipients: recipients.length > 0 ? recipients : ["asosiasi.muhdin@gmail.com", "muhdin.indonesia@gmail.com"],
  };
}

/** SMTP siap kirim? (butuh user + pass / App Password) */
export async function isEmailConfigured(): Promise<boolean> {
  try {
    const c = await resolveEmailConfig();
    return Boolean(c.user && c.pass);
  } catch {
    return false;
  }
}

export type EmailSendResult = { sent: boolean; detail: string };

/* ==================== UTIL ==================== */

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Format waktu WIB lengkap — "Senin, 23 Februari 2026, 14.30.15 WIB". */
export function fmtWib(d: Date): string {
  try {
    const s = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "full",
      timeStyle: "medium",
    }).format(d);
    return `${s} WIB`;
  } catch {
    return d.toISOString();
  }
}

const BRAND_GREEN = "#14532d";
const BRAND_GOLD = "#b45309";

/* ==================== KERANGKA EMAIL HTML ==================== */

type MailBlock = { label: string; value: string };

/** Kerangka HTML bermerek — inline CSS penuh agar aman di semua klien email. */
function emailShell(opts: {
  badge: string;
  title: string;
  headline: MailBlock[]; // 1–3 fakta utama (kartu strip emas)
  rows: MailBlock[]; // tabel detail lengkap
  blocks?: { label: string; text: string }[]; // isi naratif panjang
  refId?: string | null;
}): { html: string; text: string } {
  const headline = opts.headline
    .map(
      (h) => `<td style="padding:0 6px;">
        <div style="background:#fefce8;border:1px solid #fde68a;border-left:4px solid ${BRAND_GOLD};border-radius:8px;padding:10px 12px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#92400e;">${esc(h.label)}</div>
          <div style="font-size:16px;font-weight:800;color:#1f2937;margin-top:2px;word-break:break-word;">${esc(h.value)}</div>
        </div>
      </td>`
    )
    .join("");

  const table = opts.rows
    .map(
      (r, i) => `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
        <td style="padding:8px 14px;font-size:12px;font-weight:700;color:#6b7280;width:190px;vertical-align:top;border-bottom:1px solid #f3f4f6;">${esc(r.label)}</td>
        <td style="padding:8px 14px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;word-break:break-word;">${esc(r.value) || "—"}</td>
      </tr>`
    )
    .join("");

  const blocks = (opts.blocks || [])
    .map(
      (b) => `<div style="margin-top:14px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin-bottom:5px;">${esc(b.label)}</div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.7;color:#374151;white-space:pre-wrap;word-break:break-word;">${esc(b.text)}</div>
      </div>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="id"><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:20px 12px;">
  <div style="background:linear-gradient(135deg,${BRAND_GREEN} 0%,#166534 60%,#3f6212 100%);border-radius:14px 14px 0 0;padding:22px 24px;">
    <div style="font-size:20px;font-weight:900;letter-spacing:.04em;color:#ffffff;">MUHDIN<span style="color:#fbbf24;">.</span></div>
    <div style="font-size:10px;color:#d1fae5;letter-spacing:.12em;text-transform:uppercase;margin-top:2px;">Masyarakat Umroh Haji Digital Indonesia</div>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:24px;">
    <span style="display:inline-block;background:${BRAND_GREEN};color:#fbbf24;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border-radius:999px;padding:5px 12px;">${esc(opts.badge)}</span>
    <h1 style="margin:10px 0 4px;font-size:19px;line-height:1.35;color:#111827;">${esc(opts.title)}</h1>
    <table role="presentation" style="border-collapse:separate;border-spacing:0 0;width:100%;margin:14px 0 4px;"><tr>${headline}</tr></table>
    <table role="presentation" style="border-collapse:collapse;width:100%;margin-top:14px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">${table}</table>
    ${blocks}
    <p style="margin:18px 0 0;font-size:12px;color:#6b7280;">Data lengkap tersedia di CMS MUHDIN — tinjau, proses, dan arsipkan sesuai SLA layanan sekretariat.</p>
  </div>
  <div style="background:#111827;border-radius:0 0 14px 14px;padding:14px 24px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Email otomatis dari formulir portal MUHDIN${opts.refId ? ` • Ref: ${esc(opts.refId)}` : ""}</p>
    <p style="margin:3px 0 0;font-size:11px;color:#6b7280;">Dikirim ${esc(fmtWib(new Date()))}</p>
  </div>
</div>
</body></html>`;

  const textHeadline = opts.headline.map((h) => `${h.label}: ${h.value}`).join("\n");
  const textRows = opts.rows.map((r) => `${r.label}: ${r.value || "-"}`).join("\n");
  const textBlocks = (opts.blocks || []).map((b) => `\n${b.label}:\n${b.text}`).join("\n");
  const text = `${opts.badge} — ${opts.title}\n\n${textHeadline}\n\n${textRows}${textBlocks}\n\n--\nEmail otomatis portal MUHDIN${opts.refId ? ` • Ref: ${opts.refId}` : ""}\nDikirim ${fmtWib(new Date())}`;

  return { html, text };
}

/* ==================== TEMPLATE PER EVENT ==================== */

export function emailApplicationTemplate(a: {
  queueNumber: number | null;
  ticketCode: string;
  orgName: string;
  type: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  licenseNo: string;
  message?: string | null;
  createdAt: Date;
  refId?: string;
}) {
  return emailShell({
    badge: "Pendaftaran Anggota Baru",
    title: `Pendaftaran baru masuk — nomor urut #${a.queueNumber ?? "-"} (${esc(a.type)})`,
    headline: [
      { label: "Nomor Urut", value: `#${a.queueNumber ?? "-"}` },
      { label: "Kode Tiket", value: a.ticketCode },
      { label: "Organisasi", value: a.orgName },
    ],
    rows: [
      { label: "Nama Organisasi", value: a.orgName },
      { label: "Jenis Keanggotaan", value: a.type },
      { label: "Nama Kontak", value: a.contactName },
      { label: "Email", value: a.email },
      { label: "Telepon / WA", value: a.phone },
      { label: "Kota", value: a.city },
      { label: "Provinsi", value: a.province },
      { label: "Nomor Izin (Kemenkumham)", value: a.licenseNo },
      { label: "Status", value: "PENDING — menunggu verifikasi" },
      { label: "Waktu Kirim (WIB)", value: fmtWib(a.createdAt) },
    ],
    blocks: a.message ? [{ label: "Pesan Organisasi", text: a.message }] : [],
    refId: a.refId,
  });
}

export function emailContactTemplate(m: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  createdAt: Date;
  refId?: string;
}) {
  return emailShell({
    badge: "Pesan Kontak Masuk",
    title: `Pesan baru: ${m.subject}`,
    headline: [
      { label: "Nama", value: m.name },
      { label: "Email Pengirim", value: m.email },
      { label: "Telepon", value: m.phone || "—" },
    ],
    rows: [
      { label: "Nama", value: m.name },
      { label: "Email", value: m.email },
      { label: "Telepon", value: m.phone || "—" },
      { label: "Subjek", value: m.subject },
      { label: "Waktu Kirim (WIB)", value: fmtWib(m.createdAt) },
    ],
    blocks: [{ label: "Isi Pesan", text: m.message }],
    refId: m.refId,
  });
}

export function emailComplaintTemplate(c: {
  name: string;
  email: string;
  phone?: string | null;
  targetMember?: string | null;
  category: string;
  content: string;
  createdAt: Date;
  refId?: string;
}) {
  return emailShell({
    badge: "Pengaduan Jamaah",
    title: `Pengaduan baru — kategori ${c.category}`,
    headline: [
      { label: "Pelapor", value: c.name },
      { label: "Kategori", value: c.category },
      { label: "Penyelenggara", value: c.targetMember || "Tidak disebut" },
    ],
    rows: [
      { label: "Nama Pelapor", value: c.name },
      { label: "Email", value: c.email },
      { label: "Telepon", value: c.phone || "—" },
      { label: "Penyelenggara Dilaporkan", value: c.targetMember || "—" },
      { label: "Kategori", value: c.category },
      { label: "Waktu Kirim (WIB)", value: fmtWib(c.createdAt) },
    ],
    blocks: [{ label: "Uraian Pengaduan", text: c.content }],
    refId: c.refId,
  });
}

export function emailSubscriberTemplate(s: { email: string; createdAt: Date; refId?: string }) {
  return emailShell({
    badge: "Pelanggan Newsletter",
    title: "Langganan kabar baru",
    headline: [{ label: "Email", value: s.email }],
    rows: [
      { label: "Email", value: s.email },
      { label: "Waktu (WIB)", value: fmtWib(s.createdAt) },
    ],
    refId: s.refId,
  });
}

export function emailTestimonialTemplate(t: {
  name: string;
  role: string;
  content: string;
  rating: number;
  createdAt: Date;
  refId?: string;
}) {
  return emailShell({
    badge: "Testimoni Baru",
    title: `Testimoni baru dari ${t.name} (${t.rating}/5)`,
    headline: [
      { label: "Nama", value: t.name },
      { label: "Peran", value: t.role },
      { label: "Rating", value: `${t.rating} / 5 ★` },
    ],
    rows: [
      { label: "Nama", value: t.name },
      { label: "Peran", value: t.role },
      { label: "Rating", value: `${t.rating} dari 5 bintang` },
      { label: "Status Publikasi", value: "BELUM — menunggu moderasi admin" },
      { label: "Waktu Kirim (WIB)", value: fmtWib(t.createdAt) },
    ],
    blocks: [{ label: "Isi Testimoni", text: t.content }],
    refId: t.refId,
  });
}

export function emailTestTemplate() {
  return emailShell({
    badge: "Tes Konfigurasi",
    title: "Tes kirim email berhasil ✓",
    headline: [{ label: "Status", value: "SMTP aktif" }],
    rows: [
      { label: "Server SMTP", value: "Terhubung & autentikasi sukses" },
      { label: "Waktu Uji (WIB)", value: fmtWib(new Date()) },
    ],
    blocks: [
      {
        label: "Arti Email Ini",
        text: "Semua formulir publik (kontak, pendaftaran anggota, pengaduan, langganan, testimoni) akan otomatis diteruskan ke mailbox sekretariat yang terdaftar pada konfigurasi.",
      },
    ],
  });
}

/* ==================== KIRIM + LOG ==================== */

type LogInput = {
  channel: "EMAIL" | "WHATSAPP";
  eventType: string;
  status: "SENT" | "FAILED";
  recipient: string;
  subject: string;
  detail: string;
  refId?: string | null;
};

/** Tulis log audit — gagal-aman (log tidak boleh mengganggu alur utama). */
export async function logNotification(input: LogInput): Promise<void> {
  try {
    await db.notificationLog.create({
      data: {
        channel: input.channel,
        eventType: input.eventType,
        status: input.status,
        recipient: input.recipient.slice(0, 250),
        subject: input.subject.slice(0, 250),
        detail: input.detail.slice(0, 500),
        refId: input.refId || null,
      },
    });
  } catch {
    /* diamkan — logging tidak boleh melempar */
  }
}

async function updateLastTest(status: string) {
  try {
    const cfg = await getEmailSetting();
    await db.emailSetting.update({ where: { id: cfg.id }, data: { lastTestAt: new Date(), lastTestStatus: status.slice(0, 180) } });
  } catch {
    /* diamkan */
  }
}

/**
 * Kirim email ke SEMUA penerima sekretariat (satu sesi SMTP per penerima,
 * dikirim paralel — satu penerima gagal tidak menggagalkan yang lain).
 */
export async function sendSecretariatEmail(params: {
  subject: string;
  html: string;
  text: string;
  eventType: string;
  refId?: string | null;
}): Promise<EmailSendResult> {
  try {
    const cfg = await resolveEmailConfig();
    if (!cfg.user || !cfg.pass) {
      // Task 60 — tetap catat agar admin melihat bahwa formulir masuk namun
      // belum bisa diteruskan (petunjuk jelas di detail).
      const detail = "SMTP belum dikonfigurasi — isi akun Gmail + App Password di CMS → Pengaturan.";
      await logNotification({
        channel: "EMAIL",
        eventType: params.eventType,
        status: "FAILED",
        recipient: cfg.recipients.join(", "),
        subject: params.subject,
        detail,
        refId: params.refId,
      });
      await updateLastTest(`GAGAL — ${detail}`);
      return { sent: false, detail };
    }
    if (cfg.recipients.length === 0) {
      return { sent: false, detail: "Tidak ada email tujuan yang valid." };
    }

    const results = await Promise.allSettled(
      cfg.recipients.map(async (to) => {
        const transport = nodemailer.createTransport({
          host: cfg.host,
          port: cfg.port,
          secure: cfg.secure,
          auth: { user: cfg.user, pass: cfg.pass },
          connectionTimeout: 12_000,
          greetingTimeout: 12_000,
          socketTimeout: 20_000,
        });
        try {
          const info = await transport.sendMail({
            from: `"${cfg.fromName}" <${cfg.user}>`,
            to,
            subject: params.subject,
            text: params.text,
            html: params.html,
            replyTo: cfg.user,
          });
          const detail = info.messageId ? `OK (${info.messageId})` : "OK";
          await logNotification({ channel: "EMAIL", eventType: params.eventType, status: "SENT", recipient: to, subject: params.subject, detail, refId: params.refId });
          return { to, sent: true as const, detail };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await logNotification({ channel: "EMAIL", eventType: params.eventType, status: "FAILED", recipient: to, subject: params.subject, detail: msg, refId: params.refId });
          return { to, sent: false as const, detail: msg };
        }
      })
    );

    const settled = results.map((r) => (r.status === "fulfilled" ? r.value : { to: "?", sent: false as const, detail: String(r.reason) }));
    const okCount = settled.filter((r) => r.sent).length;
    const summary = settled.map((r) => `${r.to}=${r.sent ? "OK" : `GAGAL(${r.detail.slice(0, 80)})`}`).join("; ");
    const allOk = okCount === settled.length;
    await updateLastTest(`${allOk ? "OK" : "GAGAL"} ${okCount}/${settled.length} — ${summary.slice(0, 150)}`);
    return { sent: okCount > 0, detail: `${okCount}/${settled.length} terkirim — ${summary}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateLastTest(`GAGAL — ${msg.slice(0, 160)}`);
    return { sent: false, detail: msg };
  }
}

/* ==================== NOTIFIER (gagal-aman, fire-and-forget) ==================== */

function subjectPrefix(s: string) {
  return `[MUHDIN] ${s}`;
}

export async function notifyEmailApplication(a: Parameters<typeof emailApplicationTemplate>[0]) {
  try {
    const cfg = await getEmailSetting();
    if (!cfg.enabled || !cfg.notifyApplication) return;
    const { html, text } = emailApplicationTemplate(a);
    await sendSecretariatEmail({
      subject: subjectPrefix(`Pendaftaran Baru #${a.queueNumber ?? "-"} — ${a.orgName} (${a.type})`),
      html,
      text,
      eventType: "APPLICATION",
      refId: a.refId,
    });
  } catch {
    /* tidak boleh mengganggu alur utama */
  }
}

export async function notifyEmailContact(m: Parameters<typeof emailContactTemplate>[0]) {
  try {
    const cfg = await getEmailSetting();
    if (!cfg.enabled || !cfg.notifyContact) return;
    const { html, text } = emailContactTemplate(m);
    await sendSecretariatEmail({
      subject: subjectPrefix(`Pesan Kontak — ${m.subject}`),
      html,
      text,
      eventType: "CONTACT",
      refId: m.refId,
    });
  } catch {
    /* diamkan */
  }
}

export async function notifyEmailComplaint(c: Parameters<typeof emailComplaintTemplate>[0]) {
  try {
    const cfg = await getEmailSetting();
    if (!cfg.enabled || !cfg.notifyComplaint) return;
    const { html, text } = emailComplaintTemplate(c);
    await sendSecretariatEmail({
      subject: subjectPrefix(`Pengaduan Jamaah — ${c.category}${c.targetMember ? ` (${c.targetMember})` : ""}`),
      html,
      text,
      eventType: "COMPLAINT",
      refId: c.refId,
    });
  } catch {
    /* diamkan */
  }
}

export async function notifyEmailSubscriber(s: Parameters<typeof emailSubscriberTemplate>[0]) {
  try {
    const cfg = await getEmailSetting();
    if (!cfg.enabled || !cfg.notifySubscriber) return;
    const { html, text } = emailSubscriberTemplate(s);
    await sendSecretariatEmail({
      subject: subjectPrefix(`Langganan Newsletter — ${s.email}`),
      html,
      text,
      eventType: "SUBSCRIBER",
      refId: s.refId,
    });
  } catch {
    /* diamkan */
  }
}

export async function notifyEmailTestimonial(t: Parameters<typeof emailTestimonialTemplate>[0]) {
  try {
    const cfg = await getEmailSetting();
    if (!cfg.enabled || !cfg.notifyTestimonial) return;
    const { html, text } = emailTestimonialTemplate(t);
    await sendSecretariatEmail({
      subject: subjectPrefix(`Testimoni Baru — ${t.name} (${t.rating}/5)`),
      html,
      text,
      eventType: "TESTIMONIAL",
      refId: t.refId,
    });
  } catch {
    /* diamkan */
  }
}

/** Kirim email uji dari CMS admin — mengembalikan hasil nyata gateway. */
export async function sendEmailTest(): Promise<EmailSendResult> {
  const { html, text } = emailTestTemplate();
  return sendSecretariatEmail({
    subject: subjectPrefix("Email Uji Konfigurasi — silakan abaikan"),
    html,
    text,
    eventType: "TEST",
  });
}
