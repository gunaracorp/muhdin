"use client";

/**
 * v5.0 — CMS "Marketplace Paket": kelola paket ibadah anggota + pipeline booking.
 * Tab 1 Paket   : CRUD paket (anggota dipilih dari direktori; status, slot, harga).
 * Tab 2 Booking : antrean booking publik — status NEW → CONTACTED → CONFIRMED,
 *                 CANCELLED membebaskan slot otomatis (server-side).
 * Pola UI mengikuti AdminComplaints (kartu + dialog + toast + audit di server).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
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
import type { TourPackageItem, PackageBookingItem } from "@/lib/types";

interface MemberOption {
  id: string;
  name: string;
  type: string;
  city: string;
  status: string;
}

const TYPES = ["UMROH", "HAJI", "ZIARAH", "WISATA_ISLAMI"];
const TYPE_LABELS: Record<string, string> = {
  UMROH: "Umroh", HAJI: "Haji", ZIARAH: "Ziarah", WISATA_ISLAMI: "Wisata Islami",
};
const STATUS_LABELS: Record<string, string> = { PUBLISHED: "Terbit", DRAFT: "Draf", CLOSED: "Ditutup" };
const BOOKING_STATUS: Record<string, string> = {
  NEW: "Baru", CONTACTED: "Dihubungi", CONFIRMED: "Dikonfirmasi", CANCELLED: "Dibatalkan",
};

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  const cls =
    status === "PUBLISHED" || status === "CONFIRMED" || status === "APPROVED"
      ? "bg-primary/10 text-primary border-primary/30"
      : status === "DRAFT" || status === "CONTACTED" || status === "NEW"
        ? "bg-gold/15 text-gold-deep border-gold/40"
        : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <Badge variant="outline" className={`text-[10px] font-bold ${cls}`}>
      {map[status] || status}
    </Badge>
  );
}

export function AdminPackages() {
  const { toast } = useToast();
  const [pkgs, setPkgs] = useState<TourPackageItem[] | null>(null);
  const [bookings, setBookings] = useState<PackageBookingItem[] | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);

  // form paket
  const [editing, setEditing] = useState<TourPackageItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    memberId: "", title: "", type: "UMROH", city: "", description: "", price: "",
    durationDays: "9", departureDate: "", slots: "40", hotelMakkah: "", hotelMadinah: "",
    airline: "", status: "PUBLISHED", featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TourPackageItem | null>(null);
  const [busyBooking, setBusyBooking] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<TourPackageItem[]>("/api/packages?status=all").then(setPkgs).catch(() => setPkgs([]));
    apiGet<PackageBookingItem[]>("/api/package-bookings").then(setBookings).catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    load();
    apiGet<MemberOption[]>("/api/members?status=all")
      .then((rows) => setMembers(rows.filter((m) => m.status === "TERVERIFIKASI")))
      .catch(() => setMembers([]));
  }, [load]);

  const openCreate = () => {
    setForm({
      memberId: members[0]?.id ?? "", title: "", type: "UMROH", city: "", description: "", price: "",
      durationDays: "9", departureDate: "", slots: "40", hotelMakkah: "", hotelMadinah: "",
      airline: "", status: "PUBLISHED", featured: false,
    });
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (p: TourPackageItem) => {
    setForm({
      memberId: p.memberId, title: p.title, type: p.type, city: p.city, description: p.description,
      price: String(p.price), durationDays: String(p.durationDays),
      departureDate: p.departureDate ? p.departureDate.slice(0, 10) : "",
      slots: String(p.slots), hotelMakkah: p.hotelMakkah, hotelMadinah: p.hotelMadinah,
      airline: p.airline, status: p.status, featured: p.featured,
    });
    setEditing(p);
    setCreating(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        memberId: form.memberId,
        title: form.title,
        type: form.type,
        city: form.city,
        description: form.description,
        price: Number(form.price) || 0,
        durationDays: Number(form.durationDays) || 9,
        departureDate: form.departureDate || undefined,
        slots: Number(form.slots) || 40,
        hotelMakkah: form.hotelMakkah,
        hotelMadinah: form.hotelMadinah,
        airline: form.airline,
        status: form.status,
        featured: form.featured,
      };
      if (editing) {
        await apiSend(`/api/packages/${editing.id}`, "PUT", payload);
        toast({ title: "Paket diperbarui ✓", description: form.title });
      } else {
        await apiSend("/api/packages", "POST", payload);
        toast({ title: "Paket ditambahkan ✓", description: form.title });
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

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiSend(`/api/packages/${deleting.id}`, "DELETE");
      toast({ title: "Paket dihapus ✓", description: deleting.title });
      load();
    } catch (err) {
      toast({ title: "Gagal menghapus", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const setBookingStatus = async (b: PackageBookingItem, status: string) => {
    setBusyBooking(b.id);
    try {
      await apiSend(`/api/package-bookings/${b.id}`, "PUT", { status });
      toast({
        title: status === "CANCELLED" ? "Booking dibatalkan ✓" : `Booking → ${BOOKING_STATUS[status]} ✓`,
        description: status === "CANCELLED" ? "Slot paket otomatis dibebaskan." : b.name,
      });
      load();
    } catch (err) {
      toast({ title: "Gagal memperbarui", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusyBooking(null);
    }
  };

  const list = pkgs || [];
  const bookingList = bookings || [];
  const newBookings = bookingList.filter((b) => b.status === "NEW").length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          Marketplace Paket Ibadah
          {newBookings > 0 && <Badge className="danger-solid">{newBookings} booking baru</Badge>}
        </h2>
        <p className="text-sm text-muted-foreground">
          Kelola paket umrah/haji/ziarah anggota terverifikasi dan proses booking jamaah.
        </p>
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="mb-4">
          <TabsTrigger value="packages" className="gap-1.5">
            <Icon name="package" className="h-3.5 w-3.5" aria-hidden /> Paket ({list.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1.5">
            <Icon name="clipboard-list" className="h-3.5 w-3.5" aria-hidden /> Booking ({bookingList.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB PAKET ===== */}
        <TabsContent value="packages">
          <Button onClick={openCreate} className="mb-4 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="plus" className="h-4 w-4 mr-1.5" aria-hidden /> Tambah Paket
          </Button>

          {!pkgs ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="package" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada paket — tambahkan paket pertama.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {list.map((p) => {
                const left = Math.max(0, p.slots - p.slotsTaken);
                return (
                  <div key={p.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft font-extrabold">
                          {(p.member?.name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{p.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.member?.name} · {p.city || p.member?.city} · {TYPE_LABELS[p.type] ?? p.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge status={p.status} map={STATUS_LABELS} />
                        {p.featured && (
                          <Badge variant="outline" className="bg-gold/15 text-[10px] font-bold text-gold-deep border-gold/40">
                            Unggulan
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-extrabold text-gold-deep">{rupiah(p.price)}</span>
                      <span>{p.durationDays} hari</span>
                      <span className={cn(left <= 5 && "font-bold text-destructive")}>
                        Slot: {left}/{p.slots}
                      </span>
                      {p.departureDate && (
                        <span className="flex items-center gap-1">
                          <Icon name="plane-takeoff" className="h-3 w-3" aria-hidden />
                          {formatDateTime(p.departureDate)}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        <Icon name="pencil" className="h-3.5 w-3.5 mr-1" aria-hidden /> Ubah
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyBooking === p.id || p.status === "PUBLISHED"}
                        onClick={async () => {
                          setBusyBooking(p.id);
                          try {
                            await apiSend(`/api/packages/${p.id}`, "PUT", { status: "PUBLISHED" });
                            toast({ title: "Paket diterbitkan ✓", description: p.title });
                            load();
                          } catch (err) {
                            toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
                          } finally {
                            setBusyBooking(null);
                          }
                        }}
                      >
                        <Icon name="megaphone" className="h-3.5 w-3.5 mr-1" aria-hidden /> Terbitkan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto"
                        onClick={() => setDeleting(p)}
                      >
                        <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB BOOKING ===== */}
        <TabsContent value="bookings">
          {!bookings ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : bookingList.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="clipboard-list" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada booking masuk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {bookingList.map((b) => (
                <div key={b.id} className={cn("rounded-2xl border bg-card p-5 shadow-sm", b.status === "NEW" && "border-l-4 border-l-gold")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-forest grid place-items-center text-gold-soft font-extrabold">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{b.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.pkg?.title ?? "—"} · {b.pilgrims} jamaah · {formatDateTime(b.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} map={BOOKING_STATUS} />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <p className="flex items-center gap-1.5">
                      <Icon name="phone" className="h-3 w-3" aria-hidden /> {b.phone}
                    </p>
                    {b.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Icon name="mail" className="h-3 w-3" aria-hidden /> {b.email}
                      </p>
                    )}
                    {b.note && (
                      <p className="col-span-full italic">“{b.note}”</p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {b.status === "NEW" && (
                      <Button
                        variant="outline" size="sm"
                        disabled={busyBooking === b.id}
                        onClick={() => setBookingStatus(b, "CONTACTED")}
                      >
                        <Icon name="phone" className="h-3.5 w-3.5 mr-1" aria-hidden /> Tandai Dihubungi
                      </Button>
                    )}
                    {b.status !== "CONFIRMED" && b.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary to-forest text-white"
                        disabled={busyBooking === b.id}
                        onClick={() => setBookingStatus(b, "CONFIRMED")}
                      >
                        <Icon name="check-circle-2" className="h-3.5 w-3.5 mr-1" aria-hidden /> Konfirmasi
                      </Button>
                    )}
                    {b.status !== "CANCELLED" && (
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive border-destructive/40 hover:bg-destructive/10"
                        disabled={busyBooking === b.id}
                        onClick={() => setBookingStatus(b, "CANCELLED")}
                      >
                        <Icon name="ban" className="h-3.5 w-3.5 mr-1" aria-hidden /> Batalkan
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog create/edit paket */}
      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              <Icon name="package" className="h-5 w-5 text-primary" aria-hidden />
              {editing ? "Ubah Paket" : "Tambah Paket Baru"}
            </DialogTitle>
            <DialogDescription className="text-left">
              Paket tampil publik di #/paket bila status Terbit dan masih ada slot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Anggota Penyelenggara *</Label>
                <select
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                  required
                >
                  {members.length === 0 && <option value="">— memuat anggota… —</option>}
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.city})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Paket *</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {TYPES.map((tp) => (
                    <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Judul Paket *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Paket Umroh Reguler 9 Hari — Keberangkatan Jakarta"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Harga (IDR) *</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Durasi (hari)</Label>
                <Input type="number" min={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slot *</Label>
                <Input type="number" min={1} value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Keberangkatan</Label>
                <Input type="date" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Kota Berangkat</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Jakarta" />
              </div>
              <div className="space-y-1.5">
                <Label>Hotel Makkah</Label>
                <Input value={form.hotelMakkah} onChange={(e) => setForm({ ...form, hotelMakkah: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Hotel Madinah</Label>
                <Input value={form.hotelMadinah} onChange={(e) => setForm({ ...form, hotelMadinah: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Maskapai</Label>
                <Input value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} placeholder="Garuda Indonesia" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  <option value="PUBLISHED">Terbit</option>
                  <option value="DRAFT">Draf</option>
                  <option value="CLOSED">Ditutup</option>
                </select>
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                  Paket Unggulan
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Deskripsi & Fasilitas *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Termasuk: visa, tiket PP, hotel bintang 4, makan 3×, transportasi AC, tour leader, manasik guide…"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Batal</Button>
              <Button type="submit" disabled={saving || members.length === 0} className="bg-gradient-to-r from-primary to-forest text-white">
                {saving ? (
                  <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden /> Menyimpan…</>
                ) : (
                  <><Icon name="save" className="h-4 w-4 mr-1.5" aria-hidden /> Simpan Paket</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus paket ini?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” beserta seluruh booking-nya akan dihapus permanen.
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
