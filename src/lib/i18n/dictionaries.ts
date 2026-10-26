/**
 * Aggregator kamus i18n. Satu file per namespace berisi ketiga locale
 * { id, en, ar } — bebas konflik antar agent.
 */
import { commonDict } from "@/lib/i18n/locales/common";
import { navbarDict } from "@/lib/i18n/locales/navbar";
import { footerDict } from "@/lib/i18n/locales/footer";
import { homeDict } from "@/lib/i18n/locales/home";
import { miscDict } from "@/lib/i18n/locales/misc";
import { ecosystemDict } from "@/lib/i18n/locales/ecosystem";
import { journeyDict } from "@/lib/i18n/locales/journey";
import { membersDict } from "@/lib/i18n/locales/members";
import { aboutDict } from "@/lib/i18n/locales/about";
import { tutorialDict } from "@/lib/i18n/locales/tutorial";
import { newsDict } from "@/lib/i18n/locales/news";
import { contactDict } from "@/lib/i18n/locales/contact";
import { joinDict } from "@/lib/i18n/locales/join";
import { nusukDict } from "@/lib/i18n/locales/nusuk";
import { trackDict } from "@/lib/i18n/locales/track";
import { galleryDict } from "@/lib/i18n/locales/gallery";
import { agendaDict } from "@/lib/i18n/locales/agenda";
import { downloadsDict } from "@/lib/i18n/locales/downloads";
import { reportDict } from "@/lib/i18n/locales/report";
import { branchesDict } from "@/lib/i18n/locales/branches";
import { nusHomeDict } from "@/lib/i18n/locales/indonesia-home";
import { nusTrustDict } from "@/lib/i18n/locales/indonesia-trust";
import { nusJoinDict } from "@/lib/i18n/locales/indonesia-join";
import { pengurusDict } from "@/lib/i18n/locales/pengurus";
// Task 50 — Pusat Layanan, Perizinan & Sertifikasi (menu baru)
import { layananDict } from "@/lib/i18n/locales/layanan";
// Task 48 — Super Dashboard Trio (jamaah / mitra / admin hub)
import { dashDict } from "@/lib/i18n/locales/dashboard";
// Task 51 — Dashboard PPIU & PPIHK + sinkronisasi Nusuk
import { ppiuPihkDict } from "@/lib/i18n/locales/ppiu-pihk";
// Task 52 (P0) — Infrastruktur Kepercayaan (8 halaman baru).
// Catatan: key menu (navbar.items.kepercayaan, layanan.groups.kepercayaan,
// footer.trust*) ditambahkan langsung ke locales/navbar.ts, locales/layanan.ts
// & locales/footer.ts karena Object.assign di file ini menimpa root utuh —
// root duplikat akan mencabut dict lama (bug footer.quick.* sudah terjadi).
import { regulasiDict } from "@/lib/i18n/locales/regulasi";
import { transparansiDict } from "@/lib/i18n/locales/transparansi";
import { etikDict } from "@/lib/i18n/locales/etik";
import { pdpDict } from "@/lib/i18n/locales/pdp";
import { daruratDict } from "@/lib/i18n/locales/darurat";
import { sehatDict } from "@/lib/i18n/locales/sehat";
import { kalkulatorDict } from "@/lib/i18n/locales/kalkulator";
import { widgetDict } from "@/lib/i18n/locales/widget";
// Task 53 — Live Queue Engine (papan slot pendaftaran realtime)
import { liveRegDict } from "@/lib/i18n/locales/live-reg";
// v4.1 — Halaman detail (anggota/agenda/galeri/dpd/faq/peta-situs)
import { detailDict } from "@/lib/i18n/locales/detail";
// v5 Fase 2 — Halaman WhatsApp AI Chatbot (#/whatsapp-ai)
import { waaiDict } from "@/lib/i18n/locales/waai";
// v5 Fase 3 — Paspor Haji Digital (QR) + GPS Tracking rombongan
import { pasporDict } from "@/lib/i18n/locales/paspor";
import { trackingDict } from "@/lib/i18n/locales/tracking";
// v5 Fase 4 — Virtual Tour 360°
import { turDict } from "@/lib/i18n/locales/tur";

const dicts = [
  commonDict,
  navbarDict,
  footerDict,
  homeDict,
  miscDict,
  ecosystemDict,
  journeyDict,
  membersDict,
  aboutDict,
  tutorialDict,
  newsDict,
  contactDict,
  joinDict,
  nusukDict,
  trackDict,
  galleryDict,
  agendaDict,
  downloadsDict,
  reportDict,
  branchesDict,
  // Task 33 — MUHDIN INDONESIA (Trusted Pilgrim Ecosystem)
  nusHomeDict,
  nusTrustDict,
  nusJoinDict,
  // Task 37 — Susunan Pengurus MUHDIN (#/pengurus)
  pengurusDict,
  // Task 50 — Pusat Layanan dinamis (#/layanan/<slug>)
  layananDict,
  // Task 48 — Super Dashboard Trio (#/dashboard)
  dashDict,
  // Task 51 — Dashboard PPIU & PPIHK (#/dashboard/ppiu-pihk)
  ppiuPihkDict,
  // Task 52 (P0) — Infrastruktur Kepercayaan (8 halaman + menu/footer)
  regulasiDict,
  transparansiDict,
  etikDict,
  pdpDict,
  daruratDict,
  sehatDict,
  kalkulatorDict,
  widgetDict,
  // Task 53 — Live Queue Engine (papan slot pendaftaran realtime)
  liveRegDict,
  // v5 Fase 2 — WhatsApp AI Chatbot (#/whatsapp-ai)
  waaiDict,
  // v5 Fase 3 — Paspor Haji Digital (QR) + GPS Tracking rombongan
  pasporDict,
  trackingDict,
  // v5 Fase 4 — Virtual Tour 360° (#/tur-virtual)
  turDict,
  // v4.1 — Halaman detail (anggota/agenda/galeri/dpd/faq/peta-situs)
  detailDict,
];

export const dictionaries: Record<"id" | "en" | "ar", Record<string, unknown>> = {
  id: Object.assign({}, ...dicts.map((d) => d.id)),
  en: Object.assign({}, ...dicts.map((d) => d.en)),
  ar: Object.assign({}, ...dicts.map((d) => d.ar)),
};
