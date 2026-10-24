"use client";

/**
 * AI Content Studio (v4.0) — redaksi superpowers untuk admin MUHDIN.
 *
 * Ubah satu topik menjadi draf artikel lengkap (judul + excerpt + konten
 * Markdown) lewat mesin AI di server (POST /api/ai/ghostwrite, dilindungi
 * guardAdmin). Hasil selalu disimpan sebagai DRAFT — manusia tetap redaktur
 * akhir: tinjau, sunting bila perlu, lalu terbitkan dari modul Berita.
 *
 * Alur: isi topik → (opsional) kata kunci/gaya/bahasa → ✨ Generate →
 * pratinjau → "Simpan sebagai Draft" (POST /api/articles) atau salin Markdown.
 */

import { useState } from "react";
import { apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_OPTS = ["Berita", "Pengumuman", "Artikel", "Press Release", "Edukasi", "Ekosistem", "Agenda"];
const TONE_OPTS = ["Profesional", "Hangat & Persuasif", "Jurnalistik", "Informatif Santai", "Formal Resmi"];

type DraftResult = { title: string; excerpt: string; content: string; category: string };

export function AdminAiStudio() {
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Berita");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("Profesional");
  const [language, setLanguage] = useState("id");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState<DraftResult | null>(null);

  const generate = async () => {
    if (topic.trim().length < 5) {
      toast({ title: "Topik terlalu pendek", description: "Tuliskan topik minimal 5 karakter.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setDraft(null);
    try {
      const d = await apiSend<DraftResult>("/api/ai/ghostwrite", "POST", {
        topic,
        category,
        keywords,
        tone,
        language,
      });
      setDraft(d);
      toast({ title: "Draf siap ✓", description: "AI menyelesaikan draf — tinjau lalu simpan sebagai Draft." });
    } catch (e) {
      toast({ title: "Gagal generate", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const saveAsDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await apiSend<{ id: string }>("/api/articles", "POST", {
        ...draft,
        author: "AI Content Studio",
        status: "DRAFT",
        featured: false,
      });
      toast({
        title: "Tersimpan sebagai Draft ✓",
        description: "Buka modul “Berita & Artikel” untuk meninjau, menyunting, dan menerbitkan.",
      });
      setDraft(null);
      setTopic("");
      setKeywords("");
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyMarkdown = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Clipboard tidak tersedia", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-deep to-primary text-white shadow-sm">
              <Icon name="sparkles" className="h-5 w-5" aria-hidden />
            </span>
            AI Content Studio
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Redaktur berbantuan AI: ubah topik mentah menjadi draf artikel terstruktur.
            Hasil <strong>selalu berstatus Draft</strong> — Anda tetap redaktur akhir sebelum terbit.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5 bg-gold/15 text-gold-deep">
          <Icon name="sparkles" className="h-3.5 w-3.5" aria-hidden />
          Didukung AI MUHDIN v4.0
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ===== Panel input ===== */}
        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="ai-topic">Topik Artikel *</Label>
            <Input
              id="ai-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Misal: Tren baru layanan umrah keluarga 2026"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Kategori artikel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bahasa</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger aria-label="Bahasa artikel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-keywords">Kata Kunci <span className="text-muted-foreground">(pisahkan dengan koma)</span></Label>
            <Input
              id="ai-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="umrah keluarga, paket hemat, musim ramai"
              maxLength={300}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Gaya Penulisan</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger aria-label="Gaya penulisan"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONE_OPTS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generate}
            disabled={generating || topic.trim().length < 5}
            className="w-full gap-2 bg-gradient-to-r from-gold-deep to-primary text-white shadow-md transition hover:opacity-90"
          >
            {generating ? (
              <>
                <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden />
                AI sedang menulis…
              </>
            ) : (
              <>
                <Icon name="sparkles" className="h-4 w-4" aria-hidden />
                Generate Draf Artikel
              </>
            )}
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            AI menulis draf — bukan keputusan redaksi. Verifikasi fakta & data resmi
            sebelum menerbitkan.
          </p>
        </div>

        {/* ===== Panel hasil ===== */}
        <div className="min-h-[420px] rounded-2xl border bg-card shadow-sm">
          {generating && (
            <div className="grid h-full min-h-[420px] place-items-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <span className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-primary/10">
                  <Icon name="sparkles" className="h-7 w-7 text-primary" aria-hidden />
                </span>
                <p className="text-sm">AI menyusun kerangka, menulis, dan merapikan…</p>
              </div>
            </div>
          )}

          {!generating && !draft && (
            <div className="grid h-full min-h-[420px] place-items-center p-8 text-center">
              <div className="max-w-sm space-y-3 text-muted-foreground">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted">
                  <Icon name="file-text" className="h-7 w-7" aria-hidden />
                </span>
                <p className="font-medium text-foreground">Belum ada draf</p>
                <p className="text-sm leading-relaxed">
                  Isi topik di panel kiri, lalu klik <strong>Generate Draf Artikel</strong>.
                  Draf akan muncul di sini untuk Anda tinjau — lengkap dengan judul,
                  ringkasan, dan konten Markdown.
                </p>
              </div>
            </div>
          )}

          {!generating && draft && (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Icon name="check-circle-2" className="h-3.5 w-3.5" aria-hidden />
                    Draf siap
                  </Badge>
                  <Badge variant="outline">{draft.category}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyMarkdown} className="gap-1.5">
                    <Icon name={copied ? "check-circle-2" : "copy"} className="h-3.5 w-3.5" aria-hidden />
                    {copied ? "Tersalin" : "Salin Markdown"}
                  </Button>
                  <Button
                    onClick={saveAsDraft}
                    disabled={saving}
                    size="sm"
                    className="gap-1.5 bg-primary text-white"
                  >
                    {saving ? (
                      <Icon name="loader-2" className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Icon name="save" className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Simpan sebagai Draft
                  </Button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5" dir="auto">
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Judul</Label>
                  <p className="text-lg font-bold leading-snug">{draft.title}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Ringkasan</Label>
                  <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed">{draft.excerpt}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Konten (Markdown)</Label>
                  <Textarea
                    value={draft.content}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    rows={14}
                    className="min-h-[280px] font-mono text-xs leading-relaxed"
                    aria-label="Konten draf artikel"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Bisa disunting langsung di sini sebelum disimpan.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
