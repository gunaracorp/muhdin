/**
 * Task 15-d — Konfigurasi notifikasi WhatsApp (ADMIN+).
 * GET  : konfigurasi + status (token selalu dimasking).
 * PUT  : simpan konfigurasi; token hanya diperbarui bila dikirim non-kosong.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { getWhatsAppSetting, WA_PROVIDERS, normalizeWaNumber } from "@/lib/whatsapp";

function mask(key: string) {
  if (!key) return "";
  if (key.length <= 10) return `${key.slice(0, 2)}••••••`;
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

export async function GET() {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const cfg = await getWhatsAppSetting();
    return ok({
      provider: cfg.provider,
      apiUrl: cfg.apiUrl,
      target: cfg.target,
      enabled: cfg.enabled,
      notifyContact: cfg.notifyContact,
      notifyApplication: cfg.notifyApplication,
      hasToken: Boolean(cfg.token),
      tokenMasked: mask(cfg.token),
      lastTestAt: cfg.lastTestAt,
      lastTestStatus: cfg.lastTestStatus,
    });
  } catch {
    return fail("Gagal memuat konfigurasi WhatsApp.", 500);
  }
}

export async function PUT(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const cfg = await getWhatsAppSetting();
    const body = await req.json();

    const provider = String(body.provider || cfg.provider);
    if (!(WA_PROVIDERS as readonly string[]).includes(provider)) {
      return fail("Provider tidak valid.");
    }
    const targetRaw = body.target !== undefined ? String(body.target) : cfg.target;
    if (targetRaw && normalizeWaNumber(targetRaw).length < 10) {
      return fail("Nomor WhatsApp tujuan tidak valid (contoh: 6281234567890).");
    }

    const updated = await db.whatsAppSetting.update({
      where: { id: cfg.id },
      data: {
        provider,
        apiUrl: body.apiUrl !== undefined ? String(body.apiUrl).trim() : cfg.apiUrl,
        target: targetRaw ? normalizeWaNumber(targetRaw) : "",
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : cfg.enabled,
        notifyContact: body.notifyContact !== undefined ? Boolean(body.notifyContact) : cfg.notifyContact,
        notifyApplication:
          body.notifyApplication !== undefined ? Boolean(body.notifyApplication) : cfg.notifyApplication,
        // Kosong = tetap pakai token lama (agar tidak perlu ketik ulang saat edit).
        token: body.token !== undefined && String(body.token).trim() !== "" ? String(body.token).trim() : cfg.token,
      },
    });

    return ok({
      provider: updated.provider,
      apiUrl: updated.apiUrl,
      target: updated.target,
      enabled: updated.enabled,
      notifyContact: updated.notifyContact,
      notifyApplication: updated.notifyApplication,
      hasToken: Boolean(updated.token),
      tokenMasked: mask(updated.token),
      lastTestAt: updated.lastTestAt,
      lastTestStatus: updated.lastTestStatus,
    });
  } catch {
    return fail("Gagal menyimpan konfigurasi WhatsApp.", 500);
  }
}
