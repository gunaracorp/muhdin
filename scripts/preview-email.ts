/**
 * Task 60 — Pratinjau HTML email notifikasi (offline, tanpa kirim).
 * Menghasilkan file HTML agar admin/dev dapat melihat tampilan email
 * yang diterima sekretariat sebelum kredensial SMTP diisi.
 * Jalankan: bun scripts/preview-email.ts
 */
import { writeFileSync } from "node:fs";
import { emailApplicationTemplate, emailComplaintTemplate } from "../src/lib/email";

const app = emailApplicationTemplate({
  queueNumber: 10,
  ticketCode: "MHD-BX8FWT",
  orgName: "Travel Haji & Umrah Barokah Sejahtera",
  type: "PPIU",
  contactName: "Siti Aminah",
  email: "siti.aminah@example.com",
  phone: "628111222333",
  city: "Bandung",
  province: "Jawa Barat",
  licenseNo: "UJI-123",
  message:
    "Assalamualaikum, kami ingin bergabung menjadi anggota MUHDIN. Perusahaan kami telah beroperasi 5 tahun melayani jamaah umrah.",
  createdAt: new Date(),
  refId: "preview",
});

const complaint = emailComplaintTemplate({
  name: "Umi Kalsum",
  email: "umi@example.com",
  phone: "628555666777",
  targetMember: "Travel Barokah",
  category: "Pelayanan",
  content: "Uraian pengaduan jamaah contoh untuk pratinjau tampilan email.",
  createdAt: new Date(),
  refId: "preview",
});

writeFileSync("/tmp/email-preview-application.html", app.html);
writeFileSync("/tmp/email-preview-complaint.html", complaint.html);
console.log("OK — /tmp/email-preview-application.html & /tmp/email-preview-complaint.html");
console.log("--- TEXT VERSION ---");
console.log(app.text);
