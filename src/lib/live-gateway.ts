/**
 * Task 53 — Klien broadcast ke Registration Gateway (socket.io, port 3003).
 *
 * Setiap pendaftaran baru yang tersimpan di DB dipush seketika ke SEMUA
 * pengunjung yang sedang membuka halaman (papan slot realtime). Panggilan
 * bersifat server-to-server (127.0.0.1) dan gagal-aman: bila gateway mati,
 * klien tetap mendapat data via polling fallback di useRegistrationLive.
 */

const GATEWAY_URL = process.env.MUHDIN_GATEWAY_URL || "http://127.0.0.1:3004/notify";
const GATEWAY_SECRET = process.env.MUHDIN_GATEWAY_SECRET || "muhdin-local-gateway";

export type RegistrationSlotPayload = {
  /** Nomor urut yang baru terisi. */
  n: number;
  /** Jenis pendaftar (PPIU / PIHK / KBIHU / dst). */
  type: string;
  /** Kota pendaftar (data kasar, aman PDP — tanpa nama organisasi/kontak). */
  city: string;
  /** Waktu kedatangan (ISO). */
  at: string;
  /** Status awal pendaftaran (selalu PENDING saat lahir). */
  status: string;
  /** Total pendaftar valid setelah slot ini terisi (opsional). */
  total?: number;
};

/** Fire-and-forget: jangan pernah menggagalkan POST pendaftaran karena broadcast. */
export function broadcastRegistration(payload: RegistrationSlotPayload): void {
  try {
    void fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mhd-secret": GATEWAY_SECRET,
      },
      body: JSON.stringify({ event: "registration:new", payload }),
      // AbortSignal.timeout tersedia di Node 18+/Bun — batasi agar tak menggantung.
      signal: AbortSignal.timeout(2000),
    }).catch(() => {
      /* gateway tidak jangkauan — abaikan */
    });
  } catch {
    /* abaikan — jangan pernah melempar dari fire-and-forget */
  }
}
