"use client";

/**
 * v5.0 — Forum Jamaah (listing).
 * Route: #/forum
 *
 * Diskusi yang telah dimoderasi (APPROVED): filter topik, pencarian,
 * dialog "Mulai Diskusi" (terkirim → PENDING moderasi), kartu thread
 * dengan jumlah balasan & penayangan, tautan ke detail thread.
 */

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend, timeAgo } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ForumThreadItem } from "@/lib/types";
import { DetailHero, DetailSectionHead } from "@/components/views/detail-shell";

const CATEGORIES = ["Manasik", "Dokumen", "Perjalanan", "Akomodasi", "Biaya", "Lainnya"] as const;

export function ForumView() {
  const { t } = useT();
  const [threads, setThreads] = useState<ForumThreadItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("ALL");

  // dialog diskusi baru
  const [open, setOpen] = useState(false);
  const [fName, setFName] = useState("");
  const [fContact, setFContact] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fCat, setFCat] = useState<string>("Manasik");
  const [fBody, setFBody] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiGet<ForumThreadItem[]>("/api/forum")
      .then(setThreads)
      .catch(() => setThreads([]));
  }, []);

  const catLabel = (c: string) => {
    const map: Record<string, string> = {
      Manasik: "catManasik", Dokumen: "catDokumen", Perjalanan: "catPerjalanan",
      Akomodasi: "catAkomodasi", Biaya: "catBiaya", Lainnya: "catLainnya",
    };
    return t(`forum.${map[c] ?? "catLainnya"}`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (threads ?? []).filter((x) => {
      const okCat = cat === "ALL" || x.category === cat;
      const hay = `${x.title} ${x.body} ${x.authorName}`.toLowerCase();
      return okCat && (!q || hay.includes(q));
    });
  }, [threads, query, cat]);

  const submitThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (fName.trim().length < 3) return setFormError(t("paket.nameErr"));
    if (fTitle.trim().length < 8) return setFormError(t("forum.fTitlePlaceholder"));
    if (fBody.trim().length < 20) return setFormError(t("forum.fBodyPlaceholder"));

    setSending(true);
    try {
      await apiSend("/api/forum", "POST", {
        title: fTitle.trim(),
        body: fBody.trim(),
        authorName: fName.trim(),
        authorContact: fContact.trim(),
        category: fCat,
      });
      setSuccess(true);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setFName(""); setFContact(""); setFTitle(""); setFBody(""); setFormError(""); setSuccess(false);
  };

  return (
    <div className="flex flex-col">
      <DetailHero
        eyebrow={t("forum.eyebrow")}
        title={t("forum.title")}
        subtitle={t("forum.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
      >
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button
            size="lg"
            onClick={() => { setOpen(true); resetForm(); }}
            className="h-12 bg-gradient-to-r from-gold-deep to-gold text-forest-deep shadow-lg hover:brightness-105"
          >
            <Icon name="message-square" className="mr-2 h-4.5 w-4.5" aria-hidden />
            {t("forum.newThread")}
          </Button>
        </div>
      </DetailHero>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Pencarian */}
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute start-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("forum.searchPlaceholder")}
              aria-label={t("forum.searchAria")}
              className="h-12 rounded-2xl border-border ps-11 text-sm shadow-sm focus-visible:ring-gold/40"
            />
          </div>

          {/* Filter topik */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("forum.catAria")}>
            <button
              type="button"
              onClick={() => setCat("ALL")}
              aria-pressed={cat === "ALL"}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                cat === "ALL" ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
              )}
            >
              {t("forum.allCat")}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  cat === c ? "bg-primary text-white shadow-md" : "border bg-card text-muted-foreground hover:text-primary"
                )}
              >
                {catLabel(c)}
              </button>
            ))}
          </div>

          {/* Aturan forum */}
          <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4 text-xs leading-relaxed text-foreground/75">
            <p className="flex items-center gap-1.5 font-bold text-gold-deep">
              <Icon name="scroll-text" className="h-3.5 w-3.5" aria-hidden />
              {t("forum.rulesTitle")}
            </p>
            <p className="mt-1">{t("forum.rules")}</p>
          </div>

          {/* Daftar thread */}
          <div className="mt-8">
            <DetailSectionHead icon="message-circle" title={`${t("forum.title")} (${filtered.length})`} />
            {!threads ? (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-4 rounded-2xl border bg-muted/30 p-10 text-center">
                <Icon name="message-circle" className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">{t("forum.empty")}</p>
                <Button
                  className="mt-4 bg-gradient-to-r from-primary to-forest text-white"
                  onClick={() => { setOpen(true); resetForm(); }}
                >
                  <Icon name="plus" className="mr-1.5 h-4 w-4" aria-hidden />
                  {t("forum.newThread")}
                </Button>
              </div>
            ) : (
              <Reveal className="mt-4 space-y-4">
                {filtered.map((th) => (
                  <article
                    key={th.id}
                    role="link"
                    tabIndex={0}
                    aria-label={th.title}
                    onClick={() => navigate(`forum/${th.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`forum/${th.id}`);
                      }
                    }}
                    className="group cursor-pointer rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-lg hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="bg-primary/10 text-[10px] font-bold text-primary border-primary/30">
                          {catLabel(th.category)}
                        </Badge>
                        {th.pinned && (
                          <Badge variant="outline" className="bg-gold/15 text-[10px] font-bold text-gold-deep border-gold/40">
                            <Icon name="star" className="h-3 w-3" aria-hidden /> {t("forum.pinned")}
                          </Badge>
                        )}
                        {th.status === "LOCKED" && (
                          <Badge variant="outline" className="bg-muted text-[10px] font-bold text-muted-foreground border-border">
                            <Icon name="lock" className="h-3 w-3" aria-hidden /> {t("forum.locked")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-2.5 text-base font-extrabold leading-snug group-hover:text-primary transition-colors">
                      {th.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{th.body}</p>
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-black text-primary" aria-hidden>
                          {th.authorName.charAt(0).toUpperCase()}
                        </span>
                        {t("forum.startedBy")} <b className="text-foreground/80">{th.authorName}</b>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="message-square" className="h-3.5 w-3.5" aria-hidden />
                        {th.replyCount ?? 0} {t("forum.replies")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="eye" className="h-3.5 w-3.5" aria-hidden />
                        {th.views} {t("forum.views")}
                      </span>
                      <span className="ms-auto flex items-center gap-1.5">
                        <Icon name="clock" className="h-3.5 w-3.5" aria-hidden />
                        {timeAgo(th.createdAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* Dialog: Mulai diskusi baru */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-left flex items-center gap-2">
              <Icon name="message-square" className="h-5 w-5 text-primary" aria-hidden />
              {t("forum.newTitle")}
            </DialogTitle>
            <DialogDescription className="text-left">{t("forum.newDesc")}</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15">
                <Icon name="check-circle-2" className="h-7 w-7 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-extrabold">{t("forum.fSuccessTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("forum.fSuccessDesc")}</p>
              <Button
                className="mt-5 bg-gradient-to-r from-primary to-forest text-white"
                onClick={() => { setOpen(false); resetForm(); }}
              >
                {t("common.back")}
              </Button>
            </div>
          ) : (
            <form onSubmit={submitThread} className="space-y-3.5">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fd-name">{t("forum.fName")} *</Label>
                  <Input id="fd-name" value={fName} onChange={(e) => setFName(e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fd-cat">{t("forum.fCategory")}</Label>
                  <select
                    id="fd-cat"
                    value={fCat}
                    onChange={(e) => setFCat(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{catLabel(c)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fd-contact">{t("forum.fContact")}</Label>
                <Input id="fd-contact" value={fContact} onChange={(e) => setFContact(e.target.value)} className="h-10" />
                <p className="text-[11px] text-muted-foreground">{t("forum.fContactHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fd-title">{t("forum.fTitle")} *</Label>
                <Input id="fd-title" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder={t("forum.fTitlePlaceholder")} required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fd-body">{t("forum.fBody")} *</Label>
                <Textarea id="fd-body" value={fBody} onChange={(e) => setFBody(e.target.value)} rows={4} placeholder={t("forum.fBodyPlaceholder")} required />
              </div>

              {formError && (
                <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <Icon name="alert-triangle" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {formError}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {t("common.back")}
                </Button>
                <Button type="submit" disabled={sending} className="bg-gradient-to-r from-primary to-forest text-white">
                  {sending ? (
                    <>
                      <Icon name="loader-2" className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                      {t("forum.fSubmitting")}
                    </>
                  ) : (
                    <>
                      <Icon name="send" className="mr-1.5 h-4 w-4" aria-hidden />
                      {t("forum.fSubmit")}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
