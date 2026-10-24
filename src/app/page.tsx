import { cookies } from "next/headers";
import MuhdinApp from "@/components/muhdin-app";

/**
 * Mode BUILD_STATIC (shared hosting export) tidak punya request scope →
 * locale awal "id"; provider i18n klien menegaskan kembali lang/dir/teks
 * dari cookie muhdin-locale begitu halaman hidup.
 */
async function readInitialLocale(): Promise<"id" | "en" | "ar"> {
  if (process.env.BUILD_STATIC === "1") return "id";
  try {
    const store = await cookies();
    const raw = store.get("muhdin-locale")?.value;
    return raw === "en" || raw === "ar" ? raw : "id";
  } catch {
    return "id";
  }
}

export default async function Page() {
  // Locale tersimpan di cookie agar SSR (html lang/dir + teks) langsung
  // konsisten dengan client — bebas hydration mismatch.
  const initialLocale = await readInitialLocale();
  return <MuhdinApp initialLocale={initialLocale} />;
}
