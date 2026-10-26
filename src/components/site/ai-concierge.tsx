"use client";

/**
 * SahabatMUHDIN Pro (v5 Fase 2) — AI Concierge dengan streaming.
 *
 * Upgrade dari v4:
 *  - STREAMING: jawaban mengalir langsung (SSE dari /api/ai/chat) — teks
 *    tumbuh token-per-token dengan kursor berkedip, bukan menunggu utuh.
 *  - Badge "PRO" di header; disclaimer ringan di bawah input.
 *  - Tetap 3 bahasa (id/en/ar) mengikuti LocaleProvider, RTL-aware.
 *  - Riwayat tersimpan localStorage (muhdin-ai-chat, 20 pesan).
 *  - Aksesibilitas penuh (aria, esc, fokus otomatis), hydration-aman.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Icon } from "@/components/site/icon";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "muhdin-ai-chat";
const MAX_STORED = 20;

const COPY = {
  id: {
    title: "Sahabat MUHDIN",
    subtitle: "Concierge Pro — pintar & online 24 jam",
    badge: "PRO",
    welcome:
      "Assalamu'alaikum! 👋\n\nSaya **Sahabat MUHDIN Pro**, pendamping digital perjalanan ibadah Anda. Saya paham data portal secara langsung — silakan tanya seputar haji, umrah, manasik, anggota terverifikasi, atau agenda kegiatan.",
    placeholder: "Tanya apa saja tentang haji & umrah…",
    suggestions: [
      "Berapa anggota terverifikasi MUHDIN?",
      "Apa perbedaan haji dan umrah?",
      "Checklist perlengkapan umrah",
      "Agenda kegiatan terdekat",
    ],
    clear: "Bersihkan percakapan",
    error: "Maaf, koneksi terganggu. Silakan coba lagi.",
    disclaimer: "AI bisa keliru — pastikan data penting lewat halaman verifikasi resmi.",
    openAria: "Buka Sahabat MUHDIN — asisten AI",
    closeAria: "Tutup asisten AI",
    inputAria: "Tulis pertanyaan untuk Sahabat MUHDIN",
    sendAria: "Kirim pertanyaan",
    thinking: "Sahabat MUHDIN sedang menulis…",
  },
  en: {
    title: "Sahabat MUHDIN",
    subtitle: "Concierge Pro — smart & online 24/7",
    badge: "PRO",
    welcome:
      "Peace be upon you! 👋\n\nI am **Sahabat MUHDIN Pro**, your digital companion for the sacred journey. I understand live portal data — ask me anything about hajj, umrah, rituals, verified members, or upcoming events.",
    placeholder: "Ask anything about hajj & umrah…",
    suggestions: [
      "How many verified members does MUHDIN have?",
      "What is the difference between hajj and umrah?",
      "Umrah packing checklist",
      "Upcoming events",
    ],
    clear: "Clear conversation",
    error: "Sorry, connection issue. Please try again.",
    disclaimer: "AI can make mistakes — verify important info via the official verification page.",
    openAria: "Open Sahabat MUHDIN — AI assistant",
    closeAria: "Close AI assistant",
    inputAria: "Write a question for Sahabat MUHDIN",
    sendAria: "Send question",
    thinking: "Sahabat MUHDIN is typing…",
  },
  ar: {
    title: "صاحب مُهدين",
    subtitle: "كونسيرج برو — ذكي ومتصل ٢٤ ساعة",
    badge: "برو",
    welcome:
      "السلام عليكم! 👋\n\nأنا **صاحب مُهدين برو**، رفيقكم الرقمي في رحلة الإيمان. أفهم بيانات البوابة مباشرة — اسألوني عن الحج والعمرة والمناسك أو الأعضاء الموثوقين أو الفعاليات القادمة.",
    placeholder: "اسأل أي شيء عن الحج والعمرة…",
    suggestions: [
      "كم عدد الأعضاء الموثوقين في مُهدين؟",
      "ما الفرق بين الحج والعمرة؟",
      "قائمة تجهيزات العمرة",
      "الفعاليات القادمة",
    ],
    clear: "مسح المحادثة",
    error: "عذراً، حدث خلل في الاتصال. حاول مرة أخرى.",
    disclaimer: "قد يخطئ الذكاء الاصطناعي — تحقق من المعلومات المهمة عبر صفحة التحقق الرسمية.",
    openAria: "افتح صاحب مُهدين — المساعد الذكي",
    closeAria: "إغلاق المساعد الذكي",
    inputAria: "اكتب سؤالاً لصاحب مُهدين",
    sendAria: "إرسال السؤال",
    thinking: "صاحب مُهدين يكتب الآن…",
  },
} as const;

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m: Msg) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

export function SahabatMuhdin() {
  const { locale, dir } = useT();
  const c = COPY[locale];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);

  // Muat riwayat hanya setelah mount (bebas hydration mismatch).
  useEffect(() => {
    setMessages(loadHistory());
    mountedRef.current = true;
  }, []);

  // Simpan riwayat setiap berubah.
  useEffect(() => {
    if (!mountedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage penuh — abaikan */
    }
  }, [messages]);

  // Auto-scroll ke bawah saat pesan baru / token mengalir.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  // ESC menutup panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Fokus input saat panel dibuka.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  /** Perbarui isi gelembung asisten terakhir (dipakai saat streaming). */
  const patchLast = useCallback((content: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { role: "assistant", content };
      return copy;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      const withUser: Msg[] = [...messages, { role: "user", content: question }].slice(-MAX_STORED);
      const next: Msg[] = [...withUser, { role: "assistant", content: "" }];
      setMessages(next);
      setInput("");
      setBusy(true);

      const finish = (content: string) => patchLast(content || COPY[locale].error);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: withUser.slice(-12), locale }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          finish(String(data?.error || "") || COPY[locale].error);
          return;
        }

        // Baca aliran SSE: data:{"delta":"…"} … data:{"done":true}
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let acc = "";
        let replied = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            try {
              const payload = JSON.parse(line.slice(5).trim()) as {
                delta?: string;
                reply?: string;
              };
              if (typeof payload.delta === "string") {
                acc += payload.delta;
                patchLast(acc);
                replied = true;
              } else if (typeof payload.reply === "string") {
                // Fallback kompatibel: jawaban utuh.
                acc = payload.reply;
                patchLast(acc);
                replied = true;
              }
            } catch {
              /* baris tidak lengkap — abaikan */
            }
          }
        }

        if (!replied) finish("");
        else patchLast(acc.trim() || COPY[locale].error);
      } catch {
        finish("");
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, locale, patchLast]
  );

  const isEmpty = messages.length === 0;
  const chips = useMemo(() => c.suggestions, [c]);

  return (
    <>
      {/* ===== Tombol FAB (di atas WaFab) ===== */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? c.closeAria : c.openAria}
        aria-expanded={open}
        className={cn(
          "group fixed bottom-24 end-5 z-[60] flex items-center gap-0 rounded-full text-white shadow-[0_12px_32px_-8px_oklch(0.55_0.13_75/0.55)] transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
          open ? "bg-forest" : "bg-gradient-to-br from-gold-deep to-primary hover:shadow-[0_18px_40px_-10px_oklch(0.55_0.13_75/0.65)]"
        )}
      >
        <span className="grid h-14 w-14 place-items-center">
          <Icon name={open ? "x" : "sparkles"} className="h-6 w-6" aria-hidden />
        </span>
        {!open && (
          <span className="max-w-0 overflow-hidden whitespace-nowrap pe-0 text-sm font-bold tracking-wide transition-all duration-300 group-hover:max-w-44 group-hover:pe-5">
            {c.title}
          </span>
        )}
        {!open && (
          <span className="absolute -top-1 -start-1 grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[9px] font-black tracking-widest text-gold ring-2 ring-background">
            {c.badge}
          </span>
        )}
      </button>

      {/* ===== Panel Chat ===== */}
      {open && (
        <div
          dir={dir}
          role="dialog"
          aria-label={c.title}
          className="fixed inset-x-2 bottom-[10.5rem] z-[70] flex max-h-[min(34rem,65vh)] flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-[0_32px_80px_-16px_oklch(0.2_0.05_160/0.5)] sm:inset-x-auto sm:end-5 sm:w-[24.5rem]"
        >
          {/* Header */}
          <div className="relative flex items-center gap-3 bg-gradient-to-r from-forest via-primary to-forest px-4 py-3.5 text-white">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Icon name="sparkles" className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-extrabold tracking-wide">
                {c.title}
                <span className="rounded-full bg-gold/25 px-1.5 py-0.5 text-[9px] font-black tracking-widest text-gold ring-1 ring-gold/40">
                  {c.badge}
                </span>
              </p>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-white/85">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
                {c.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMessages([])}
              title={c.clear}
              aria-label={c.clear}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <Icon name="trash" className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.closeAria}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <Icon name="x" className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Area pesan */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {(isEmpty ? [{ role: "assistant" as const, content: c.welcome }] : messages).map(
              (m, i) => {
                const streamingNow = busy && m.role === "assistant" && i === messages.length - 1;
                return (
                  <div
                    key={`${m.role}-${i}`}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose-sm prose-invert max-w-[92%] rounded-2xl rounded-ss-md bg-muted/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground [&_ol]:ms-4 [&_ol]:list-decimal [&_p]:my-1 [&_strong]:text-primary [&_ul]:ms-4 [&_ul]:list-disc">
                        {m.content ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p>{children}</p>,
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        ) : null}
                        {streamingNow && (
                          <span
                            className="ms-0.5 inline-block h-4 w-[2px] animate-pulse rounded-full bg-gold align-middle"
                            aria-hidden
                          />
                        )}
                      </div>
                    ) : (
                      <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-se-md bg-gradient-to-br from-primary to-forest px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                        {m.content}
                      </div>
                    )}
                  </div>
                );
              }
            )}

            {busy && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start" aria-live="polite" aria-label={c.thinking}>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-ss-md bg-muted/70 px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-primary/70"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Saran cepat */}
          {isEmpty && !busy && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
              {chips.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            className="flex items-center gap-2 border-t border-border bg-background/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={c.placeholder}
              aria-label={c.inputAria}
              maxLength={2000}
              disabled={busy}
              className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:opacity-60"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !input.trim()}
              aria-label={c.sendAria}
              className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-gold-deep to-primary text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="send" className={cn("h-4 w-4", dir === "rtl" && "-scale-x-100")} aria-hidden />
            </Button>
          </form>

          {/* Disclaimer ringan */}
          <p className="border-t border-border/60 bg-muted/40 px-4 py-1.5 text-center text-[10px] leading-snug text-muted-foreground">
            {c.disclaimer}
          </p>
        </div>
      )}
    </>
  );
}
