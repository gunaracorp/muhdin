"use client";

/**
 * v5.0 — CMS "Kartu Jamaah": terbitkan & kelola kartu digital ber-QR.
 * - Terbitkan kartu: nomor otomatis MHD-JM-<tahun>-<4digit> (server),
 *   opsional terhubung ke anggota penyelenggara + masa berlaku.
 * - Dialog QR: pratinjau kartu + QR (react-qr-code) siap dicetak/disimpan.
 * - Aksi: Bekukan / Aktifkan, Hapus (audit di server).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend, formatDate } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { MuhdinLogo } from "@/components/site/logo";
import type { PilgrimCardItem } from "@/lib/types";

interface MemberOption {
  id: string;
  name: string;
  city: string;
  status: string;
}

const CARD_STATUS: Record<string, string> = { ACTIVE: "Aktif", SUSPENDED: "Dibekukan", EXPIRED: "Kedaluwarsa" };
const CARD_TYPES: Record<string, string> = { JAMAAH: "Jamaah", PENDAMPING: "Pendamping", PETUGAS: "Petugas" };

function CardBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE"
      ? "bg-primary/10 text-primary border-primary/30"
      : status === "SUSPENDED"
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : "bg-gold/15 text-gold-deep border-gold/40";
  return (
    <Badge variant="outline" className={`text-[10px] font-bold ${cls}`}>
      {CARD_STATUS[status] || status}
    </Badge>
  );
}

export function AdminPilgrimCards() {
  const { toast } = useToast();
  const [cards, setCards] = useState<PilgrimCardItem[] | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [query, setQuery] = useState("");

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PilgrimCardItem | null>(null);
  const [qrView, setQrView] = useState<PilgrimCardItem | null>(null);
  const [deleting, setDeleting] = useState<PilgrimCardItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "", phone: "", type: "JAMAAH", memberId: "", groupName: "",
    validUntil: "", note: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiGet<PilgrimCardItem[]>("/api/pilgrim-cards").then(setCards).catch(() => setCards([]));
  }, []);

  useEffect(() => {
    load();
    apiGet<(MemberOption & { status: string })[]>("/api/members?status=all")
      .then((rows) => setMembers(rows.filter((m) => m.status === "TERVERIFIKASI")))
      .catch(() => setMembers([]));
  }, [load]);

  const openCreate = () => {
    setForm({ fullName: "", phone: "", type: "JAMAAH", memberId: "", groupName: "", validUntil: "", note: "" });
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (c: PilgrimCardItem) => {
    setForm({
      fullName: c.fullName, phone: c.phone, type: c.type, memberId: c.memberId ?? "",
      groupName: c.groupName, validUntil: c.validUntil ? c.validUntil.slice(0, 10) : "",
      note: c.note ?? "",
    });
    setEditing(c);
    setCreating(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        phone: form.phone,
        type: form.type,
        memberId: form.memberId || undefined,
        groupName: form.groupName,
        validUntil: form.validUntil || undefined,
        note: form.note || undefined,
      };
      if (editing) {
        await apiSend(`/api/pilgrim-cards/${editing.id}`, "PUT", payload);
        toast({ title: "Kartu diperbarui ✓", description: editing.cardNo });
      } else {
        const created = await apiSend<PilgrimCardItem>("/api/pilgrim-cards", "POST", payload);
        toast({ title: "Kartu diterbitkan ✓", description: created.cardNo });
        setQrView(created);
      }
      setCreating(false);
      setEditing(null);
      load();
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (c: PilgrimCardItem, status: string) => {
    setBusy(c.id);
    try {
      await apiSend(`/api/pilgrim-cards/${c.id}`, "PUT", { status });
      toast({ title: `Kartu ${CARD_STATUS[status].toLowerCase()} ✓`, description: c.cardNo });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiSend(`/api/pilgrim-cards/${deleting.id}`, "DELETE");
      toast({ title: "Kartu dihapus ✓", description: deleting.cardNo });
      load();
    } catch (err) {
      toast({ title: "Gagal menghapus", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (cards || []).filter(
      (c) => !q || `${c.cardNo} ${c.fullName} ${c.groupName} ${c.phone}`.toLowerCase().includes(q)
    );
  }, [cards, query]);

  const activeCount = (cards || []).filter((c) => c.status === "ACTIVE").length;
  const totalScans = (cards || []).reduce((a, c) => a + c.scans, 0);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          Kartu Jamaah Digital
          <Badge variant="outline" className="bg-primary/10 text-[10px] font-bold text-primary border-primary/30">
            {activeCount} aktif
          </Badge>
          <Badge variant="outline" className="bg-gold/15 text-[10px] font-bold text-gold-deep border-gold/40">
            {totalScans} verifikasi QR
          </Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          Terbitkan kartu ber-QR untuk jamaah — verifikasi publik di #/kartu, terhubung langsung ke database.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor kartu, nama, rombongan…"
            className="h-10 rounded-xl ps-9"
            aria-label="Cari kartu"
          />
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-primary to-forest text-white">
          <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Terbitkan Kartu
        </Button>
      </div>

      {!cards ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
          <Icon name="qr-code" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Belum ada kartu — terbitkan kartu pertama.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((c) => (
            <div key={c.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", c.status === "SUSPENDED" && "border-l-4 border-l-destructive")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft font-extrabold">
                    {c.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{c.fullName}</p>
                    <p className="font-mono text-[11px] text-gold-deep">{c.cardNo}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {CARD_TYPES[c.type] ?? c.type}
                      {c.groupName ? ` · ${c.groupName}` : ""}
                      {c.member ? ` · ${c.member.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <CardBadge status={c.status} />
                  <span className="text-[10px] text-muted-foreground">{c.scans} scan</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Icon name="phone" className="h-3 w-3" aria-hidden /> {c.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Icon name="clock" className="h-3 w-3" aria-hidden />
                  {c.validUntil ? `s.d. ${formatDate(c.validUntil)}` : "tanpa batas"}
                </span>
                {c.issuedBy && <span>oleh {c.issuedBy}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setQrView(c)}>
                  <Icon name="qr-code" className="h-3.5 w-3.5 mr-1" aria-hidden /> QR
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                  <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                </Button>
                {c.status === "ACTIVE" ? (
                  <Button variant="outline" size="sm" disabled={busy === c.id} onClick={() => setStatus(c, "SUSPENDED")}>
                    <Icon name="ban" className="h-3.5 w-3.5 mr-1" aria-hidden /> Bekukan
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary to-forest text-white"
                    disabled={busy === c.id}
                    onClick={() => setStatus(c, "ACTIVE")}
                  >
                    <Icon name="check-circle-2" className="h-3.5 w-3.5 mr-1" aria-hidden /> Aktifkan
                  </Button>
                )}
                <Button
                  variant="outline" size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto"
                  onClick={() => setDeleting(c)}
                >
                  <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog create/edit kartu */}
      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              <Icon name="id-card" className="h-5 w-5 text-primary" aria-hidden />
              {editing ? `Ubah ${editing.cardNo}` : "Terbitkan Kartu Jamaah"}
            </DialogTitle>
            <DialogDescription className="text-left">
              Nomor kartu dibangkitkan otomatis (MHD-JM-{new Date().getFullYear()}-XXXX) dan QR tersedia setelah tersimpan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nama Lengkap Jamaah *</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={3} />
              </div>
              <div className="space-y-1.5">
                <Label>No. WhatsApp</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812…" inputMode="tel" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {Object.entries(CARD_TYPES).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Anggota (opsional)</Label>
                <select
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  <option value="">— tanpa anggota —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Rombongan</Label>
                <Input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} placeholder="Rombl. Bakti Madinah" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Berlaku hingga</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="mis. grup keluarga Pak Ahmad" />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Batal</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? (
                  <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</>
                ) : (
                  <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan Kartu</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog QR pratinjau kartu */}
      <Dialog open={!!qrView} onOpenChange={(o) => !o && setQrView(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left">QR Kartu — {qrView?.cardNo}</DialogTitle>
            <DialogDescription className="text-left">
              Pindai QR membuka halaman verifikasi publik #/kartu/{qrView?.cardNo}.
            </DialogDescription>
          </DialogHeader>
          {qrView && (
            <div className="relative overflow-hidden rounded-2xl bg-forest-deep p-5 text-white">
              <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MuhdinLogo className="h-9 w-9" />
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-100/80">MUHDIN</p>
                      <p className="font-mono text-xs font-extrabold text-gold">{qrView.cardNo}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <QRCode
                      value={`${window.location.origin}/#/kartu/${encodeURIComponent(qrView.cardNo)}`}
                      size={84}
                      bgColor="#ffffff"
                      fgColor="#1a2e25"
                      role="img"
                      aria-label={`QR ${qrView.cardNo}`}
                    />
                  </div>
                </div>
                <p className="mt-4 text-lg font-extrabold">{qrView.fullName}</p>
                <p className="text-xs text-emerald-100/85">
                  {CARD_TYPES[qrView.type] ?? qrView.type}
                  {qrView.groupName ? ` · ${qrView.groupName}` : ""}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Icon name="printer" className="h-4 w-4 mr-1.5" aria-hidden /> Cetak
            </Button>
            <Button className="bg-gradient-to-r from-primary to-forest text-white" onClick={() => setQrView(null)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kartu ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.cardNo} — {deleting?.fullName} akan dihapus permanen dan QR-nya menjadi tidak valid.
            </AlertDialogDescription>
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
