"use client";

/**
 * v6.0 — CMS "Operasi Jamaah" (proses & hilir):
 * Tab 1 Brankas   : verifikasi pengajuan dokumen jamaah (PENDING → VERIFIED/REJECTED).
 * Tab 2 Ulasan    : moderasi ulasan terverifikasi (APPROVED/REJECTED).
 * Tab 3 Darurat   : CRUD titik darurat Tanah Suci (KJRI, KKI, RS…).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDate } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { JamaahDocItem, PilgrimReviewItem, SosPointItem } from "@/lib/types";

const DOC_KINDS = ["PASPOR", "VISA", "VAKSIN", "TIKET", "ASURANSI", "LAINNYA"];
const SOS_CATS = ["HOSPITAL", "CLINIC", "EMBASSY", "CONSULATE", "CONSUL_HAJJ", "KKI", "POLICE", "EMERGENCY"];
const KIND_LABELS: Record<string, string> = {
  PASPOR: "Paspor", VISA: "Visa", VAKSIN: "Vaksin", TIKET: "Tiket", ASURANSI: "Asuransi", LAINNYA: "Lainnya",
};
const SOS_CAT_LABELS: Record<string, string> = {
  HOSPITAL: "Rumah Sakit", CLINIC: "Klinik", EMBASSY: "Kedutaan", CONSULATE: "Konsulat",
  CONSUL_HAJJ: "Konsul Haji", KKI: "KKI", POLICE: "Polisi", EMERGENCY: "Darurat Nasional",
};

function LifecycleBadge({ lc, daysLeft }: { lc: string; daysLeft: number | null }) {
  const map: Record<string, { cls: string; label: string }> = {
    VALID: { cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400", label: "Berlaku" },
    EXPIRING: { cls: "bg-gold/15 text-gold-deep border-gold/40", label: daysLeft !== null ? `${daysLeft} hari lagi` : "Segera" },
    EXPIRED: { cls: "bg-destructive/10 text-destructive border-destructive/30", label: "Kedaluwarsa" },
  };
  const m = map[lc] ?? map.VALID;
  return <Badge variant="outline" className={cn("text-[10px] font-bold", m.cls)}>{m.label}</Badge>;
}

function emptySos() {
  return { name: "", category: "HOSPITAL", city: "", country: "SA", address: "", phone: "", phone2: "", hours: "24 jam", note: "", featured: false };
}

export function AdminJamaahOps() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<JamaahDocItem[] | null>(null);
  const [reviews, setReviews] = useState<PilgrimReviewItem[] | null>(null);
  const [sos, setSos] = useState<SosPointItem[] | null>(null);

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // edit SOS
  const [sosForm, setSosForm] = useState(emptySos());
  const [sosEdit, setSosEdit] = useState<SosPointItem | null>(null);
  const [sosDialog, setSosDialog] = useState(false);
  const [deleting, setDeleting] = useState<{ kind: "doc" | "review" | "sos"; id: string; label: string } | null>(null);

  const load = useCallback(() => {
    apiGet<JamaahDocItem[]>("/api/jamaah-docs").then(setDocs).catch(() => setDocs([]));
    apiGet<PilgrimReviewItem[]>("/api/reviews?status=all").then(setReviews).catch(() => setReviews([]));
    apiGet<SosPointItem[]>("/api/sos-points").then(setSos).catch(() => setSos([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const errToast = (title: string, err: unknown) =>
    toast({ title, description: (err as Error).message, variant: "destructive" });

  /* ===== BRANKAS ===== */
  const setDocStatus = async (d: JamaahDocItem, verifyStatus: string) => {
    setBusy(d.id);
    try {
      await apiSend(`/api/jamaah-docs/${d.id}`, "PUT", { verifyStatus });
      toast({
        title: verifyStatus === "VERIFIED" ? "Dokumen terverifikasi ✓" : verifyStatus === "REJECTED" ? "Dokumen ditolak ✓" : "Dikembalikan ke antrean ✓",
        description: `${d.card?.cardNo ?? ""} — ${KIND_LABELS[d.kind] ?? d.kind}`,
      });
      load();
    } catch (err) { errToast("Gagal memperbarui", err); } finally { setBusy(null); }
  };

  /* ===== ULASAN ===== */
  const setReviewStatus = async (r: PilgrimReviewItem, status: string) => {
    setBusy(r.id);
    try {
      await apiSend(`/api/reviews/${r.id}`, "PUT", { status });
      toast({
        title: status === "APPROVED" ? "Ulasan disetujui ✓" : status === "REJECTED" ? "Ulasan ditolak ✓" : "Dikembalikan ke antrean ✓",
        description: `${r.authorName} — ${r.pkg?.title ?? ""}`,
      });
      load();
    } catch (err) { errToast("Gagal memperbarui", err); } finally { setBusy(null); }
  };

  /* ===== SOS ===== */
  const saveSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (sosEdit) {
        await apiSend(`/api/sos-points/${sosEdit.id}`, "PUT", sosForm);
        toast({ title: "Titik darurat diperbarui ✓", description: sosForm.name });
      } else {
        await apiSend("/api/sos-points", "POST", sosForm);
        toast({ title: "Titik darurat ditambahkan ✓", description: sosForm.name });
      }
      setSosDialog(false);
      setSosEdit(null);
      load();
    } catch (err) { errToast("Gagal menyimpan", err); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleting) return;
    const path = { doc: "jamaah-docs", review: "reviews", sos: "sos-points" }[deleting.kind];
    try {
      await apiSend(`/api/${path}/${deleting.id}`, "DELETE");
      toast({ title: "Dihapus ✓", description: deleting.label });
      load();
    } catch (err) { errToast("Gagal menghapus", err); } finally { setDeleting(null); }
  };

  const selCls = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm";
  const pendingDocs = (docs ?? []).filter((d) => d.verifyStatus === "PENDING").length;
  const pendingReviews = (reviews ?? []).filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">
          Operasi Jamaah (Proses & Hilir)
          {pendingDocs > 0 && <Badge className="danger-solid">{pendingDocs} dokumen menunggu</Badge>}
          {pendingReviews > 0 && <Badge variant="outline" className="border-gold/40 bg-gold/15 text-[10px] font-bold text-gold-deep">{pendingReviews} ulasan menunggu</Badge>}
        </h2>
        <p className="text-sm text-muted-foreground">
          Verifikasi brankas dokumen, moderasi ulasan jamaah terverifikasi, dan pemeliharaan direktori darurat #/darurat.
        </p>
      </div>

      <Tabs defaultValue="vault">
        <TabsList className="mb-4">
          <TabsTrigger value="vault" className="gap-1.5"><Icon name="hard-drive" className="h-3.5 w-3.5" aria-hidden /> Brankas Jamaah ({docs?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><Icon name="message-circle" className="h-3.5 w-3.5" aria-hidden /> Ulasan ({reviews?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="sos" className="gap-1.5"><Icon name="siren" className="h-3.5 w-3.5" aria-hidden /> Titik Darurat ({sos?.length ?? 0})</TabsTrigger>
        </TabsList>

        {/* ===== TAB BRANKAS ===== */}
        <TabsContent value="vault">
          {!docs ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          ) : docs.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="hard-drive" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada pengajuan dokumen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {docs.map((d) => (
                <div key={d.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", d.verifyStatus === "PENDING" && "border-l-4 border-l-gold")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {d.card?.fullName ?? "—"} <span className="font-normal text-muted-foreground">· {KIND_LABELS[d.kind] ?? d.kind}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.card?.cardNo} · {d.docNo || "tanpa nomor"} · {d.card?.groupName || "tanpa rombongan"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.expiryDate ? `Berakhir ${formatDate(d.expiryDate)}` : "tanpa masa berakhir"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <LifecycleBadge lc={d.lifecycle} daysLeft={d.daysLeft} />
                      <Badge variant="outline" className={cn("text-[10px] font-bold",
                        d.verifyStatus === "VERIFIED" ? "bg-primary/10 text-primary border-primary/30"
                        : d.verifyStatus === "PENDING" ? "bg-gold/15 text-gold-deep border-gold/40"
                        : "bg-destructive/10 text-destructive border-destructive/30")}>
                        {d.verifyStatus}
                      </Badge>
                    </div>
                  </div>
                  {d.note && <p className="mt-2 text-xs italic text-muted-foreground">“{d.note}”</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {d.verifyStatus !== "VERIFIED" && (
                      <Button size="sm" className="bg-gradient-to-r from-primary to-forest text-white" disabled={busy === d.id} onClick={() => setDocStatus(d, "VERIFIED")}>
                        <Icon name="check-circle-2" className="h-3.5 w-3.5 mr-1" aria-hidden /> Verifikasi
                      </Button>
                    )}
                    {d.verifyStatus !== "REJECTED" && (
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10" disabled={busy === d.id} onClick={() => setDocStatus(d, "REJECTED")}>
                        <Icon name="ban" className="h-3.5 w-3.5 mr-1" aria-hidden /> Tolak
                      </Button>
                    )}
                    {d.verifyStatus !== "PENDING" && (
                      <Button variant="outline" size="sm" disabled={busy === d.id} onClick={() => setDocStatus(d, "PENDING")}>
                        <Icon name="rotate-ccw" className="h-3.5 w-3.5 mr-1" aria-hidden /> Antre Ulang
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "doc", id: d.id, label: `${d.card?.cardNo} — ${d.kind}` })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB ULASAN ===== */}
        <TabsContent value="reviews">
          {!reviews ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="message-circle" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada ulasan masuk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", r.status === "PENDING" && "border-l-4 border-l-gold")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{r.authorName} <span className="text-xs font-normal text-muted-foreground">({r.cardNo.slice(0, 8)}••••)</span></p>
                      <p className="text-xs text-muted-foreground truncate">{r.pkg?.title ?? "—"} · {formatDate(r.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-extrabold text-gold-deep">{r.rating} ★</span>
                      <Badge variant="outline" className={cn("text-[10px] font-bold",
                        r.status === "APPROVED" ? "bg-primary/10 text-primary border-primary/30"
                        : r.status === "PENDING" ? "bg-gold/15 text-gold-deep border-gold/40"
                        : "bg-destructive/10 text-destructive border-destructive/30")}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">“{r.body}”</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">Hotel {r.hotelRate}/5 · Transport {r.transportRate}/5 · Pembimbing {r.guideRate}/5</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.status !== "APPROVED" && (
                      <Button size="sm" className="bg-gradient-to-r from-primary to-forest text-white" disabled={busy === r.id} onClick={() => setReviewStatus(r, "APPROVED")}>
                        <Icon name="check-circle-2" className="h-3.5 w-3.5 mr-1" aria-hidden /> Setujui
                      </Button>
                    )}
                    {r.status !== "REJECTED" && (
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10" disabled={busy === r.id} onClick={() => setReviewStatus(r, "REJECTED")}>
                        <Icon name="ban" className="h-3.5 w-3.5 mr-1" aria-hidden /> Tolak
                      </Button>
                    )}
                    {r.status !== "PENDING" && (
                      <Button variant="outline" size="sm" disabled={busy === r.id} onClick={() => setReviewStatus(r, "PENDING")}>
                        <Icon name="rotate-ccw" className="h-3.5 w-3.5 mr-1" aria-hidden /> Antre Ulang
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "review", id: r.id, label: `Ulasan ${r.authorName}` })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB SOS ===== */}
        <TabsContent value="sos">
          <Button onClick={() => { setSosForm(emptySos()); setSosEdit(null); setSosDialog(true); }} className="mb-4 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Tambah Titik Darurat
          </Button>
          {!sos ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          ) : sos.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="siren" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Direktori darurat masih kosong.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {sos.map((p) => (
                <div key={p.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{SOS_CAT_LABELS[p.category] ?? p.category} · {p.city || "—"} ({p.country})</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{p.phone}{p.phone2 ? ` / ${p.phone2}` : ""} · {p.hours}</p>
                    </div>
                    {p.featured && <Badge variant="outline" className="shrink-0 border-gold/40 bg-gold/15 text-[10px] font-bold text-gold-deep">Prioritas</Badge>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSosForm({
                        name: p.name, category: p.category, city: p.city, country: p.country,
                        address: p.address, phone: p.phone, phone2: p.phone2 ?? "", hours: p.hours,
                        note: p.note ?? "", featured: p.featured,
                      });
                      setSosEdit(p); setSosDialog(true);
                    }}>
                      <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto" onClick={() => setDeleting({ kind: "sos", id: p.id, label: p.name })}>
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog SOS */}
      <Dialog open={sosDialog} onOpenChange={(o) => !o && setSosDialog(false)}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left">{sosEdit ? "Ubah Titik Darurat" : "Tambah Titik Darurat"}</DialogTitle>
            <DialogDescription className="text-left">Tampil publik di #/darurat → Direktori Tanah Suci.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveSos} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Nama *</Label><Input value={sosForm.name} onChange={(e) => setSosForm({ ...sosForm, name: e.target.value })} required minLength={3} /></div>
              <div className="space-y-1.5">
                <Label>Kategori *</Label>
                <select value={sosForm.category} onChange={(e) => setSosForm({ ...sosForm, category: e.target.value })} className={selCls}>
                  {SOS_CATS.map((c) => <option key={c} value={c}>{SOS_CAT_LABELS[c]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Kota</Label><Input value={sosForm.city} onChange={(e) => setSosForm({ ...sosForm, city: e.target.value })} placeholder="Makkah" /></div>
              <div className="space-y-1.5"><Label>Negara</Label><Input value={sosForm.country} onChange={(e) => setSosForm({ ...sosForm, country: e.target.value })} maxLength={2} /></div>
              <div className="space-y-1.5"><Label>Telepon *</Label><Input value={sosForm.phone} onChange={(e) => setSosForm({ ...sosForm, phone: e.target.value })} required placeholder="+966 12 555 1234" /></div>
              <div className="space-y-1.5"><Label>Telepon 2</Label><Input value={sosForm.phone2} onChange={(e) => setSosForm({ ...sosForm, phone2: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Jam Operasional</Label><Input value={sosForm.hours} onChange={(e) => setSosForm({ ...sosForm, hours: e.target.value })} /></div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Switch checked={sosForm.featured} onCheckedChange={(v) => setSosForm({ ...sosForm, featured: v })} /> Prioritas (tautan pertama)
                </label>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Alamat</Label><Input value={sosForm.address} onChange={(e) => setSosForm({ ...sosForm, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Catatan</Label><Textarea rows={2} value={sosForm.note} onChange={(e) => setSosForm({ ...sosForm, note: e.target.value })} /></div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setSosDialog(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</> : <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus ini?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.label}” akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="danger-solid" onClick={doDelete}>Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
