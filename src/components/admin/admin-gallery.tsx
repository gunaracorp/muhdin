"use client";

/**
 * Task 18-d — CMS "Galeri Kegiatan".
 * Kelola foto kegiatan/perjalanan/manasik/fasilitas yang tampil di portal publik.
 * Memakai CrudManager (pola AdminArticles/AdminTutorials) + preview thumbnail kecil
 * di kolom tabel via background-image (aman untuk URL lokal & eksternal).
 */

import { CrudManager } from "@/components/admin/crud-manager";
import type { ColumnDef, FieldDef } from "@/components/admin/crud-manager";
import { Badge } from "@/components/ui/badge";
import type { GalleryItem } from "@/lib/types";

const CATEGORY_OPTS = ["Kegiatan", "Perjalanan", "Manasik", "Fasilitas"].map((c) => ({ value: c, label: c }));

export function AdminGallery() {
  const config = {
    title: "Galeri Kegiatan",
    description: "Kelola foto kegiatan, perjalanan, manasik, dan fasilitas yang tampil di galeri publik.",
    endpoint: "/api/gallery",
    itemName: "Foto",
    searchKeys: ["title", "caption", "category"],
    extraQuery: "?all=1",
    defaultItem: () => ({
      title: "",
      caption: "",
      category: "Kegiatan",
      imageUrl: "",
      order: 99,
      published: true,
    }),
    fields: [
      { key: "title", label: "Judul Foto", type: "text", required: true, full: true },
      { key: "category", label: "Kategori", type: "select", options: CATEGORY_OPTS, required: true },
      {
        key: "imageUrl",
        label: "URL Gambar",
        type: "text",
        placeholder: "/images/gallery-1.jpg",
        hint: "Path lokal (/images/…) atau URL gambar eksternal — pratinjau tampil di tabel",
      },
      { key: "order", label: "Urutan Tampil", type: "number" },
      {
        key: "published",
        label: "Publikasikan",
        type: "switch",
        full: true,
        hint: "Foto yang tidak dipublikasikan hanya terlihat di CMS",
      },
      { key: "caption", label: "Keterangan (Caption)", type: "textarea", placeholder: "Deskripsi singkat foto…" },
    ] as FieldDef[],
    columns: [
      {
        key: "imageUrl",
        label: "Pratinjau",
        render: (g: GalleryItem) => (
          <div
            className="h-10 w-14 shrink-0 rounded-md border bg-muted bg-cover bg-center"
            style={{ backgroundImage: `url("${g.imageUrl}")` }}
            role="img"
            aria-label={`Pratinjau foto: ${g.title}`}
          />
        ),
      },
      {
        key: "title",
        label: "Judul",
        render: (g: GalleryItem) => (
          <div className="max-w-xs">
            <p className="font-semibold truncate">{g.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{g.caption || "—"}</p>
          </div>
        ),
      },
      {
        key: "category",
        label: "Kategori",
        hideOnMobile: true,
        render: (g: GalleryItem) => <Badge variant="secondary" className="text-[10px]">{g.category}</Badge>,
      },
      {
        key: "order",
        label: "Urutan",
        hideOnMobile: true,
        render: (g: GalleryItem) => <span className="text-muted-foreground tabular-nums">{g.order}</span>,
      },
      {
        key: "published",
        label: "Status",
        render: (g: GalleryItem) => (
          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${g.published ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
          >
            {g.published ? "Terbit" : "Draft"}
          </Badge>
        ),
      },
    ] as ColumnDef<GalleryItem>[],
  };
  return <CrudManager<GalleryItem> config={config} />;
}
