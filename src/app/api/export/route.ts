/**
 * Task 18 — Ekspor CSV data CMS (Super Admin / Admin).
 * ?type= members | applications | messages | subscribers | complaints
 * Output: UTF-8 + BOM (agar Excel membaca dengan benar), dipisah CRLF,
 * diunduh sebagai berkas muhdin-{type}-{YYYYMMDD}.csv. Setiap ekspor
 * dicatat ke log audit.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardRole, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Row = Record<string, unknown>;

/** Kolom berguna per tipe ekspor. */
const COLUMNS: Record<string, { key: string; label: string }[]> = {
  members: [
    { key: "id", label: "ID" },
    { key: "name", label: "Nama Organisasi" },
    { key: "type", label: "Tipe" },
    { key: "city", label: "Kota" },
    { key: "province", label: "Provinsi" },
    { key: "licenseNo", label: "No. Izin" },
    { key: "phone", label: "Telepon" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
    { key: "status", label: "Status" },
    { key: "memberSince", label: "Anggota Sejak" },
    { key: "rating", label: "Rating" },
    { key: "createdAt", label: "Dibuat" },
  ],
  applications: [
    { key: "ticketCode", label: "Kode Tiket" },
    { key: "orgName", label: "Organisasi" },
    { key: "type", label: "Tipe" },
    { key: "contactName", label: "Kontak" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Telepon" },
    { key: "city", label: "Kota" },
    { key: "licenseNo", label: "No. Izin" },
    { key: "status", label: "Status" },
    { key: "reviewedBy", label: "Diperiksa Oleh" },
    { key: "createdAt", label: "Dibuat" },
  ],
  messages: [
    { key: "id", label: "ID" },
    { key: "name", label: "Nama" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Telepon" },
    { key: "subject", label: "Subjek" },
    { key: "message", label: "Pesan" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Dibuat" },
  ],
  subscribers: [
    { key: "id", label: "ID" },
    { key: "email", label: "Email" },
    { key: "isActive", label: "Aktif" },
    { key: "createdAt", label: "Dibuat" },
  ],
  complaints: [
    { key: "id", label: "ID" },
    { key: "name", label: "Pelapor" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Telepon" },
    { key: "targetMember", label: "Penyelenggara Dilaporkan" },
    { key: "category", label: "Kategori" },
    { key: "status", label: "Status" },
    { key: "responseNote", label: "Catatan Respons" },
    { key: "respondedBy", label: "Ditanggapi Oleh" },
    { key: "createdAt", label: "Dibuat" },
  ],
};

const ENTITY_NAMES: Record<string, string> = {
  members: "Member",
  applications: "Application",
  messages: "Message",
  subscribers: "Subscriber",
  complaints: "Complaint",
};

/** Escape sel CSV: bungkus bila mengandung koma/kutip/baris baru. */
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value);
}

async function fetchRows(type: string): Promise<Row[]> {
  switch (type) {
    case "members":
      return db.member.findMany({ orderBy: { createdAt: "desc" } });
    case "applications":
      return db.membershipApplication.findMany({ orderBy: { createdAt: "desc" } });
    case "messages":
      return db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    case "subscribers":
      return db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
    case "complaints":
      return db.complaint.findMany({ orderBy: { createdAt: "desc" } });
    default:
      return [];
  }
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const type = req.nextUrl.searchParams.get("type") || "";
    if (!COLUMNS[type]) return fail("Tipe ekspor tidak valid. Gunakan members|applications|messages|subscribers|complaints.");

    const rows = await fetchRows(type);
    const cols = COLUMNS[type];

    const lines = [cols.map((c) => csvCell(c.label)).join(",")];
    for (const row of rows) {
      lines.push(cols.map((c) => csvCell(toCell(row[c.key]))).join(","));
    }

    // BOM \uFEFF agar Excel mengenali UTF-8.
    const csv = "\uFEFF" + lines.join("\r\n");

    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    void logAudit(req, {
      action: "EXPORT",
      entity: ENTITY_NAMES[type],
      detail: `Ekspor CSV ${rows.length} baris`,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="muhdin-${type}-${yyyymmdd}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return fail("Gagal mengekspor data.", 500);
  }
}
