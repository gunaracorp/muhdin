"use client";

/**
 * Task 18-d — CMS "Pengaduan" (komponen custom, pola AdminApplications).
 * Antrean penanganan pengaduan jamaah: statistik ringkas (klik = filter),
 * daftar kartu, dialog detail dengan Catatan Tindak Lanjut, aksi Proses (PROCESSED)
 * dan Tutup (CLOSED — catatan wajib min. 5 karakter, validasi inline),
 * jejak penanganan (respondedBy/respondedAt), serta hapus (server menolak VERIFIKATOR
 * → pesan error server ditampilkan via toast).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { ComplaintItem } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  UNREAD: "Baru",
  PROCESSED: "Diproses",
  CLOSED: "Selesai",
};

function ComplaintBadge({ status }: { status: string }) {
  const cls =
    status === "UNREAD"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : status === "PROCESSED"
        ? "bg-gold/15 text-gold-deep border-gold/40"
        : "bg-primary/10 text-primary border-primary/30";
  return (
    <Badge variant="outline" className={`text-[10px] font-bold ${cls}`}>
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}

export function AdminComplaints() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<ComplaintItem[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [viewing, setViewing] = useState<ComplaintItem | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ComplaintItem | null>(null);

  const load = useCallback(() => {
    apiGet<ComplaintItem[]>("/api/complaints").then(setComplaints).catch(() => setComplaints([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (c: ComplaintItem) => {
    setViewing(c);
    setNote(c.responseNote || "");
    setNoteError("");
  };

  const submit = async (status: "PROCESSED" | "CLOSED") => {
    if (!viewing) return;
    if (status === "CLOSED" && note.trim().length < 5) {
      setNoteError("Catatan tindak lanjut wajib diisi (minimal 5 karakter) sebelum pengaduan ditutup.");
      return;
    }
    setProcessing(`${viewing.id}:${status}`);
    try {
      await apiSend(`/api/complaints/${viewing.id}`, "PUT", { status, responseNote: note.trim() });
      toast({
        title: status === "PROCESSED" ? "Pengaduan diproses ✓" : "Pengaduan ditutup ✓",
        description:
          status === "PROCESSED"
            ? "Status kini Diproses — jangan lupa menutup setelah tindak lanjut selesai."
            : "Catatan tindak lanjut tersimpan sebagai bukti penanganan.",
      });
      setViewing(null);
      setNote("");
      setNoteError("");
      load();
    } catch (e) {
      toast({ title: "Gagal memproses", description: (e as Error).message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiSend(`/api/complaints/${deleting.id}`, "DELETE");
      toast({ title: "Pengaduan dihapus ✓" });
      setViewing(null);
      load();
    } catch (e) {
      // Server menolak (mis. VERIFIKATOR tidak berhak) — tampilkan pesan server apa adanya.
      toast({ title: "Gagal menghapus", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const list = complaints || [];
  const newCount = list.filter((c) => c.status === "UNREAD").length;
  const processedCount = list.filter((c) => c.status === "PROCESSED").length;
  const closedCount = list.filter((c) => c.status === "CLOSED").length;

  const statCards = [
    { label: "Baru", value: newCount, status: "UNREAD", icon: "shield-alert", tone: "text-destructive" },
    { label: "Diproses", value: processedCount, status: "PROCESSED", icon: "timer", tone: "text-gold-deep" },
    { label: "Selesai", value: closedCount, status: "CLOSED", icon: "check-circle-2", tone: "text-primary" },
  ];

  const filters = [
    { value: "all", label: "Semua" },
    { value: "UNREAD", label: "Baru" },
    { value: "PROCESSED", label: "Diproses" },
    { value: "CLOSED", label: "Selesai" },
  ];

  const filtered = list.filter((c) => filter === "all" || c.status === filter);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          Pengaduan Jamaah
          {newCount > 0 && <Badge className="danger-solid">{newCount} baru</Badge>}
        </h2>
        <p className="text-sm text-muted-foreground">
          Laporan pengaduan terhadap penyelenggara — proses, catat tindak lanjut, lalu tutup.
        </p>
      </div>

      {/* Statistik ringkas — klik untuk memfilter */}
      <div className="grid grid-cols-3 gap-3 mb-4" role="group" aria-label="Statistik pengaduan">
        {statCards.map((s) => (
          <button
            key={s.status}
            onClick={() => setFilter(filter === s.status ? "all" : s.status)}
            aria-pressed={filter === s.status}
            className={`rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md ${
              filter === s.status ? "border-primary/60 ring-1 ring-primary/30" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-2xl font-extrabold tabular-nums ${s.tone}`}>{s.value}</span>
              <Icon name={s.icon} className={`h-4.5 w-4.5 shrink-0 ${s.tone} opacity-60`} aria-hidden />
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === f.value ? "bg-primary text-white" : "bg-muted text-foreground/70 hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!complaints ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
          <Icon name="shield-alert" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Tidak ada pengaduan pada filter ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => openDetail(c)}
              className={`min-w-0 w-full text-left rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 ${
                c.status === "UNREAD" ? "border-l-4 border-l-destructive" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft font-extrabold">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate ${c.status === "UNREAD" ? "font-extrabold" : "font-bold"}`}>{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Kategori: {c.category} · {formatDateTime(c.createdAt)}
                    </p>
                  </div>
                </div>
                <ComplaintBadge status={c.status} />
              </div>

              <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{c.content}</p>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                {c.targetMember && (
                  <span className="truncate flex items-center gap-1.5 min-w-0">
                    <Icon name="building-2" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {c.targetMember}
                  </span>
                )}
                {c.respondedBy && (
                  <span className="truncate flex items-center gap-1.5 min-w-0">
                    <Icon name="check-circle-2" className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    Ditangani {c.respondedBy}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dialog detail pengaduan */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              <Icon name="shield-alert" className="h-5 w-5 text-destructive" aria-hidden />
              Detail Pengaduan
            </DialogTitle>
            <DialogDescription className="text-left">
              Pelapor: <b>{viewing?.name}</b> · Kategori: {viewing?.category} · {viewing ? formatDateTime(viewing.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <>
              <div className="rounded-xl border bg-muted/40 p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <p><span className="text-muted-foreground">Email:</span> {viewing.email}</p>
                <p><span className="text-muted-foreground">Telp:</span> {viewing.phone || "—"}</p>
                <p className="col-span-2">
                  <span className="text-muted-foreground">Target penyelenggara:</span>{" "}
                  <b>{viewing.targetMember || "Umum / tidak disebut"}</b>
                </p>
                <p className="col-span-2">
                  <span className="text-muted-foreground">Kategori:</span> {viewing.category}
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {viewing.content}
              </div>

              {/* Jejak penanganan bila ada */}
              {viewing.respondedBy && (
                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Icon name="clipboard-list" className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Jejak Penanganan
                  </p>
                  {viewing.responseNote && (
                    <p className="mt-1 text-xs text-muted-foreground italic">“{viewing.responseNote}”</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Ditangani oleh <b>{viewing.respondedBy}</b>
                    {viewing.respondedAt ? ` · ${formatDateTime(viewing.respondedAt)}` : ""}
                  </p>
                </div>
              )}

              {viewing.status !== "CLOSED" && (
                <div className="space-y-1.5">
                  <Label htmlFor="complaint-note">Catatan Tindak Lanjut</Label>
                  <Textarea
                    id="complaint-note"
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      if (noteError) setNoteError("");
                    }}
                    placeholder="Tuliskan tindak lanjut yang dilakukan (wajib saat menutup pengaduan)…"
                    rows={3}
                  />
                  {noteError && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <Icon name="alert-triangle" className="h-3.5 w-3.5" aria-hidden />
                      {noteError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:mr-auto"
              onClick={() => viewing && setDeleting(viewing)}
            >
              <Icon name="trash" className="h-4 w-4 mr-1.5" aria-hidden /> Hapus
            </Button>
            {viewing && viewing.status !== "CLOSED" && (
              <>
                {viewing.status !== "PROCESSED" && (
                  <Button
                    variant="outline"
                    disabled={processing === `${viewing.id}:PROCESSED`}
                    onClick={() => submit("PROCESSED")}
                  >
                    {processing === `${viewing.id}:PROCESSED` ? (
                      <Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
                    ) : (
                      <Icon name="timer" className="h-4 w-4 mr-1.5" aria-hidden />
                    )}
                    Proses
                  </Button>
                )}
                <Button
                  className="bg-gradient-to-r from-primary to-forest text-white"
                  disabled={processing === `${viewing.id}:CLOSED`}
                  onClick={() => submit("CLOSED")}
                >
                  {processing === `${viewing.id}:CLOSED` ? (
                    <Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
                  ) : (
                    <Icon name="check-circle-2" className="h-4 w-4 mr-1.5" aria-hidden />
                  )}
                  Tutup
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengaduan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengaduan dari {deleting?.name} akan dihapus permanen beserta catatan tindak lanjutnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="danger-solid" onClick={doDelete}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
