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
import { nusHomeDict } from "@/lib/i18n/locales/nusantara-home";
import { nusTrustDict } from "@/lib/i18n/locales/nusantara-trust";
import { nusJoinDict } from "@/lib/i18n/locales/nusantara-join";
import { pengurusDict } from "@/lib/i18n/locales/pengurus";
// Task 50 — Pusat Layanan, Perizinan & Sertifikasi (menu baru)
import { layananDict } from "@/lib/i18n/locales/layanan";
// Task 48 — Super Dashboard Trio (jamaah / mitra / admin hub)
import { dashDict } from "@/lib/i18n/locales/dashboard";
// Task 51 — Dashboard PPIU & PPIHK + sinkronisasi Nusuk
import { ppiuPihkDict } from "@/lib/i18n/locales/ppiu-pihk";

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
  // Task 33 — MUHDIN NUSANTARA (Trusted Pilgrim Ecosystem)
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
];

export const dictionaries: Record<"id" | "en" | "ar", Record<string, unknown>> = {
  id: Object.assign({}, ...dicts.map((d) => d.id)),
  en: Object.assign({}, ...dicts.map((d) => d.en)),
  ar: Object.assign({}, ...dicts.map((d) => d.ar)),
};
