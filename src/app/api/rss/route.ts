/**
 * Task 18 — Feed RSS 2.0 publik: 20 artikel PUBLISHED terbaru.
 * Item mengarah ke hash route publik #/berita/{slug}.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic"; // feed harus selalu segar

/** Escape karakter khusus XML (& pertama!). */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://muhdin.web.id").replace(/\/+$/, "");
    const articles = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const items = articles
      .map((a) => {
        const link = `${base}/#/berita/${a.slug}`;
        return [
          "    <item>",
          `      <title>${xmlEscape(a.title)}</title>`,
          `      <link>${xmlEscape(link)}</link>`,
          `      <guid>${xmlEscape(link)}</guid>`,
          `      <pubDate>${a.createdAt.toUTCString()}</pubDate>`,
          `      <description>${xmlEscape(a.excerpt)}</description>`,
          "    </item>",
        ].join("\n");
      })
      .join("\n");

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<rss version="2.0">`,
      `  <channel>`,
      `    <title>MUHDIN — Berita &amp; Artikel</title>`,
      `    <link>${xmlEscape(base)}</link>`,
      `    <description>Berita, artikel, dan pengumuman resmi MUHDIN — asosiasi penyelenggara perjalanan ibadah yang amanah &amp; profesional.</description>`,
      `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      items,
      `  </channel>`,
      `</rss>`,
    ].join("\n");

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    const fallback =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0"><channel><title>MUHDIN — Berita &amp; Artikel</title></channel></rss>`;
    return new NextResponse(fallback, {
      status: 500,
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  }
}
