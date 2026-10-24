/**
 * seed-resource-lengkap.mjs — melengkapi Pusat Unduhan (#/unduhan)
 * dengan seluruh dokumen resmi yang ada di public/dokumen/.
 * Aman dijalankan berulang (unique-by fileUrl upsert).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const docs = [
  {
    title: "Formulir Pendaftaran Anggota MUHDIN",
    description:
      "Formulir resmi pendaftaran keanggotaan MUHDIN untuk PPIU, PIHK, KBIHU, Travel Wisata, dan IPHI. Lengkapi data penyelenggara, lampirkan legalitas, lalu unggah kembali melalui halaman #/gabung.",
    category: "Formulir",
    fileUrl: "/dokumen/formulir-pendaftaran-anggota.pdf",
  },
  {
    title: "Kode Etik Anggota MUHDIN",
    description:
      "Kode etik penyelenggaraan ibadah umrah & haji yang wajib ditaati seluruh anggota: prinsip amanah, transparan, profesional, dan perlindungan jamaah.",
    category: "Kebijakan",
    fileUrl: "/dokumen/kode-etik-anggota.pdf",
  },
  {
    title: "Panduan Verifikasi Penyelenggara",
    description:
      "Panduan langkah demi langkah bagi jamaah untuk memverifikasi legalitas PPIU/PIHK melalui halaman verifikasi lisensi publik MUHDIN seingga terhindar dari penyelenggara ilegal.",
    category: "Panduan",
    fileUrl: "/dokumen/panduan-verifikasi-penyelenggara.pdf",
  },
  {
    title: "Contoh Surat Keputusan Keanggotaan (Demo)",
    description:
      "Contoh SK keanggotaan digital yang diterbitkan sistem setelah verifikasi berjenjang selesai — dilengkapi nomor registrasi MHD-XXXXXX dan masa berlaku.",
    category: "Lainnya",
    fileUrl: "/dokumen/sk-keanggotaan-demo.pdf",
  },
];

async function main() {
  let created = 0;
  let existing = 0;
  for (const doc of docs) {
    const found = await db.resource.findFirst({ where: { fileUrl: doc.fileUrl } });
    if (found) {
      await db.resource.update({ where: { id: found.id }, data: { ...doc, published: true } });
      existing++;
    } else {
      await db.resource.create({ data: { ...doc, published: true } });
      created++;
    }
  }
  const total = await db.resource.count();
  console.log(`Resource: +${created} baru, ${existing} diperbarui. Total kini ${total} dokumen terbit.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
