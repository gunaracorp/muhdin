/**
 * Data maskapai dunia yang melayani penerbangan ke Arab Saudi (JED · MED · RUH · DMM).
 * Dibangkitkan OTOMATIS oleh scripts/fetch-airline-logos.mjs — jangan edit manual.
 * Edit daftar di script, lalu jalankan: bun scripts/fetch-airline-logos.mjs
 *
 * Logo tersedia di /airlines/{code}.png (CDN: Kiwi.com / AirHex, latar transparan).
 */

export interface Airline {
  /** Kode IATA — sekaligus nama file logo di /airlines/ */
  code: string;
  name: string;
}

/** Maskapai Indonesia — kartu unggulan "Terbang Langsung dari Indonesia". */
export const AIRLINES_INDONESIA: Airline[] = [
  { code: "GA", name: "Garuda Indonesia" },
  { code: "ID", name: "Batik Air" },
  { code: "JT", name: "Lion Air" },
  { code: "SJ", name: "Sriwijaya Air" },
];

/** Timur Tengah & Teluk — baris marquee 1. */
export const AIRLINES_GCC: Airline[] = [
  { code: "SV", name: "Saudia" },
  { code: "XY", name: "Flynas" },
  { code: "F3", name: "Flyadeal" },
  { code: "EK", name: "Emirates" },
  { code: "EY", name: "Etihad Airways" },
  { code: "FZ", name: "flydubai" },
  { code: "G9", name: "Air Arabia" },
  { code: "QR", name: "Qatar Airways" },
  { code: "GF", name: "Gulf Air" },
  { code: "KU", name: "Kuwait Airways" },
  { code: "J9", name: "Jazeera Airways" },
  { code: "WY", name: "Oman Air" },
  { code: "OV", name: "SalamAir" },
  { code: "RJ", name: "Royal Jordanian" },
  { code: "ME", name: "Middle East Airlines" },
  { code: "IY", name: "Yemenia" },
  { code: "IA", name: "Iraqi Airways" },
  { code: "IF", name: "Fly Baghdad" },
  { code: "RQ", name: "Kam Air" },
];

/** Asia — baris marquee 2. */
export const AIRLINES_ASIA: Airline[] = [
  { code: "MH", name: "Malaysia Airlines" },
  { code: "OD", name: "Batik Air Malaysia" },
  { code: "D7", name: "AirAsia X" },
  { code: "SQ", name: "Singapore Airlines" },
  { code: "TG", name: "Thai Airways" },
  { code: "PR", name: "Philippine Airlines" },
  { code: "5J", name: "Cebu Pacific" },
  { code: "VN", name: "Vietnam Airlines" },
  { code: "BG", name: "Biman Bangladesh" },
  { code: "BS", name: "US-Bangla Airlines" },
  { code: "PK", name: "PIA Pakistan" },
  { code: "PA", name: "Airblue" },
  { code: "ER", name: "Serene Air" },
  { code: "PF", name: "AirSial" },
  { code: "AI", name: "Air India" },
  { code: "IX", name: "Air India Express" },
  { code: "6E", name: "IndiGo" },
  { code: "SG", name: "SpiceJet" },
  { code: "UL", name: "SriLankan Airlines" },
  { code: "RA", name: "Nepal Airlines" },
  { code: "H9", name: "Himalaya Airlines" },
  { code: "HY", name: "Uzbekistan Airways" },
  { code: "ZT", name: "Somon Air" },
  { code: "KC", name: "Air Astana" },
  { code: "T5", name: "Turkmenistan Airlines" },
  { code: "J2", name: "Azerbaijan Airlines" },
];

/** Afrika & Eropa — baris marquee 3. */
export const AIRLINES_AFRICA_EUROPE: Airline[] = [
  { code: "MS", name: "EgyptAir" },
  { code: "SM", name: "Air Cairo" },
  { code: "NP", name: "Nile Air" },
  { code: "UJ", name: "AlMasria Universal" },
  { code: "AT", name: "Royal Air Maroc" },
  { code: "TU", name: "Tunisair" },
  { code: "AH", name: "Air Algérie" },
  { code: "LN", name: "Libyan Airlines" },
  { code: "8U", name: "Afriqiyah Airways" },
  { code: "SD", name: "Sudan Airways" },
  { code: "3T", name: "Tarco Air" },
  { code: "J4", name: "Badr Airlines" },
  { code: "ET", name: "Ethiopian Airlines" },
  { code: "KQ", name: "Kenya Airways" },
  { code: "WB", name: "RwandAir" },
  { code: "TC", name: "Air Tanzania" },
  { code: "UR", name: "Uganda Airlines" },
  { code: "P4", name: "Air Peace" },
  { code: "TK", name: "Turkish Airlines" },
  { code: "PC", name: "Pegasus Airlines" },
  { code: "VF", name: "AJet" },
  { code: "BA", name: "British Airways" },
  { code: "AF", name: "Air France" },
  { code: "LH", name: "Lufthansa" },
  { code: "AZ", name: "ITA Airways" },
  { code: "A3", name: "Aegean Airlines" },
  { code: "W6", name: "Wizz Air" },
];

export const AIRLINES_ALL: Airline[] = [
  ...AIRLINES_INDONESIA,
  ...AIRLINES_GCC,
  ...AIRLINES_ASIA,
  ...AIRLINES_AFRICA_EUROPE,
];

export const AIRLINES_COUNT = AIRLINES_ALL.length;

/** Estimasi jumlah negara asal maskapai (untuk statistik sekti). */
export const AIRLINE_COUNTRIES = 45;

export function airlineLogo(code: string): string {
  return `/airlines/${code}.png`;
}
