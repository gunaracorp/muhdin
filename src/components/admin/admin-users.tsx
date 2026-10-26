"use client";

/**
 * AdminUsers (Task 15-c) — Kelola Admin: CRUD akun admin oleh SUPER_ADMIN.
 * Perlindungan: tidak bisa mengubah peran/status/menghapus diri sendiri;
 * Super Admin aktif terakhir dijaga (validasi ganda di server).
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, timeAgo } from "@/lib/client-api";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AdminUser } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-primary/10 text-primary border-primary/30",
  ADMIN: "bg-gold/15 text-gold-deep border-gold/40",
  VERIFIKATOR: "bg-emerald-100 text-emerald-900 border-emerald-300/60 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-700",
  EDITOR: "bg-muted text-muted-foreground border-transparent",
};

const ROLE_OPTS = [
  { value: "ADMIN", label: "Admin", desc: "Akses seluruh modul operasional" },
  { value: "VERIFIKATOR", label: "Verifikator", desc: "Fokus verifikasi pendaftaran & anggota" },
  { value: "EDITOR", label: "Editor", desc: "Fokus pengelolaan konten" },
];

export function AdminUsers({ meId }: { meId: string }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busyId, setBusyId] = useState<string>("");

  // Dialog tambah
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EDITOR" });
  const [adding, setAdding] = useState(false);

  // Dialog edit (nama/peran + reset password)
  const [edit, setEdit] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("EDITOR");
  const [editPass, setEditPass] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    apiGet<AdminUser[]>("/api/users").then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    setAdding(true);
    try {
      await apiSend("/api/users", "POST", form);
      toast({ title: "Admin ditambahkan ✓", description: `${form.name} kini dapat login ke CMS.` });
      setAddOpen(false);
      setForm({ name: "", email: "", password: "", role: "EDITOR" });
      load();
    } catch (e) {
      toast({ title: "Gagal menambahkan", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (u: AdminUser) => {
    setEdit(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditPass("");
  };

  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { name: editName, role: editRole };
      if (editPass) payload.password = editPass;
      await apiSend(`/api/users/${edit.id}`, "PATCH", payload);
      toast({
        title: "Perubahan tersimpan ✓",
        description: editPass ? `Peran diperbarui & password ${edit.name} direset.` : `Data ${editName} diperbarui.`,
      });
      setEdit(null);
      load();
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      await apiSend(`/api/users/${u.id}`, "PATCH", { isActive: !u.isActive });
      toast({
        title: u.isActive ? "Akun dinonaktifkan" : "Akun diaktifkan",
        description: u.isActive
          ? `${u.name} tidak dapat login — sesi aktifnya dicabut.`
          : `${u.name} kini dapat login kembali.`,
      });
      load();
    } catch (e) {
      toast({ title: "Gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusyId("");
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await apiSend(`/api/users/${deleteTarget.id}`, "DELETE");
      toast({ title: "Akun dihapus", description: `${deleteTarget.name} dihapus dari sistem.` });
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusyId("");
    }
  };

  if (!users)
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <Icon name="user-cog" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold">Kelola Admin</h2>
            <p className="text-sm text-muted-foreground">
              Tambah admin baru, atur peran, nonaktifkan akun, dan reset password —
              hanya Super Admin.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="sm:ml-auto shrink-0 bg-gradient-to-r from-primary to-forest text-white"
        >
          <Icon name="user-plus" className="h-4 w-4 mr-2" />
          Tambah Admin
        </Button>
      </div>

      {/* Tabel akun */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-start font-semibold px-5 py-3">Akun</th>
                <th className="text-start font-semibold px-4 py-3">Peran</th>
                <th className="text-start font-semibold px-4 py-3">Status</th>
                <th className="text-start font-semibold px-4 py-3">Login Terakhir</th>
                <th className="text-end font-semibold px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === meId;
                return (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-forest grid place-items-center text-white font-bold text-sm shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("font-bold truncate flex items-center gap-1.5", !u.isActive && "text-muted-foreground")}>
                            {u.name}
                            {self && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                ANDA
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className={cn("font-semibold", ROLE_BADGE[u.role])}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            u.isActive ? "bg-primary" : "bg-muted-foreground/50"
                          )}
                        />
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{timeAgo(u.lastLoginAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`}>
                          <Icon name="pencil" className="h-4 w-4" />
                        </Button>
                        {!self && (
                          <>
                            <Switch
                              checked={u.isActive}
                              disabled={busyId === u.id}
                              onCheckedChange={() => toggleActive(u)}
                              aria-label={`${u.isActive ? "Nonaktifkan" : "Aktifkan"} ${u.name}`}
                              className="mx-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(u)}
                              aria-label={`Hapus ${u.name}`}
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog tambah admin */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="user-plus" className="h-5 w-5 text-primary" />
              Tambah Admin Baru
            </DialogTitle>
            <DialogDescription>
              Akun akan langsung dapat login ke CMS MUHDIN dengan peran yang dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="ua-name">Nama Lengkap</Label>
              <Input id="ua-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth. Ustadz Ahmad" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ua-email">Email</Label>
              <Input id="ua-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@muhdin.web.id" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ua-pass">Password Awal</Label>
              <Input id="ua-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" />
            </div>
            <div className="space-y-1.5">
              <Label>Peran</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="font-semibold">{r.label}</span>
                      <span className="block text-xs text-muted-foreground">{r.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={add} disabled={adding} className="bg-gradient-to-r from-primary to-forest text-white">
              {adding ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="plus" className="h-4 w-4 mr-2" />}
              Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog edit / reset password */}
      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="pencil" className="h-5 w-5 text-primary" />
              Edit Akun — {edit?.name}
            </DialogTitle>
            <DialogDescription>{edit?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="ue-name">Nama</Label>
              <Input id="ue-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            {edit && edit.id !== meId && (
              <div className="space-y-1.5">
                <Label>Peran</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="font-semibold">{r.label}</span>
                        <span className="block text-xs text-muted-foreground">{r.desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="ue-pass">Reset Password <span className="text-muted-foreground font-normal">(kosongkan bila tidak diubah)</span></Label>
              <Input id="ue-pass" type="password" value={editPass} onChange={(e) => setEditPass(e.target.value)} placeholder="••••••••" />
              {editPass && editPass.length < 8 && (
                <p className="text-xs text-destructive">Minimal 8 karakter.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Batal</Button>
            <Button onClick={saveEdit} disabled={saving || (Boolean(editPass) && editPass.length < 8)} className="bg-gradient-to-r from-primary to-forest text-white">
              {saving ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="save" className="h-4 w-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <b>{deleteTarget?.email}</b> akan dihapus permanen dan seluruh sesi
              login-nya dicabut. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="danger-solid">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
