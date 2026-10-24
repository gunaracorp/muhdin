/**
 * Task 41 — Unduh arsip proyek bersih (fix "Download workspace
 * failed: Failed to fetch").
 *
 * Latar: workspace sandbox berisi ±62.000 berkas / 1,6GB
 * (node_modules sendiri 58.752 berkas), sehingga pengemas
 * bawaan tombol "Download workspace" kewalahan/timeout.
 * Endpoint ini menyajikan zip bersih buatan scripts/make-backup.sh:
 *
 *   GET /api/backup           → kode sumber saja (publik, tanpa rahasia)
 *   GET /api/backup?full=1    → + .git, .env, db (wajib login admin)
 *   GET /api/backup?refresh=1 → paksa regenerasi arsip
 *
 * Arsip disimpan di /tmp (di luar workspace agar tidak ikut
 * menggelembungkan ukuran workspace) dan dibuat ulang otomatis
 * bila berkasnya hilang — mis. setelah sandbox direstart.
 */
import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, stat } from "fs/promises";
import { guardRole, fail } from "@/lib/api-helpers";

const execFileAsync = promisify(execFile);

type Mode = "source" | "full";

/** Tanggal YYYYMMDD untuk nama berkas unduhan. */
function stamp(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}${mm}${dd}`;
}

function zipPath(mode: Mode): string {
  return `/tmp/muhdin-${mode}.zip`;
}

function downloadName(mode: Mode): string {
  return `muhdin-${mode}-${stamp()}.zip`;
}

/** Pastikan arsip ada; buat bila hilang atau diminta refresh. */
async function ensureZip(mode: Mode, refresh: boolean): Promise<void> {
  const target = zipPath(mode);
  if (!refresh) {
    try {
      const info = await stat(target);
      if (info.isFile() && info.size > 0) return;
    } catch {
      // belum ada → lanjut membuat
    }
  }
  await execFileAsync("bash", ["scripts/make-backup.sh", mode], {
    cwd: process.cwd(),
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
  });
}

export async function GET(req: NextRequest) {
  const full = req.nextUrl.searchParams.get("full") === "1";
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  const mode: Mode = full ? "full" : "source";

  // Arsip lengkap memuat .env + database + riwayat git → hanya admin.
  if (full) {
    const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
    if (denied) return denied;
  }

  try {
    await ensureZip(mode, refresh);
    const buf = await readFile(zipPath(mode));
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${downloadName(mode)}"`,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[backup] gagal menyiapkan arsip:", err);
    return fail("Gagal menyiapkan arsip proyek. Coba lagi sebentar.", 500);
  }
}
