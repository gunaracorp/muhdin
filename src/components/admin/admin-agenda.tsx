"use client";

/**
 * Task 18-d — CMS "Agenda Kegiatan".
 * CrudManager belum punya tipe field datetime, jadi startsAt/endsAt memakai Input teks
 * dengan format "YYYY-MM-DDTHH:MM" (datetime-local style, waktu lokal) + petunjuk format.
 * transformLoad mengonversi ISO dari server → format input agar mudah diedit kembali;
 * string tersebut tetap valid diparse `new Date(...)` di server saat disimpan.
 */

import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { formatDateTime } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import type { EventItem } from "@/lib/types";

const CATEGORY_OPTS = ["Kegiatan", "Pelatihan", "Rakernas", "Safari"].map((c) => ({ value: c, label: c }));

/** ISO string → "YYYY-MM-DDTHH:MM" (waktu lokal). Nilai tak valid dikembalikan apa adanya. */
function toInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export function AdminAgenda() {
  const config = {
    title: "Agenda Kegiatan",
    description: "Kelola agenda kegiatan, pelatihan, rakernas, dan safari yang tampil di portal publik.",
    endpoint: "/api/events",
    itemName: "Agenda",
    searchKeys: ["title", "location", "category"],
    extraQuery: "?all=1",
    transformLoad: (items: EventItem[]) =>
      items.map((it) => ({
        ...it,
        startsAt: toInputValue(it.startsAt),
        endsAt: it.endsAt ? toInputValue(it.endsAt) : "",
      })),
    defaultItem: () => ({
      title: "",
      description: "",
      location: "",
      startsAt: "",
      endsAt: "",
      category: "Kegiatan",
      published: true,
    }),
    fields: [
      { key: "title", label: "Judul Agenda", type: "text", required: true, full: true },
      { key: "category", label: "Kategori", type: "select", options: CATEGORY_OPTS, required: true },
      { key: "location", label: "Lokasi", type: "text", placeholder: "Contoh: Kantor MUHDIN, Jakarta" },
      {
        key: "startsAt",
        label: "Waktu Mulai",
        type: "text",
        required: true,
        placeholder: "2026-04-10T08:00",
        hint: "Format TAHUN-BULAN-TANGGAL T JAM:MENIT — contoh: 2026-04-10T08:00 (waktu lokal)",
      },
      {
        key: "endsAt",
        label: "Waktu Selesai (opsional)",
        type: "text",
        placeholder: "2026-04-10T16:00",
        hint: "Kosongkan bila tidak ditentukan — format sama dengan waktu mulai",
      },
      {
        key: "published",
        label: "Publikasikan",
        type: "switch",
        full: true,
        hint: "Agenda yang tidak dipublikasikan hanya terlihat di CMS",
      },
      { key: "description", label: "Deskripsi", type: "textarea", placeholder: "Deskripsi singkat agenda…" },
    ] as FieldDef[],
    columns: [
      {
        key: "title",
        label: "Agenda",
        render: (e: EventItem) => (
          <div className="max-w-sm">
            <p className="font-semibold truncate">{e.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {e.location ? `Lokasi: ${e.location}` : e.description || "—"}
            </p>
          </div>
        ),
      },
      {
        key: "startsAt",
        label: "Waktu Mulai",
        render: (e: EventItem) => (
          <span className="text-xs font-semibold whitespace-nowrap">{formatDateTime(e.startsAt)}</span>
        ),
      },
      {
        key: "endsAt",
        label: "Waktu Selesai",
        hideOnMobile: true,
        render: (e: EventItem) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {e.endsAt ? formatDateTime(e.endsAt) : "—"}
          </span>
        ),
      },
      {
        key: "category",
        label: "Kategori",
        hideOnMobile: true,
        render: (e: EventItem) => <Badge variant="secondary" className="text-[10px]">{e.category}</Badge>,
      },
      {
        key: "published",
        label: "Status",
        render: (e: EventItem) => (
          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${e.published ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
          >
            {e.published ? "Terbit" : "Draft"}
          </Badge>
        ),
      },
    ] as ColumnDef<EventItem>[],
  };
  return <CrudManager<EventItem> config={config} />;
}
