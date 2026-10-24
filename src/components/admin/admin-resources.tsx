"use client";

/**
 * Task 18-d — CMS "Pusat Unduhan".
 * Kelola dokumen unduhan publik (formulir, panduan, kebijakan) + kolom jumlah unduhan.
 */

import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import type { ResourceItem } from "@/lib/types";

const CATEGORY_OPTS = ["Formulir", "Panduan", "Kebijakan", "Lainnya"].map((c) => ({ value: c, label: c }));
const FILETYPE_OPTS = ["PDF", "DOCX", "XLSX"].map((c) => ({ value: c, label: c }));

export function AdminResources() {
  const config = {
    title: "Pusat Unduhan",
    description: "Kelola dokumen yang dapat diunduh jamaah & mitra — formulir, panduan, dan kebijakan.",
    endpoint: "/api/resources",
    itemName: "Dokumen",
    searchKeys: ["title", "description", "category", "fileType"],
    extraQuery: "?all=1",
    defaultItem: () => ({
      title: "",
      description: "",
      category: "Formulir",
      fileUrl: "",
      fileType: "PDF",
      published: true,
    }),
    fields: [
      { key: "title", label: "Judul Dokumen", type: "text", required: true, full: true },
      { key: "category", label: "Kategori", type: "select", options: CATEGORY_OPTS, required: true },
      { key: "fileType", label: "Format File", type: "select", options: FILETYPE_OPTS, required: true },
      {
        key: "fileUrl",
        label: "URL File",
        type: "text",
        placeholder: "/dokumen/formulir-anggota.pdf",
        hint: "Path lokal (/dokumen/…) atau URL eksternal file",
      },
      {
        key: "published",
        label: "Publikasikan",
        type: "switch",
        full: true,
        hint: "Dokumen yang tidak dipublikasikan hanya terlihat di CMS",
      },
      { key: "description", label: "Deskripsi", type: "textarea", placeholder: "Deskripsi singkat isi dokumen…" },
    ] as FieldDef[],
    columns: [
      {
        key: "title",
        label: "Dokumen",
        render: (r: ResourceItem) => (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 grid place-items-center text-primary">
              <Icon name="file-text" className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">{r.description || "—"}</p>
            </div>
          </div>
        ),
      },
      {
        key: "category",
        label: "Kategori",
        hideOnMobile: true,
        render: (r: ResourceItem) => <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>,
      },
      {
        key: "fileType",
        label: "Format",
        hideOnMobile: true,
        render: (r: ResourceItem) => (
          <Badge variant="outline" className="text-[10px] font-bold bg-muted text-muted-foreground border-border">
            {r.fileType}
          </Badge>
        ),
      },
      {
        key: "downloads",
        label: "Diunduh",
        render: (r: ResourceItem) => (
          <span className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
            <Icon name="download" className="h-3.5 w-3.5" aria-hidden />
            {r.downloads}×
          </span>
        ),
      },
      {
        key: "published",
        label: "Status",
        render: (r: ResourceItem) => (
          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${r.published ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
          >
            {r.published ? "Terbit" : "Draft"}
          </Badge>
        ),
      },
    ] as ColumnDef<ResourceItem>[],
  };
  return <CrudManager<ResourceItem> config={config} />;
}
