"use client";

/**
 * WaFab (Task 40) — tombol WhatsApp resmi mengapung (floating action button),
 * gaya situs referensi sgl.web.id: gelembung hijau membulat di sudut bawah
 * dengan denyut "online" + tooltip. Membuka wa.me nomor resmi MUHDIN
 * 0811 1116 5165 dengan salam pembuka terisi otomatis.
 *
 * Hydration-aman: dirender dari MuhdinApp hanya setelah mount (gate parent,
 * pola yang sama dengan ScrollProgressBar — Task 35-d).
 */
import { BRAND } from "@/lib/constants";
import { Icon } from "@/components/site/icon";
import { useT } from "@/lib/i18n";

export function WaFab() {
  const { t } = useT();
  const href = `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(BRAND.waGreeting)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`WhatsApp ${BRAND.whatsappDisplay}`}
      aria-label={`${t("common.ariaWaFab")} — ${BRAND.whatsappDisplay}`}
      className="group fixed bottom-5 end-5 z-[60] flex items-center gap-0 rounded-full bg-primary text-white shadow-[0_12px_32px_-8px_oklch(0.51_0.125_158/0.65)] transition-all duration-300 hover:-translate-y-1 hover:bg-forest hover:shadow-[0_18px_40px_-10px_oklch(0.34_0.088_163/0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      {/* Denyut hijau "online" — telinga admin selalu menyala */}
      <span className="absolute -top-0.5 -end-0.5 flex h-3.5 w-3.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-gold" />
      </span>
      <span className="grid h-14 w-14 place-items-center">
        <Icon name="message-circle" className="h-6 w-6" aria-hidden />
      </span>
      {/* Label melebar di layar lebar — gaya pill referensi */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap pe-0 text-sm font-bold tracking-wide transition-all duration-300 group-hover:max-w-40 group-hover:pe-5 sm:group-hover:max-w-40">
        {t("common.waFabLabel")}
      </span>
    </a>
  );
}
