/**
 * Task 37 — SUSUNAN PENGURUS MUHDIN (data resmi dari owner).
 *
 * Sumber: susunan resmi yang diberikan owner (Ketua Umum, Sekjen, BEMDUM,
 * Pembina, Penasehat). Nama & gelar dinormalisasi tanda baca saja (Prof. Dr. /
 * KH. / Drs. / Lc. / M.Si. / M.Pd.) — isi tidak diubah.
 *
 * FOTO: taruh file foto resmi di /public/images/pengurus/ lalu isi field
 * `photo` (mis. "/images/pengurus/ketum.jpg"). Bila kosong, UI merender
 * monogram emas elegan sebagai fallback — halaman tetap rapi kapan pun.
 *
 * Peran i18n & mandat ada di src/lib/i18n/locales/pengurus.ts (id/en/ar).
 */

export type PengurusId = "pembina" | "penasehat" | "ketum" | "sekjen" | "bemdum";

export interface PengurusPerson {
  id: PengurusId;
  /** Nama lengkap + gelar (ditulis apa adanya, hanya dirapikan tanda bacanya). */
  name: string;
  /** Path foto di /public — opsional; monogram dipakai bila kosong. */
  photo?: string;
  /** Ikon lencana foto (fallback) & aksen kartu. */
  icon: string;
}

export const PENGURUS_PERSON: Record<PengurusId, PengurusPerson> = {
  pembina: { id: "pembina", name: "Prof. Dr. Anwar Sanusi", icon: "landmark" },
  penasehat: { id: "penasehat", name: "KH. Qosim Saleh, Lc., M.Si.", icon: "compass" },
  ketum: { id: "ketum", name: "Drs. Arif Racman Hakim", icon: "star" },
  sekjen: { id: "sekjen", name: "Gugun Gunara", icon: "scroll-text" },
  bemdum: { id: "bemdum", name: "Jonaedi, M.Pd.", icon: "badge-check" },
};

/** Bidang fungsional Pengurus Pusat — pola asosiasi internasional (IEEE/IATA-style). */
export const PENGURUS_BIDANG: { id: string; icon: string }[] = [
  { id: "b1", icon: "users" }, // Organisasi & Kaderisasi
  { id: "b2", icon: "scale" }, // Advokasi & Regulasi
  { id: "b3", icon: "brain-circuit" }, // Digital & Teknologi
  { id: "b4", icon: "graduation-cap" }, // Pendidikan & Sertifikasi
  { id: "b5", icon: "megaphone" }, // Humas & Publikasi
  { id: "b6", icon: "handshake" }, // Kemitraan & Ekonomi Syariah
];

/** Jumlah provinsi & kab/kota Indonesia untuk kartu jaringan (data BPS). */
export const NET_COUNTS = { bakorwil: 38, bakorcab: 514 } as const;
