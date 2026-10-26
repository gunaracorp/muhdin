import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { fail } from "@/lib/api-helpers";
import {
  askBrain,
  hashSender,
  logChat,
  sanitizeHistory,
  streamBrain,
  type BrainChannel,
  type ChatLocale,
} from "@/lib/ai-brain";

/**
 * MUHDIN v5 — Sahabat MUHDIN Concierge Pro (endpoint publik).
 *
 * Upgrade Fase 2 dari v4:
 *  - STREAMING SSE: jawaban mengalir token-per-token (teks hidup, UX pro).
 *    Format: data:{"delta":"..."} … data:{"done":true,"latencyMs":N}
 *    Bila streaming gagal, dikirim data:{"reply":"..."} utuh (kompatibel klien lama).
 *  - OTAK v5: konteks hidup dari DB (anggota, provinsi, agenda, berita, FAQ)
 *    via src/lib/ai-brain.ts — dipakai bersama chatbot WhatsApp.
 *  - LOG: tiap tanya-jawab dicatat ke AiChatLog (pengirim di-hash, privasi-aman).
 *
 * Keamanan: rate limit 12 pesan/menit/IP, input disanitasi (maks 2000 char),
 * riwayat dibatasi 12 pesan, kunci AI hanya hidup di server.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "ai-chat", 12, 60_000)) {
    return fail("Terlalu banyak pertanyaan. Mohon tunggu sebentar — jazaakumullahu khairan.", 429);
  }

  let body: { messages?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Format permintaan tidak valid.");
  }

  const locale: ChatLocale =
    body.locale === "en" || body.locale === "ar" ? body.locale : "id";
  const channel: BrainChannel = "PORTAL";

  const history = sanitizeHistory(body.messages);
  if (!history.length || history[history.length - 1].role !== "user") {
    return fail("Pertanyaan tidak boleh kosong.");
  }
  const question = history[history.length - 1].content;
  const userHash = hashSender(req.headers.get("x-forwarded-for") || "local");

  const started = Date.now();

  try {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        let full = "";
        let firstMs = 0;
        try {
          for await (const delta of streamBrain({ history, locale, channel })) {
            if (!firstMs) firstMs = Date.now() - started;
            full += delta;
            send({ delta });
          }
        } catch (err) {
          console.error("[ai/chat stream]", err);
        }

        if (!full.trim()) {
          // Fallback terakhir: mode non-streaming.
          try {
            const { reply } = await askBrain({ history, locale, channel });
            full = reply;
          } catch {
            full = "";
          }
        }

        if (!full.trim()) {
          send({ reply: "" }); // klien menampilkan pesan error-nya sendiri
        } else {
          send({ done: true, latencyMs: Date.now() - started, firstMs });
        }
        controller.close();

        void logChat({
          channel,
          locale,
          question,
          answer: full,
          userHash,
          latencyMs: Date.now() - started,
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[ai/chat]", err);
    return fail("Layanan AI sedang sibuk. Silakan coba beberapa saat lagi.", 503);
  }
}
