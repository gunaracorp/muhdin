/**
 * make-demo-docs.mjs — membuat PDF demo asli untuk Pusat Unduhan (Task 18).
 * PDF minimal 1 halaman dengan xref offset dihitung programmatically.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "dokumen");
mkdirSync(outDir, { recursive: true });

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function makePdf(title, lines) {
  const content = [
    "BT /F1 18 Tf 56 780 Td (" + esc(title) + ") Tj ET",
    "BT /F1 9 Tf 56 762 Td (MUHDIN - Masyarakat Umroh Haji Digital Nusantara - muhdin.web.id) Tj ET",
    "BT /F1 9 Tf 56 750 Td (Dokumen demo untuk pengembangan sistem) Tj ET",
    ...lines.map((l, i) => "BT /F1 11 Tf 56 " + (700 - i * 22) + " Td (" + esc(l) + ") Tj ET"),
    "BT /F1 8 Tf 56 60 Td (Dihasilkan otomatis oleh sistem MUHDIN - " + new Date().toISOString().slice(0, 10) + ") Tj ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    "<< /Length " + Buffer.byteLength(content) + " >>\nstream\n" + content + "\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += i + 1 + " 0 obj\n" + body + "\nendobj\n";
  });
  const xrefStart = Buffer.byteLength(pdf);
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  offsets.forEach((o) => {
    pdf += String(o).padStart(10, "0") + " 00000 n \n";
  });
  pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF";
  return Buffer.from(pdf, "binary");
}

const docs = [
  {
    file: "formulir-pendaftaran-anggota.pdf",
    title: "Formulir Pendaftaran Keanggotaan",
    lines: [
      "Formulir ini digunakan penyelenggara perjalanan ibadah yang ingin",
      "bergabung menjadi anggota MUHDIN.",
      "",
      "Langkah pendaftaran:",
      "1. Isi formulir online di muhdin.web.id/#/gabung (disarankan), atau",
      "2. Unduh formulir ini, isi lengkap, lalu kirim via email sekretariat.",
      "",
      "Data yang diperlukan: nama organisasi, tipe (PPIU/PIHK/KBIHU/IPHI),",
      "nomor izin resmi, kontak person, alamat kota/provinsi.",
      "",
      "Setelah diterima, Anda mendapat kode tiket untuk melacak status",
      "verifikasi melalui halaman Lacak Status Pendaftaran.",
    ],
  },
  {
    file: "panduan-verifikasi-penyelenggara.pdf",
    title: "Panduan Verifikasi Penyelenggara",
    lines: [
      "Panduan bagi jamaah untuk memastikan penyelenggara perjalanan ibadah",
      "tergabung resmi dan berstatus aktif di ekosistem MUHDIN.",
      "",
      "1. Buka halaman Direktori Anggota di muhdin.web.id",
      "2. Cari nama penyelenggara atau nomor izin",
      "3. Pastikan status badge TERVERIFIKASI aktif",
      "4. Cocokkan nomor izin dengan dokumen resmi penyelenggara",
      "",
      "Waspadai penyelenggara berstatus DITANGGUHKAN - jangan bertransaksi",
      "dan laporkan melalui halaman Lapor Pengaduan.",
    ],
  },
  {
    file: "sk-keanggotaan-demo.pdf",
    title: "Surat Keputusan Keanggotaan (Contoh)",
    lines: [
      "Contoh format Surat Keputusan penerimaan anggota baru MUHDIN.",
      "",
      "Nomor: SK/MUHDIN/2026/XXXX",
      "Tentang: Penerimaan organisasi sebagai anggota terverifikasi",
      "",
      "Memperhatikan hasil verifikasi administrasi dan legalitas izin",
      "usaha penyelenggaraan perjalanan ibadah, organisasi dinyatakan",
      "diterima sebagai anggota dengan hak dan kewajiban sesuai AD/ART.",
      "",
      "Ditetapkan di: Jakarta",
    ],
  },
  {
    file: "kode-etik-anggota.pdf",
    title: "Kode Etik Anggota MUHDIN",
    lines: [
      "Seluruh anggota MUHDIN wajib mematuhi kode etik berikut:",
      "",
      "1. Melayani jamaah dengan amanah, jujur, dan profesional",
      "2. Memberikan informasi paket yang benar tanpa menyesatkan",
      "3. Melindungi dana jamaah sesuai regulasi yang berlaku",
      "4. Menyediakan pendampingan selama perjalanan ibadah",
      "5. Menanggapi pengaduan jamaah dengan cepat dan adil",
      "",
      "Pelanggaran kode etik dapat berakibat penangguhan keanggotaan.",
    ],
  },
];

for (const d of docs) {
  writeFileSync(join(outDir, d.file), makePdf(d.title, d.lines));
  console.log("OK", d.file);
}
console.log("Total:", docs.length, "PDF di public/dokumen/");
