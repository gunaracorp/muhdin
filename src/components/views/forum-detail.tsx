"use client";

/**
 * v5.0 — Detail thread forum + balasan (moderasi).
 * Route: #/forum/<id>
 *
 * Thread APPROVED/LOCKED tampil dengan seluruh balasan APPROVED. Form balasan
 * publik → status PENDING (toast konfirmasi). Thread terkunci menampilkan
 * banner dan menonaktifkan form.
 */

import { useEffect, useState } from "react";
import { apiGet, apiSend, formatDateTime } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { ForumReplyItem } from "@/lib/types";
import { DetailNotFound, DetailSectionHead, WaCtaButton } from "@/components/views/detail-shell";

interface ThreadDetail {
  thread: {
    id: string;
    title: string;
    body: string;
    authorName: string;
    category: string;
    status: string;
    pinned: boolean;
    views: number;
    createdAt: string;
  };
  replies: ForumReplyItem[];
}

export function ForumDetail({ id }: { id: string }) {
  const { t } = useT();
  const { toast } = useToast();
  const [data, setData] = useState<ThreadDetail | null>(null);
  const [failed, setFailed] = useState(false);

  const [rName, setRName] = useState("");
  const [rBody, setRBody] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    apiGet<ThreadDetail>(`/api/forum/${id}`)
      .then(setData)
      .catch(() => setFailed(true));
  };

  useEffect(() => {
    load();
  }, [id]);

  const catLabel = (c: string) => {
    const map: Record<string, string> = {
      Manasik: "catManasik", Dokumen: "catDokumen", Perjalanan: "catPerjalanan",
      Akomodasi: "catAkomodasi", Biaya: "catBiaya", Lainnya: "catLainnya",
    };
    return t(`forum.${map[c] ?? "catLainnya"}`);
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (rName.trim().length < 3) return setFormError(t("paket.nameErr"));
    if (rBody.trim().length < 10) return setFormError(t("forum.replyBodyPlaceholder"));

    setSending(true);
    try {
      await apiSend(`/api/forum/${id}/replies`, "POST", {
        authorName: rName.trim(),
        body: rBody.trim(),
      });
      toast({ title: t("forum.replySuccessTitle"), description: t("forum.replySuccessDesc") });
      setRBody("");
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (failed) {
    return <DetailNotFound message={t("forum.notFound")} backTo="/forum" backLabel={t("forum.back")} />;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 sm:px-6" aria-busy="true">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  const th = data.thread;
  const locked = th.status === "LOCKED";

  return (
    <div className="flex flex-col">
      <section className="bg-forest-deep py-12 text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("forum")}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100/80 transition hover:text-gold"
          >
            <Icon name="chevron-right" className="h-3.5 w-3.5 rotate-180 rtl:rotate-0" aria-hidden />
            {t("forum.back")}
          </button>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="bg-white/10 text-[11px] font-bold text-gold border-gold/40">
              {catLabel(th.category)}
            </Badge>
            {th.pinned && (
              <Badge variant="outline" className="bg-gold/20 text-[11px] font-bold text-gold border-gold/50">
                <Icon name="star" className="h-3 w-3" aria-hidden /> {t("forum.pinned")}
              </Badge>
            )}
            {locked && (
              <Badge variant="outline" className="bg-red-400/15 text-[11px] font-bold text-red-200 border-red-300/40">
                <Icon name="lock" className="h-3 w-3" aria-hidden /> {t("forum.locked")}
              </Badge>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold leading-snug sm:text-3xl">{th.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/80">
            <span className="flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[9px] font-black" aria-hidden>
                {th.authorName.charAt(0).toUpperCase()}
              </span>
              {t("forum.startedBy")} <b className="text-white">{th.authorName}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="clock" className="h-3.5 w-3.5" aria-hidden />
              {formatDateTime(th.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="eye" className="h-3.5 w-3.5" aria-hidden />
              {th.views} {t("forum.views")}
            </span>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
          {/* Isi thread */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{th.body}</p>
          </div>

          {locked && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold-deep">
              <Icon name="lock" className="h-4 w-4 shrink-0" aria-hidden />
              {t("forum.lockedDesc")}
            </div>
          )}

          {/* Balasan */}
          <div>
            <DetailSectionHead icon="message-circle" title={`${t("forum.replies")} (${data.replies.length})`} />
            {data.replies.length === 0 ? (
              <div className="mt-3 rounded-2xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                {t("forum.empty")}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {data.replies.map((r, i) => (
                  <div key={r.id} className="flex gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-forest text-xs font-extrabold text-gold-soft" aria-hidden>
                      {r.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-xs">
                        <b className="text-sm text-foreground">{r.authorName}</b>
                        <span className="text-muted-foreground">#{i + 1}</span>
                        <span className="ms-auto text-[11px] text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form balasan */}
          {!locked && (
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Icon name="message-square" className="h-5 w-5 text-primary" aria-hidden />
                {t("forum.replyTitle")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("forum.replyPendingNote")}</p>
              <form onSubmit={submitReply} className="mt-4 space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="fr-name">{t("forum.replyName")} *</Label>
                  <Input id="fr-name" value={rName} onChange={(e) => setRName(e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fr-body">{t("forum.replyBody")} *</Label>
                  <Textarea id="fr-body" value={rBody} onChange={(e) => setRBody(e.target.value)} rows={3} placeholder={t("forum.replyBodyPlaceholder")} required />
                </div>
                {formError && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <Icon name="alert-triangle" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {formError}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <WaCtaButton message={`Assalamu'alaikum, saya ingin berkontribusi pada diskusi "${th.title}" di Forum MUHDIN.`} />
                  <Button type="submit" disabled={sending} className="bg-gradient-to-r from-primary to-forest text-white">
                    {sending ? (
                      <>
                        <Icon name="loader-2" className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                        {t("forum.replySubmitting")}
                      </>
                    ) : (
                      <>
                        <Icon name="send" className="mr-1.5 h-4 w-4" aria-hidden />
                        {t("forum.replySubmit")}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
