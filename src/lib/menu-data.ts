/**
 * Task 50 — MENU UTAMA MUHDIN (instruksi manajemen).
 *
 * Struktur persis sesuai instruksi:
 *   BERANDA · 13 LAYANAN BISNIS · PENGURUS▾ (BAKORNAS/BAKORWIL/BAKORDA)
 *   PERIZINAN▾ (IATA/PT/PT. BPW/PPIU/PIHK) · SERTIFIKASI▾ (TL/TG/MUTHOWIF)
 *   DIREKTORI ANGGOTA · BERITA · SYARIKAH
 *   PASPOR▾ (VISA UMROH/ZIYARAH/AMIL/HAJI)
 *   TRANSPORTASI▾ (BUS/GMC/KERETA CEPAT)
 *   VAKSIN▾ (VAKSIN MENINGITIS/POLIO/FLU)
 *
 * Label top-level: i18n `navbar.items.<key>` (diterjemahkan di navbar.ts).
 * Label sub-item & halaman detail: i18n `layanan.items.<slug>` (layanan.ts).
 * Sub-item selalu menuju halaman dinamis #/layanan/<slug> (LayananView).
 */

export interface MenuChild {
  /** slug halaman detail → #/layanan/<slug>; sekaligus key i18n layanan.items.<slug> */
  slug: string;
  icon: string;
}

export interface MenuNode {
  /** key i18n label top-level di navbar.items */
  key: string;
  /** link langsung (node tanpa dropdown) — path hash, mis. "beranda" / "layanan/syariah" */
  route?: string;
  /** key group layanan untuk dropdown — i18n layanan.groups.<group> */
  group?: string;
  /** ikon group (dipakai di halaman overview #/layanan) */
  groupIcon?: string;
  children?: MenuChild[];
}

export const MENU_NODES: MenuNode[] = [
  { key: "beranda", route: "beranda" },
  { key: "bisnis13", route: "ekosistem" },
  {
    key: "pengurus",
    group: "pengurus",
    groupIcon: "network",
    children: [
      { slug: "bakornas", icon: "landmark" },
      { slug: "bakorwil", icon: "map" },
      { slug: "bakorda", icon: "map-pin" },
    ],
  },
  {
    key: "perizinan",
    group: "perizinan",
    groupIcon: "file-text",
    children: [
      { slug: "iata", icon: "plane" },
      { slug: "pt", icon: "building-2" },
      { slug: "pt-bpw", icon: "briefcase" },
      { slug: "ppiu", icon: "building" },
      { slug: "pihk", icon: "landmark" },
    ],
  },
  {
    key: "sertifikasi",
    group: "sertifikasi",
    groupIcon: "award",
    children: [
      { slug: "tl", icon: "users" },
      { slug: "tg", icon: "compass" },
      { slug: "muthowif", icon: "moon-star" },
    ],
  },
  { key: "anggota", route: "anggota" },
  { key: "berita", route: "berita" },
  // SYARIKAH — pengganti "Penyedia Saudi" (instruksi manajemen)
  { key: "syariah", route: "layanan/syariah" },
  {
    key: "paspor",
    group: "paspor",
    groupIcon: "passport",
    children: [
      { slug: "visa-umroh", icon: "stamp" },
      { slug: "visa-ziarah", icon: "map" },
      { slug: "visa-amil", icon: "file-text" },
      { slug: "visa-haji", icon: "landmark" },
    ],
  },
  {
    key: "transportasi",
    group: "transportasi",
    groupIcon: "bus",
    children: [
      { slug: "bus", icon: "bus" },
      { slug: "gmc", icon: "truck" },
      { slug: "kereta-cepat", icon: "train-front" },
    ],
  },
  {
    key: "vaksin",
    group: "vaksin",
    groupIcon: "syringe",
    children: [
      { slug: "vaksin-meningitis", icon: "shield-check" },
      { slug: "vaksin-polio", icon: "shield-ellipsis" },
      { slug: "vaksin-flu", icon: "heart-pulse" },
    ],
  },
];

/** Node bertipe group (punya dropdown sub-item) — dipakai navbar & halaman layanan. */
export const MENU_GROUPS: MenuNode[] = MENU_NODES.filter((n) => n.group && n.children);

/** Cari definisi slug layanan di seluruh group. */
export function findLayanan(slug: string): { group: MenuNode; child: MenuChild } | null {
  for (const group of MENU_GROUPS) {
    const child = group.children?.find((c) => c.slug === slug);
    if (child && group.group) return { group, child };
  }
  return null;
}

/** Semua slug layanan yang valid (untuk validasi route). */
export const LAYANAN_SLUGS: string[] = [
  ...MENU_GROUPS.flatMap((g) => (g.children ?? []).map((c) => c.slug)),
  "syariah", // node standalone SYARIKAH juga punya halaman detail
];
