import { NextRequest } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v6.0 — AI Trip Composer (diferensiasi utama): jamaah memasukkan budget,
 * durasi, jumlah jamaah, kota & jenis → sistem mencocokkan paket PUBLISHED
 * dari database MUHDIN lalu AI merangkai rencana perjalanan + tips.
 * Kunci API hanya hidup di server (z-ai-web-dev-sdk, never client).
 * Rate limit 6 komposisi / menit / IP (bucket "trip-composer").
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(req, "trip-composer", 6, 60_000)) {
      return fail("Terlalu banyak permintaan. Coba lagi sebentar lagi, ya.", 429);
    }

    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const budget = Math.max(0, Number(body.budget) || 0);
    const days = Math.min(60, Math.max(1, Number(body.days) || 9));
    const pilgrims = Math.min(100, Math.max(1, Number(body.pilgrims) || 1));
    const city = String(body.city || "").trim();
    const type = ["UMROH", "HAJI", "ZIARAH", "WISATA_ISLAMI"].includes(String(body.type)) ? String(body.type) : "UMROH";

    if (budget <= 0) return fail("Masukkan perkiraan budget per jamaah (IDR).");

    // 1) Kandidat paket dari database — hanya anggota terverifikasi & PUBLISHED.
    const pkgs = await db.tourPackage.findMany({
      where: {
        status: "PUBLISHED",
        type,
        ...(city ? { city: { contains: city } } : {}),
      },
      include: { member: { select: { name: true, city: true, licenseNo: true, rating: true } } },
      orderBy: [{ departureDate: "asc" }, { price: "asc" }],
      take: 40,
    });

    // 2) Skor kecocokan: budget (bobot utama) + durasi + slot tersisa.
    const scored = pkgs
      .map((p) => {
        const left = Math.max(0, p.slots - p.slotsTaken);
        const fitBudget = p.price <= budget ? 1 - (budget - p.price) / Math.max(1, budget) : 0;
        const budgetRatio = p.price / Math.max(1, budget);
        const fitDays = p.durationDays <= days ? 0.9 + 0.1 * (1 - Math.abs(p.durationDays - days) / Math.max(1, days)) : Math.max(0, 1 - Math.abs(p.durationDays - days) / days);
        const fitSlots = left >= pilgrims ? 1 : left / Math.max(1, pilgrims);
        const score = fitBudget * 0.45 + fitDays * 0.2 + fitSlots * 0.2 + (budgetRatio <= 1 ? 0.1 : 0) + (p.featured ? 0.05 : 0);
        return { p, left, score, budgetRatio };
      })
      .filter((s) => s.left > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const matches = scored.map(({ p, left, budgetRatio }) => ({
      id: p.id,
      title: p.title,
      memberName: p.member.name,
      memberLicense: p.member.licenseNo,
      city: p.city,
      price: p.price,
      durationDays: p.durationDays,
      departureDate: p.departureDate,
      hotelMakkah: p.hotelMakkah,
      hotelMadinah: p.hotelMadinah,
      airline: p.airline,
      slotsLeft: left,
      withinBudget: budgetRatio <= 1,
    }));

    // 3) AI merangkai rencana — konteks kandidat diberikan agar tidak mengarang.
    const kandidat = matches
      .map(
        (m, i) =>
          `${i + 1}. "${m.title}" oleh ${m.memberName} (SIUJK ${m.memberLicense}) — ${rupiah(m.price)}/jamaah, ${m.durationDays} hari, berangkat ${m.city}${m.departureDate ? ` tgl ${new Date(m.departureDate).toLocaleDateString("id-ID")}` : " fleksibel"}, sisa ${m.slotsLeft} kursi, hotel ${m.hotelMakkah || "-"}/${m.hotelMadinah || "-"}, maskapai ${m.airline || "-"}${m.withinBudget ? " [SESUAI BUDGET]" : " [di atas budget]"}`
      )
      .join("\n") || "(tidak ada paket cocok — sarankan ubah parameter)";

    const prompt = `Anda perencana perjalanan ibadah MUHDIN. Buat rencana perjalanan singkat untuk:
- Budget: ${rupiah(budget)} per jamaah
- Jumlah jamaah: ${pilgrims}
- Durasi diinginkan: ${days} hari
- Kota keberangkatan: ${city || "fleksibel"}
- Jenis: ${type}

Kandidat paket dari database MUHDIN (hanya anggota terverifikasi):
${kandidat}

Format jawaban (Bahasa Indonesia, hangat, maks 200 kata):
REKOMENDASI: 1-2 kalimat alasan memilih kandidat teratas.
RINTEGAN: 3-4 langkah persiapan hingga keberangkatan (poin pendek).
TIPS: 3 tips singkat yang relevan dengan budget/durasi di atas.
Jangan mengarang paket/harga di luar kandidat. Jangan gunakan markdown tabel.`;

    let plan = "";
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: "Kamu perencana perjalanan haji & umrah MUHDIN yang hangat, ringkas, dan jujur terhadap data kandidat. Selalu jawab dalam Bahasa Indonesia." },
          { role: "user", content: prompt },
        ],
        thinking: { type: "disabled" },
      });
      plan = String(completion.choices[0]?.message?.content ?? "").trim();
    } catch (err) {
      console.error("[trip-composer] ai", err);
      // Fallback tanpa AI: tetap berguna.
      plan = matches.length
        ? `REKOMENDASI: Paket "${matches[0].title}" paling sesuai budget Anda.\nRINTEGAN: 1) Siapkan paspor (masa berlaku min. 6 bulan) 2) Vaksin meningitis 3) Booking & pelunasan 4) Manasik bersama panitia.\nTIPS: Manfaatkan Brankas Jamaah untuk menyimpan dokumen; cek bursa kursi bila slot penuh; ajukan ulasan setelah kembali.`
        : "Belum ada paket yang cocok. Coba naikkan budget, ubah kota keberangkatan, atau pilih jenis paket lain.";
    }

    return ok({ matches, plan });
  } catch (err) {
    console.error("[trip-composer]", err);
    return fail("Gagal merangkai perjalanan. Coba beberapa saat lagi.", 503);
  }
}
