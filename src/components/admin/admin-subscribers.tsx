"use client";

/**
 * Task 18-d — CMS "Pelanggan Berita" (newsletter).
 * Tabel sederhana pelanggan: email, tanggal bergabung, switch aktif/nonaktif
 * (PUT /api/subscribers/[id] {isActive}), hapus (AlertDialog), dan ekspor CSV.
 * Modul ini hanya untuk SUPER_ADMIN & ADMIN (lihat SECTION_ROLES).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ExportCsvButton } from "@/components/admin/admin-sections";
import type { SubscriberItem } from "@/lib/types";

export function AdminSubscribers() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<SubscriberItem[] | null>(null);
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<SubscriberItem | null>(null);

  const load = useCallback(() => {
    apiGet<SubscriberItem[]>("/api/subscribers").then(setSubscribers).catch(() => setSubscribers([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (s: SubscriberItem, isActive: boolean) => {
    try {
      await apiSend(`/api/subscribers/${s.id}`, "PUT", { isActive });
      setSubscribers((prev) => (prev || []).map((it) => (it.id === s.id ? { ...it, isActive } : it)));
      toast({
        title: isActive ? "Pelanggan diaktifkan ✓" : "Pelanggan dinonaktifkan",
        description: s.email,
      });
    } catch (e) {
      toast({ title: "Gagal memperbarui", description: (e as Error).message, variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiSend(`/api/subscribers/${deleting.id}`, "DELETE");
      toast({ title: "Pelanggan dihapus ✓", description: deleting.email });
      load();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const lq = q.trim().toLowerCase();
  const filtered = (subscribers || []).filter(
    (s) => !lq || s.email.toLowerCase().includes(lq)
  );
  const activeCount = (subscribers || []).filter((s) => s.isActive).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl font-extrabold">Pelanggan Berita</h2>
          <p className="text-sm text-muted-foreground">
            Daftar pelanggan newsletter — {activeCount} aktif dari {(subscribers || []).length} total.
          </p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari email…"
              aria-label="Cari pelanggan"
              className="pl-9 h-9"
            />
          </div>
          <ExportCsvButton type="subscribers" />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {!subscribers ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="mail" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">
              {q ? "Tidak ada pelanggan yang cocok dengan pencarian." : "Belum ada pelanggan newsletter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin max-h-[62vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal Bergabung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-24">Aktif</TableHead>
                  <TableHead className="text-right w-16">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="hover:bg-primary/[0.03]">
                    <TableCell className="text-sm font-medium">{s.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {formatDateTime(s.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${s.isActive ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
                      >
                        {s.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={s.isActive}
                        onCheckedChange={(v) => toggle(s, v)}
                        aria-label={`Aktifkan pelanggan ${s.email}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleting(s)}
                        aria-label={`Hapus pelanggan ${s.email}`}
                      >
                        <Icon name="trash" className="h-3.5 w-3.5 text-destructive" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pelanggan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.email} akan dihapus permanen dan tidak lagi menerima berita dari MUHDIN.
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
