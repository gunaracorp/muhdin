/**
 * Task 60 — Konfigurasi notifikasi email sekretariat (ADMIN+).
 * GET  : konfigurasi (password selalu dimasking) + status konfigurasi efektif.
 * PUT  : simpan konfigurasi; App Password hanya diperbarui bila dikirim non-kosong.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { getEmailSetting } from "@/lib/email";

function mask(key: string) {
  if (!key) return "";
  if (key.length <= 10) return `${key.slice(0, 2)}••••••`;
  return `${key.slice(0, 3)}••••••••••${key.slice(-3)}`;
}

export async function GET() {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const cfg = await getEmailSetting();
    const envFallbackUser = Boolean((process.env.SMTP_USER || "").trim() && (process.env.SMTP_PASS || "").trim());
    const recipients = cfg.recipients.split(",").map((s) => s.trim()).filter(Boolean);
    return ok({
      smtpHost: cfg.smtpHost,
      smtpPort: cfg.smtpPort,
      smtpSecure: cfg.smtpSecure,
      smtpUser: cfg.smtpUser,
      fromName: cfg.fromName,
      recipients,
      enabled: cfg.enabled,
      notifyContact: cfg.notifyContact,
      notifyApplication: cfg.notifyApplication,
      notifyComplaint: cfg.notifyComplaint,
      notifySubscriber: cfg.notifySubscriber,
      notifyTestimonial: cfg.notifyTestimonial,
      hasPass: Boolean(cfg.smtpPass),
      passMasked: mask(cfg.smtpPass),
      envFallback: envFallbackUser,
      effective: Boolean((cfg.smtpUser || envFallbackUser) && (cfg.smtpPass || (process.env.SMTP_PASS || "").trim())),
      lastTestAt: cfg.lastTestAt,
      lastTestStatus: cfg.lastTestStatus,
    });
  } catch {
    return fail("Gagal memuat konfigurasi email.", 500);
  }
}

export async function PUT(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const cfg = await getEmailSetting();
    const body = await req.json();

    const port = body.smtpPort !== undefined ? parseInt(body.smtpPort, 10) : cfg.smtpPort;
    if (!Number.isFinite(port) || port < 1 || port > 65535) return fail("Port SMTP tidak valid (1–65535).");

    const recipientsRaw = body.recipients !== undefined ? String(body.recipients) : cfg.recipients;
    const recipients = recipientsRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (recipients.length === 0) return fail("Minimal satu email tujuan sekretariat wajib diisi.");
    const bad = recipients.find((r) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r));
    if (bad) return fail(`Format email tujuan tidak valid: ${bad}`);

    const user = body.smtpUser !== undefined ? String(body.smtpUser).trim() : cfg.smtpUser;
    if (user && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user)) return fail("Format akun pengirim (SMTP user) tidak valid.");

    const updated = await db.emailSetting.update({
      where: { id: cfg.id },
      data: {
        smtpHost: body.smtpHost !== undefined ? String(body.smtpHost).trim() : cfg.smtpHost,
        smtpPort: port,
        smtpSecure: body.smtpSecure !== undefined ? Boolean(body.smtpSecure) : port === 465,
        smtpUser: user,
        // Kosong = tetap pakai App Password lama (agar tidak perlu ketik ulang).
        smtpPass:
          body.smtpPass !== undefined && String(body.smtpPass).trim() !== "" ? String(body.smtpPass).trim() : cfg.smtpPass,
        fromName: body.fromName !== undefined ? String(body.fromName).trim() : cfg.fromName,
        recipients: recipients.join(","),
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : cfg.enabled,
        notifyContact: body.notifyContact !== undefined ? Boolean(body.notifyContact) : cfg.notifyContact,
        notifyApplication: body.notifyApplication !== undefined ? Boolean(body.notifyApplication) : cfg.notifyApplication,
        notifyComplaint: body.notifyComplaint !== undefined ? Boolean(body.notifyComplaint) : cfg.notifyComplaint,
        notifySubscriber: body.notifySubscriber !== undefined ? Boolean(body.notifySubscriber) : cfg.notifySubscriber,
        notifyTestimonial: body.notifyTestimonial !== undefined ? Boolean(body.notifyTestimonial) : cfg.notifyTestimonial,
      },
    });

    const envFallback = Boolean((process.env.SMTP_USER || "").trim() && (process.env.SMTP_PASS || "").trim());
    return ok({
      smtpHost: updated.smtpHost,
      smtpPort: updated.smtpPort,
      smtpSecure: updated.smtpSecure,
      smtpUser: updated.smtpUser,
      fromName: updated.fromName,
      recipients: updated.recipients.split(",").map((s) => s.trim()).filter(Boolean),
      enabled: updated.enabled,
      notifyContact: updated.notifyContact,
      notifyApplication: updated.notifyApplication,
      notifyComplaint: updated.notifyComplaint,
      notifySubscriber: updated.notifySubscriber,
      notifyTestimonial: updated.notifyTestimonial,
      hasPass: Boolean(updated.smtpPass),
      passMasked: mask(updated.smtpPass),
      envFallback,
      effective: Boolean((updated.smtpUser || (process.env.SMTP_USER || "").trim()) && (updated.smtpPass || (process.env.SMTP_PASS || "").trim())),
      lastTestAt: updated.lastTestAt,
      lastTestStatus: updated.lastTestStatus,
    });
  } catch {
    return fail("Gagal menyimpan konfigurasi email.", 500);
  }
}
