"use client";

/**
 * Task 5-d — KalkulatorView: Kalkulator Estimasi Biaya + Simulator Tabungan (route #/kalkulator).
 *
 * - Semua perhitungan murni client-side (useMemo) — TIDAK ada endpoint baru.
 * - Angka adalah estimasi edukatif ±20%, ditandai jelas — BUKAN penawaran resmi.
 * - Rumus deterministik:
 *     visa 500 SAR/pax · tiket 2900 SAR × faktor musim (PP/pax) ·
 *     kamar ceil(pax/2) × (durasi−1) malam × tarif hotel × (plus? 1.35) × faktor musim ·
 *     makan 60 SAR × durasi × pax · transport 150 SAR/pax · manasik 250 SAR/pax ·
 *     penyelenggaraan 12% · total IDR = total SAR × kurs.
 * - RTL-aman (ms/me/start/end + icon-flip), dark-mode-aman, mobile-first.
 */
import { useMemo, useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { TrustHero, TrustSection, TrustCallout } from "@/components/views/p0-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useT, formatNumberL10n } from "@/lib/i18n";

/* ------------------------------ Konstanta ------------------------------ */

type Mode = "reguler" | "plus" | "ramadhan";
type HotelKey = "standar" | "unggul" | "premium";
type SeasonKey = "sepi" | "normal" | "liburan" | "ramadhan";

const HOTEL_RATE: Record<HotelKey, number> = { standar: 90, unggul: 150, premium: 260 };
const SEASON_FACTOR: Record<SeasonKey, number> = { sepi: 0.85, normal: 1, liburan: 1.2, ramadhan: 1.6 };

const HOTEL_OPTIONS = [{ key: "standar" }, { key: "unggul" }, { key: "premium" }] as const;
const SEASON_OPTIONS = [{ key: "sepi" }, { key: "normal" }, { key: "liburan" }, { key: "ramadhan" }] as const;
const ROWS = ["visa", "ticket", "hotel", "meals", "transport", "manasik", "org"] as const;
type RowKey = (typeof ROWS)[number];

const VISA_SAR = 500;
const TICKET_SAR = 2900;
const MEAL_SAR = 60;
const TRANSPORT_SAR = 150;
const MANASIK_SAR = 250;
const ORG_FEE = 0.12;
const PLUS_HOTEL_FACTOR = 1.35;

/** Parse input angka → clamp [min,max]; fallback bila kosong/NaN. */
function clampNum(raw: string, min: number, max: number, fallback: number) {
  const n = Number(String(raw).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/* ---------------------------- Sub-komponen ----------------------------- */

function Field({
  id, label, note, children,
}: {
  id?: string;
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-bold leading-snug">{label}</Label>
      {children}
      {note && <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  );
}

/* -------------------------------- View --------------------------------- */

export function KalkulatorView() {
  const { t, locale } = useT();
  const fmt = (n: number) => formatNumberL10n(n, locale);

  const [mode, setMode] = useState<Mode>("reguler");
  const [durasi, setDurasi] = useState(9);
  const [hotel, setHotel] = useState<HotelKey>("standar");
  const [season, setSeason] = useState<SeasonKey>("normal");
  const [paxStr, setPaxStr] = useState("2");
  const [kursStr, setKursStr] = useState("4350");

  const [saldoStr, setSaldoStr] = useState("5000000");
  const [setoranStr, setSetoranStr] = useState("1000000");
  const [target, setTarget] = useState(24);

  /* --- Kalkulasi biaya (deterministik, murni client-side) --- */
  const calc = useMemo(() => {
    const pax = clampNum(paxStr, 1, 50, 2);
    const kurs = clampNum(kursStr, 500, 100000, 4350);
    const seasonKey: SeasonKey = mode === "ramadhan" ? "ramadhan" : season;
    const sf = SEASON_FACTOR[seasonKey];
    const hf = mode === "plus" ? PLUS_HOTEL_FACTOR : 1;
    const rooms = Math.ceil(pax / 2);
    const nights = Math.max(1, durasi - 1);
    const visa = VISA_SAR * pax;
    const ticket = Math.round(TICKET_SAR * sf) * pax;
    const hotelCost = Math.round(rooms * nights * HOTEL_RATE[hotel] * hf * sf);
    const meals = MEAL_SAR * durasi * pax;
    const transport = TRANSPORT_SAR * pax;
    const manasik = MANASIK_SAR * pax;
    const subtotal = visa + ticket + hotelCost + meals + transport + manasik;
    const org = Math.round(subtotal * ORG_FEE);
    const totalSar = subtotal + org;
    const totalIdr = Math.round(totalSar * kurs);
    const perPax = Math.round(totalIdr / pax);
    const rows: Record<RowKey, number> = {
      visa, ticket, hotel: hotelCost, meals, transport, manasik, org,
    };
    return { pax, kurs, rows, totalSar, totalIdr, perPax };
  }, [paxStr, kursStr, mode, season, hotel, durasi]);

  /* --- Simulator tabungan --- */
  const sim = useMemo(() => {
    const saldo = Math.max(0, Math.round(Number(saldoStr) || 0));
    const setoran = Math.max(0, Math.round(Number(setoranStr) || 0));
    const kebutuhan = calc.totalIdr;
    const terkumpul = saldo + setoran * target;
    const butuhBulan = Math.ceil(Math.max(0, kebutuhan - saldo) / Math.max(1, setoran));
    const pct = kebutuhan > 0 ? Math.min(100, (terkumpul / kebutuhan) * 100) : 100;
    const extra = Math.max(0, Math.ceil((kebutuhan - saldo) / Math.max(1, target) - setoran));
    const status: "ready" | "faster" | "slow" =
      terkumpul >= kebutuhan ? "ready" : butuhBulan <= target ? "faster" : "slow";
    return { saldo, setoran, kebutuhan, terkumpul, butuhBulan, pct, extra, status };
  }, [calc.totalIdr, saldoStr, setoranStr, target]);

  const isRamadhan = mode === "ramadhan";

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <TrustHero
        eyebrow={t("kalkulator.hero.eyebrow")}
        title={t("kalkulator.hero.title")}
        subtitle={t("kalkulator.hero.subtitle")}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        {/* PANEL INPUT + HASIL */}
        <div className="grid items-start gap-6 lg:grid-cols-5">
          {/* INPUT (kiri) */}
          <div className="lg:col-span-3">
            <TrustSection
              icon="calculator"
              title={t("kalkulator.input.title")}
              desc={t("kalkulator.input.desc")}
            >
              <div className="space-y-5">
                {/* Tipe paket */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold">{t("kalkulator.input.modeLabel")}</Label>
                  <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                    <TabsList className="grid h-auto w-full grid-cols-3">
                      <TabsTrigger value="reguler" className="py-2 text-xs sm:text-sm">
                        {t("kalkulator.input.mode.reguler")}
                      </TabsTrigger>
                      <TabsTrigger value="plus" className="py-2 text-xs sm:text-sm">
                        {t("kalkulator.input.mode.plus")}
                      </TabsTrigger>
                      <TabsTrigger value="ramadhan" className="py-2 text-xs sm:text-sm">
                        {t("kalkulator.input.mode.ramadhan")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">{t(`kalkulator.input.modeHint.${mode}`)}</p>
                </div>

                {/* Durasi */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="kal-durasi" className="text-[13px] font-bold">
                      {t("kalkulator.input.duration")}
                    </Label>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary">
                      {t("kalkulator.input.days", { n: durasi })}
                    </span>
                  </div>
                  <Slider
                    id="kal-durasi"
                    min={5}
                    max={21}
                    step={1}
                    value={[durasi]}
                    onValueChange={(v) => setDurasi(v[0] ?? 9)}
                    aria-label={t("kalkulator.input.duration")}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground" aria-hidden>
                    <span>5</span>
                    <span>21</span>
                  </div>
                </div>

                {/* Tarif hotel */}
                <Field id="kal-hotel" label={t("kalkulator.input.hotel")} note={t("kalkulator.input.hotelNote")}>
                  <Select value={hotel} onValueChange={(v) => setHotel(v as HotelKey)}>
                    <SelectTrigger id="kal-hotel" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOTEL_OPTIONS.map((o) => (
                        <SelectItem key={o.key} value={o.key}>
                          {t(`kalkulator.input.hotelOpt.${o.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Musim */}
                <Field
                  id="kal-season"
                  label={t("kalkulator.input.season")}
                  note={isRamadhan ? t("kalkulator.input.seasonLocked") : undefined}
                >
                  <Select
                    value={isRamadhan ? "ramadhan" : season}
                    onValueChange={(v) => setSeason(v as SeasonKey)}
                    disabled={isRamadhan}
                  >
                    <SelectTrigger id="kal-season" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEASON_OPTIONS.map((o) => (
                        <SelectItem key={o.key} value={o.key}>
                          {t(`kalkulator.input.seasonOpt.${o.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Jamaah + kurs */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="kal-pax" label={t("kalkulator.input.pax")}>
                    <Input
                      id="kal-pax"
                      type="number"
                      min={1}
                      max={50}
                      inputMode="numeric"
                      value={paxStr}
                      onChange={(e) => setPaxStr(e.target.value)}
                    />
                  </Field>
                  <Field id="kal-kurs" label={t("kalkulator.input.rate")} note={t("kalkulator.input.rateNote")}>
                    <Input
                      id="kal-kurs"
                      type="number"
                      min={500}
                      max={100000}
                      step={10}
                      inputMode="numeric"
                      value={kursStr}
                      onChange={(e) => setKursStr(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </TrustSection>
          </div>

          {/* HASIL (kanan) */}
          <div className="lg:col-span-2">
            <TrustSection
              icon="banknote"
              title={t("kalkulator.calc.title")}
              desc={t("kalkulator.calc.desc")}
            >
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="border-amber-500/50 bg-amber-500/10 text-[11px] font-bold text-amber-700 dark:text-amber-400"
                >
                  <Icon name="alert-triangle" className="h-3 w-3" aria-hidden />
                  {t("kalkulator.calc.badge")}
                </Badge>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("kalkulator.calc.perPax")}
                  </p>
                  <p dir="ltr" className="mt-1 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                    Rp {fmt(calc.perPax)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("kalkulator.calc.group")}:{" "}
                    <span dir="ltr" className="font-bold text-foreground/85">
                      Rp {fmt(calc.totalIdr)}
                    </span>
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t("kalkulator.calc.colComp")}</TableHead>
                      <TableHead className="text-end">{t("kalkulator.calc.colSar")}</TableHead>
                      <TableHead className="text-end">{t("kalkulator.calc.colIdr")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ROWS.map((k) => (
                      <TableRow key={k}>
                        <TableCell className="text-[13px]">{t(`kalkulator.rows.${k}`)}</TableCell>
                        <TableCell dir="ltr" className="text-end text-[13px] tabular-nums text-muted-foreground">
                          {fmt(calc.rows[k])}
                        </TableCell>
                        <TableCell dir="ltr" className="text-end text-[13px] tabular-nums">
                          {fmt(Math.round(calc.rows[k] * calc.kurs))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="text-[13px] font-extrabold">{t("kalkulator.rows.total")}</TableCell>
                      <TableCell dir="ltr" className="text-end text-[13px] tabular-nums font-extrabold">
                        {fmt(calc.totalSar)}
                      </TableCell>
                      <TableCell dir="ltr" className="text-end text-[13px] tabular-nums font-extrabold text-primary">
                        {fmt(calc.totalIdr)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <p className="text-xs leading-relaxed text-muted-foreground">{t("kalkulator.calc.note")}</p>
              </div>
            </TrustSection>
          </div>
        </div>

        {/* SIMULATOR TABUNGAN */}
        <div className="mt-8">
          <TrustSection
            icon="piggy-bank"
            title={t("kalkulator.sim.title")}
            desc={t("kalkulator.sim.desc")}
          >
            <div className="grid items-start gap-6 lg:grid-cols-2">
              {/* Input simulator */}
              <div className="space-y-5">
                <Field id="kal-saldo" label={t("kalkulator.sim.initial")}>
                  <Input
                    id="kal-saldo"
                    type="number"
                    min={0}
                    step={100000}
                    inputMode="numeric"
                    value={saldoStr}
                    onChange={(e) => setSaldoStr(e.target.value)}
                  />
                </Field>
                <Field id="kal-setoran" label={t("kalkulator.sim.monthly")}>
                  <Input
                    id="kal-setoran"
                    type="number"
                    min={0}
                    step={100000}
                    inputMode="numeric"
                    value={setoranStr}
                    onChange={(e) => setSetoranStr(e.target.value)}
                  />
                </Field>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="kal-target" className="text-[13px] font-bold">
                      {t("kalkulator.sim.target")}
                    </Label>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary">
                      {t("kalkulator.sim.months", { n: target })}
                    </span>
                  </div>
                  <Slider
                    id="kal-target"
                    min={6}
                    max={60}
                    step={1}
                    value={[target]}
                    onValueChange={(v) => setTarget(v[0] ?? 24)}
                    aria-label={t("kalkulator.sim.target")}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground" aria-hidden>
                    <span>6</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              {/* Output simulator */}
              <div className="space-y-4 rounded-2xl border bg-background/60 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{t("kalkulator.sim.need")}</span>
                  <span dir="ltr" className="font-extrabold tabular-nums">Rp {fmt(sim.kebutuhan)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{t("kalkulator.sim.willHave")}</span>
                  <span dir="ltr" className="font-extrabold tabular-nums text-primary">Rp {fmt(sim.terkumpul)}</span>
                </div>

                <div className="space-y-1.5">
                  <Progress value={sim.pct} className="h-3" aria-label={t("kalkulator.sim.title")} />
                  <p className="text-end text-xs font-bold text-muted-foreground">{Math.round(sim.pct)}%</p>
                </div>

                <div className="flex min-h-9 items-start">
                  {sim.status === "ready" && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                    >
                      <Icon name="check-circle-2" className="h-3.5 w-3.5" aria-hidden />
                      {t("kalkulator.sim.ready")}
                    </Badge>
                  )}
                  {sim.status === "faster" && (
                    <Badge className="text-xs font-bold">
                      <Icon name="trending-up" className="h-3.5 w-3.5" aria-hidden />
                      {t("kalkulator.sim.faster", { n: sim.butuhBulan })}
                    </Badge>
                  )}
                  {sim.status === "slow" && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/50 bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-400"
                    >
                      <Icon name="alert-triangle" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t("kalkulator.sim.slow", { n: sim.butuhBulan, x: fmt(sim.extra) })}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TrustSection>
        </div>

        {/* CALLOUT GOLD */}
        <div className="mt-8">
          <TrustCallout tone="gold" icon="info" title={t("kalkulator.callout.title")}>
            {t("kalkulator.callout.body")}
          </TrustCallout>
        </div>

        {/* CTA */}
        <Reveal delay={0.08} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="rounded-full font-bold" onClick={() => navigate("anggota")}>
            {t("kalkulator.cta.anggota")}
            <Icon name="arrow-right" className="ms-1.5 h-4 w-4 icon-flip" aria-hidden />
          </Button>
          <Button size="lg" variant="outline" className="rounded-full font-bold" onClick={() => navigate("verifikasi")}>
            {t("kalkulator.cta.verifikasi")}
            <Icon name="shield-check" className="ms-1.5 h-4 w-4" aria-hidden />
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
