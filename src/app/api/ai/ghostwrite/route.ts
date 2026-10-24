import { NextRequest } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * MUHDIN v4.0 — AI Content Studio (ghostwriter) — endpoint admin.
 *
 * Mengubah satu topik menjadi draf artikel lengkap siap tinjau:
 * judul menarik, excerpt 1-2 kalimat, dan konten Markdown terstruktur
 * (pembuka, sub-judul ##, poin, penutup + ajakan). Editor tetap penuh
 * kendali: hasil selalu berstatus DRAFT sampai manusia menyetujuinya.
 *
 * Akses: guardAdmin (SUPER_ADMIN / ADMIN / EDITOR).
 * Batas: 8 generasi / menit / IP agar kuota AI sehat.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lang = "id" | "en" | "ar";

const LANG_INSTRUCTION: Record<Lang, string> = {
  id: "Tulis SELURUH output dalam Bahasa Indonesia yang jurnalistik, hangat, dan santun.",
  en: "Write ALL output in clear, warm, professional English.",
  ar: "اكتب كل المخرجات بالعربية الفصحى الميسّرة بأسلوب صحفي دافئ ومؤدب.",
};

function buildPrompt(topic: string, category: string, keywords: string[], tone: string, lang: Lang): string {
  const kw = keywords.length ? keywords.join(", ") : "-";
  return `${LANG_INSTRUCTION[lang]}

Tugas: menulis draf artikel portal MUHDIN (asosiasi haji & umrah digital pertama di dunia, pewaris garis pelopor PHI/IPHI).

TOPIK: ${topic}
KATEGORI: ${category} (contoh kategori portal: Berita, Pengumuman, Edukasi, Syariah, Ekosistem, Agenda)
KATA KUNCI: ${kw}
GAYA: ${tone}

ATURAN:
1. Konten 350-500 kata, Markdown murni: mulai dengan paragraf pembuka yang menarik, lalu 3-4 sub-judul "## ...", poin-poin bila membantu, paragraf penutup dengan ajakan (mis. kunjungi portal, verifikasi penyelenggara, hubungi WhatsApp resmi 0811 1116 5165).
2. Sisipkan konteks MUHDIN secara wajar BILA relevan (direktori anggota terverifikasi, 13 ekosistem layanan, integrasi Nusuk, cek verifikasi di portal) — jangan dipaksakan di setiap paragraf.
3. Dilarang mengarang angka statistik, nama pejabat, atau regulasi spesifik. Bila perlu data, tulis umum dan sarankan cek kanal resmi.
4. Hormati adab islami; tanpa klaim teologis berlebihan.

FORMAT JAWABAN — WAJIB JSON VALID TANPA TEKS LAIN, bentuk persis:
{"title": "judul artikel menarik maksimal 90 karakter", "excerpt": "ringkasan 1-2 kalimat maksimal 160 karakter", "content": "konten markdown lengkap"}`;
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;

  if (!rateLimit(req, "ai-ghostwrite", 8, 60_000)) {
    return fail("Terlalu banyak permintaan. Tunggu sejenak lalu coba lagi.", 429);
  }

  let body: { topic?: unknown; category?: unknown; keywords?: unknown; tone?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Format permintaan tidak valid.");
  }

  const topic = String(body.topic ?? "").trim().slice(0, 200);
  if (topic.length < 5) return fail("Topik terlalu pendek — tuliskan minimal 5 karakter.");

  const category = String(body.category ?? "Berita").trim().slice(0, 40) || "Berita";
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.map((k) => String(k).trim().slice(0, 40)).filter(Boolean).slice(0, 8)
    : String(body.keywords ?? "")
        .split(",")
        .map((k) => k.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 8);
  const tone = String(body.tone ?? "Profesional").trim().slice(0, 40) || "Profesional";
  const lang: Lang = body.language === "en" || body.language === "ar" ? body.language : "id";

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "Kamu redaktur senior portal berita haji & umrah terpercaya di Indonesia. Kamu SELALU menjawab dengan JSON valid tunggal tanpa penjelasan tambahan, tanpa blok kode, tanpa teks di luar JSON.",
        },
        { role: "user", content: buildPrompt(topic, category, keywords, tone, lang) },
      ],
      thinking: { type: "disabled" },
    });

    const raw = String(completion.choices[0]?.message?.content ?? "").trim();
    if (!raw) return fail("AI tidak mengembalikan hasil. Coba lagi.", 502);

    // Ekstrak JSON dari jawaban (tahan terhadap blok kode ```json ... ```).
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fail("Hasil AI tidak dapat dibaca. Coba topik lain.", 502);

    let parsed: { title?: string; excerpt?: string; content?: string };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return fail("Hasil AI tidak valid. Silakan coba sekali lagi.", 502);
    }

    const title = String(parsed.title ?? "").trim().slice(0, 120);
    const excerpt = String(parsed.excerpt ?? "").trim().slice(0, 220);
    const content = String(parsed.content ?? "").trim();
    if (!title || !content) return fail("Hasil AI tidak lengkap. Coba lagi dengan topik lebih spesifik.", 502);

    return ok({ title, excerpt: excerpt || title.slice(0, 140), content, category });
  } catch (err) {
    console.error("[ai/ghostwrite]", err);
    return fail("Layanan AI sedang sibuk. Coba beberapa saat lagi.", 503);
  }
}
