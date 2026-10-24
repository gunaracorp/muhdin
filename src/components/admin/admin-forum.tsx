"use client";

/**
 * v5.0 — CMS "Forum Jamaah": moderasi diskusi.
 * Tab 1 Thread  : Setujui (APPROVED → tampil publik), Tolak (REJECTED),
 *                 Kunci/Buka (LOCKED), Sematkan lepas (pinned), hapus.
 * Tab 2 Balasan : antrean balasan PENDING — Setujui/Tolak/Hapus.
 * Setiap aksi tercatat di AuditLog (server-side).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ForumThreadItem, ForumReplyItem } from "@/lib/types";

const THREAD_STATUS: Record<string, string> = {
  PENDING: "Menunggu", APPROVED: "Disetujui", REJECTED: "Ditolak", LOCKED: "Terkunci",
};

function ThreadBadge({ status }: { status: string }) {
  const cls =
    status === "APPROVED"
      ? "bg-primary/10 text-primary border-primary/30"
      : status === "PENDING"
        ? "bg-gold/15 text-gold-deep border-gold/40"
        : status === "LOCKED"
          ? "bg-muted text-muted-foreground border-border"
          : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <Badge variant="outline" className={`text-[10px] font-bold ${cls}`}>
      {THREAD_STATUS[status] || status}
    </Badge>
  );
}

export function AdminForum() {
  const { toast } = useToast();
  const [threads, setThreads] = useState<ForumThreadItem[] | null>(null);
  const [replies, setReplies] = useState<ForumReplyItem[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [viewing, setViewing] = useState<ForumThreadItem | null>(null);
  const [deleting, setDeleting] = useState<null | { kind: "thread" | "reply"; id: string; label: string }>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<{ threads: ForumThreadItem[]; pendingReplies: ForumReplyItem[] }>("/api/forum-moderation")
      .then((d) => {
        setThreads(d.threads);
        setReplies(d.pendingReplies);
      })
      .catch(() => {
        setThreads([]);
        setReplies([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchThread = async (th: ForumThreadItem, data: Record<string, unknown>, okTitle: string, okDesc: string) => {
    setBusy(th.id);
    try {
      await apiSend(`/api/forum/${th.id}`, "PUT", data);
      toast({ title: okTitle, description: okDesc });
      setViewing(null);
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const patchReply = async (r: ForumReplyItem, status: string) => {
    setBusy(r.id);
    try {
      await apiSend(`/api/forum-replies/${r.id}`, "PUT", { status });
      toast({ title: status === "APPROVED" ? "Balasan disetujui ✓" : "Balasan ditolak", description: r.authorName });
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
      const url = deleting.kind === "thread" ? `/api/forum/${deleting.id}` : `/api/forum-replies/${deleting.id}`;
      await apiSend(url, "DELETE");
      toast({ title: "Dihapus permanen ✓", description: deleting.label });
      setViewing(null);
      load();
    } catch (err) {
      toast({ title: "Gagal menghapus", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const list = threads || [];
  const pendingCount = list.filter((x) => x.status === "PENDING").length;
  const replyQueue = replies || [];

  const filters = [
    { value: "all", label: "Semua" },
    { value: "PENDING", label: `Menunggu (${pendingCount})` },
    { value: "APPROVED", label: "Disetujui" },
    { value: "LOCKED", label: "Terkunci" },
    { value: "REJECTED", label: "Ditolak" },
  ];
  const filtered = list.filter((x) => filter === "all" || x.status === filter);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          Forum Jamaah
          {(pendingCount + replyQueue.length) > 0 && (
            <Badge className="danger-solid">{pendingCount + replyQueue.length} menunggu moderasi</Badge>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          Moderasi diskusi jamaah sebelum tampil publik — setiap aksi tercatat di log audit.
        </p>
      </div>

      <Tabs defaultValue="threads">
        <TabsList className="mb-4">
          <TabsTrigger value="threads" className="gap-1.5">
            <Icon name="message-square" className="h-3.5 w-3.5" aria-hidden /> Thread ({list.length})
          </TabsTrigger>
          <TabsTrigger value="replies" className="gap-1.5">
            <Icon name="message-circle" className="h-3.5 w-3.5" aria-hidden /> Balasan ({replyQueue.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB THREAD ===== */}
        <TabsContent value="threads">
          <div className="flex flex-wrap gap-2 mb-4">
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

          {!threads ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="message-square" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Tidak ada thread pada filter ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setViewing(th)}
                  className={cn(
                    "min-w-0 w-full text-left rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40",
                    th.status === "PENDING" && "border-l-4 border-l-gold"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="bg-primary/10 text-[10px] font-bold text-primary border-primary/30">
                          {th.category}
                        </Badge>
                        {th.pinned && (
                          <Badge variant="outline" className="bg-gold/15 text-[10px] font-bold text-gold-deep border-gold/40">
                            <Icon name="star" className="h-3 w-3" aria-hidden /> Disematkan
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 truncate font-bold">{th.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {th.authorName} · {formatDateTime(th.createdAt)} · {th.views} dilihat
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <ThreadBadge status={th.status} />
                      {th.pendingReplies > 0 && (
                        <Badge className="danger-solid text-[10px]">{th.pendingReplies} balasan</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">{th.body}</p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB BALASAN ===== */}
        <TabsContent value="replies">
          {!replies ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : replyQueue.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 text-center shadow-sm">
              <Icon name="message-circle" className="h-10 w-10 mx-auto text-muted-foreground/30" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">Antrean balasan kosong — semua sudah dimoderasi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {replyQueue.map((r) => (
                <div key={r.id} className="rounded-2xl border border-l-4 border-l-gold bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">
                        Pada thread: <b className="text-foreground/80">{r.threadTitle}</b>
                        {r.threadStatus === "LOCKED" && " (terkunci)"}
                      </p>
                      <p className="mt-1 text-sm font-bold">{r.authorName}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">{r.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="bg-gradient-to-r from-primary to-forest text-white" disabled={busy === r.id} onClick={() => patchReply(r, "APPROVED")}>
                      <Icon name="check-circle-2" className="h-3.5 w-3.5 mr-1" aria-hidden /> Setujui
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy === r.id} onClick={() => patchReply(r, "REJECTED")}>
                      <Icon name="ban" className="h-3.5 w-3.5 mr-1" aria-hidden /> Tolak
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto"
                      onClick={() => setDeleting({ kind: "reply", id: r.id, label: `balasan ${r.authorName}` })}
                    >
                      <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog detail thread */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              <Icon name="message-square" className="h-5 w-5 text-primary" aria-hidden />
              {viewing?.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              {viewing?.authorName} · {viewing?.category} · {viewing ? formatDateTime(viewing.createdAt) : ""}
              {viewing?.authorContact ? ` · kontak: ${viewing.authorContact}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <>
              <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {viewing.body}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ThreadBadge status={viewing.status} />
                <span className="text-xs text-muted-foreground">
                  {viewing.views} dilihat · {viewing.pendingReplies ?? 0} balasan menunggu
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {viewing.status !== "APPROVED" && (
                  <Button
                    size="sm" className="bg-gradient-to-r from-primary to-forest text-white"
                    disabled={busy === viewing.id}
                    onClick={() => patchThread(viewing, { status: "APPROVED" }, "Thread disetujui ✓", "Kini tampil di #/forum.")}
                  >
                    <Icon name="check-circle-2" className="h-3.5 w-3.5 mr-1" aria-hidden /> Setujui
                  </Button>
                )}
                {viewing.status !== "REJECTED" && viewing.status !== "LOCKED" && (
                  <Button variant="outline" size="sm" disabled={busy === viewing.id}
                    onClick={() => patchThread(viewing, { status: "REJECTED" }, "Thread ditolak", "Tidak akan tampil publik.")}>
                    <Icon name="ban" className="h-3.5 w-3.5 mr-1" aria-hidden /> Tolak
                  </Button>
                )}
                {viewing.status === "APPROVED" && !viewing.status.includes("LOCK") && (
                  <Button variant="outline" size="sm" disabled={busy === viewing.id}
                    onClick={() => patchThread(viewing, { status: "LOCKED" }, "Thread dikunci", "Tidak menerima balasan baru.")}>
                    <Icon name="lock" className="h-3.5 w-3.5 mr-1" aria-hidden /> Kunci
                  </Button>
                )}
                {viewing.status === "LOCKED" && (
                  <Button variant="outline" size="sm" disabled={busy === viewing.id}
                    onClick={() => patchThread(viewing, { status: "APPROVED" }, "Thread dibuka", "Kembali menerima balasan.")}>
                    <Icon name="refresh" className="h-3.5 w-3.5 mr-1" aria-hidden /> Buka
                  </Button>
                )}
                <Button variant="outline" size="sm" disabled={busy === viewing.id}
                  onClick={() => patchThread(viewing, { pinned: !viewing.pinned }, viewing.pinned ? "Sematan dilepas" : "Thread disematkan ✓", viewing.title)}>
                  <Icon name="star" className="h-3.5 w-3.5 mr-1" aria-hidden /> {viewing.pinned ? "Lepas Sematan" : "Sematkan"}
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10 sm:ml-auto"
                  onClick={() => setDeleting({ kind: "thread", id: viewing.id, label: `thread "${viewing.title}"` })}
                >
                  <Icon name="trash" className="h-3.5 w-3.5 mr-1" aria-hidden /> Hapus
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleting?.kind === "thread" ? "thread" : "balasan"} ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.label} akan dihapus permanen. Tindakan ini tercatat di log audit.
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
