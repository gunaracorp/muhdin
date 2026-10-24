"use client";

/**
 * Task 18-d — CMS "Log Aktivitas" (khusus SUPER_ADMIN; menu sudah meng-gate).
 * Tabel jejak audit terbaru dari GET /api/audit?take=200 — tampil 100 baris
 * dalam area scroll, dengan filter aksi dan tombol muat ulang.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, formatDateTime } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { AuditLogItem } from "@/lib/types";

const ACTION_OPTS = [
  "LOGIN", "CREATE", "UPDATE", "DELETE", "APPROVE",
  "REJECT", "EXPORT", "PROCESSED", "CLOSED", "SYNC",
];

/** Kombinasi warna token aman light+dark (hasil audit kontras Task 16). */
const ACTION_STYLES: Record<string, string> = {
  LOGIN: "bg-primary/10 text-primary border-primary/30",
  CREATE: "bg-primary/10 text-primary border-primary/30",
  UPDATE: "bg-gold/15 text-gold-deep border-gold/40",
  DELETE: "bg-destructive/10 text-destructive border-destructive/30",
  APPROVE: "bg-primary/10 text-primary border-primary/30",
  REJECT: "bg-destructive/10 text-destructive border-destructive/30",
  EXPORT: "bg-muted text-muted-foreground border-border",
  PROCESSED: "bg-gold/15 text-gold-deep border-gold/40",
  CLOSED: "bg-muted text-muted-foreground border-border",
  SYNC: "bg-primary/10 text-primary border-primary/30",
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-gold/15 text-gold-deep border-gold/40",
  ADMIN: "bg-primary/10 text-primary border-primary/30",
  VERIFIKATOR: "bg-primary/10 text-primary border-primary/30",
  EDITOR: "bg-muted text-muted-foreground border-border",
};

export function AdminAudit() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[] | null>(null);
  const [action, setAction] = useState("all");
  const [reloading, setReloading] = useState(false);

  const load = useCallback(async (showToast = false) => {
    setReloading(true);
    try {
      const data = await apiGet<AuditLogItem[]>("/api/audit?take=200");
      setLogs(data);
      if (showToast) toast({ title: "Log dimuat ulang ✓", description: `${data.length} entri terbaru.` });
    } catch (e) {
      toast({ title: "Gagal memuat log", description: (e as Error).message, variant: "destructive" });
      setLogs([]);
    } finally {
      setReloading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = logs || [];
    const withAction = action === "all" ? list : list.filter((l) => l.action === action);
    return withAction.slice(0, 100);
  }, [logs, action]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            Log Aktivitas
            <Badge variant="outline" className="text-[10px] font-bold bg-gold/15 text-gold-deep border-gold/40">
              Super Admin
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Jejak audit tindakan admin — 100 entri terakhir dari {(logs || []).length} yang dimuat.
          </p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-44 h-9" aria-label="Filter aksi log">
              <SelectValue placeholder="Semua Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              {ACTION_OPTS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={() => void load(true)} disabled={reloading}>
            <Icon name="refresh" className={`h-4 w-4 mr-1.5 ${reloading ? "animate-spin" : ""}`} aria-hidden />
            Muat Ulang
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {!logs ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="activity" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada aktivitas tercatat pada filter ini.</p>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="w-36">Waktu</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                  <TableHead className="hidden md:table-cell">Entitas</TableHead>
                  <TableHead className="hidden lg:table-cell">Detail</TableHead>
                  <TableHead className="hidden md:table-cell">ID Entitas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="hover:bg-primary/[0.03] align-top">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(l.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold truncate max-w-[160px]">{l.userName || "—"}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-[9px] font-bold ${ROLE_STYLES[l.role] || "bg-muted text-muted-foreground border-border"}`}
                      >
                        {l.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${ACTION_STYLES[l.action] || "bg-muted text-muted-foreground border-border"}`}
                      >
                        {l.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{l.entity}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{l.detail || "—"}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-[10px] text-muted-foreground">{l.entityId || "—"}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
