// MUHDIN — WCAG Contrast Audit v2 (self-contained, correct math)
// OKLCH -> linear sRGB -> WCAG luminance; alpha compositing in GAMMA space (browser behavior)

function oklchToLinear(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}
const gam = (v) => {
  v = Math.min(1, Math.max(0, v));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
};
const ungam = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const clampLin = (v) => Math.min(1, Math.max(0, v));

// srgb gamma-encoded triple from oklch
function oklch(L, C, H, alpha = 1) {
  const lin = oklchToLinear(L, C, H);
  return { r: gam(lin.r), g: gam(lin.g), b: gam(lin.b), a: alpha };
}
function lum(c) {
  // input gamma-encoded; linearize first
  const r = ungam(c.r), g = ungam(c.g), b = ungam(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function over(fg, bg) {
  const a = fg.a ?? 1;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
}
function ratio(fg, bg) {
  const l1 = lum(fg), l2 = lum(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
const R = (name, fg, bg) => console.log(`  ${ratio(fg, bg).toFixed(2).padStart(6)}  ${name}`);

// ---- sanity anchors ----
console.log("═ SANITY (must match browser) ═");
R("white on #e7000b (expect 4.77)", oklch(1, 0, 0), { r: 231 / 255, g: 0, b: 11 / 255 });
R("white on #00653c (expect ~6.6)", oklch(1, 0, 0), oklch(0.44, 0.115, 160));
R("black on white (expect 21)", oklch(0, 0, 0), oklch(1, 0, 0));

// ---- current tokens ----
const white = oklch(1, 0, 0);
const bgL = oklch(0.995, 0.002, 120);
const cardL = oklch(1, 0, 0);
const gold = oklch(0.72, 0.135, 85);
const goldTint15White = over(oklch(0.72, 0.135, 85, 0.15), white);
const goldTint15Card = over(oklch(0.72, 0.135, 85, 0.15), oklch(0.97, 0.02, 140)); // bg-gold/15 over card-ish
const destrCur = oklch(0.577, 0.245, 27.325);
const destrTint10 = over(destrCur, white);
const cardD = oklch(0.22, 0.025, 165);
const bgD = oklch(0.17, 0.02, 165);
const goldD = oklch(0.78, 0.14, 88);
const goldDdeep = oklch(0.68, 0.13, 82);
const destrD = oklch(0.704, 0.191, 22.216);
const fgD = oklch(0.985, 0.005, 120);

console.log("\n═ CURRENT — LIGHT ═");
R("text-gold-deep(0.55) on white", oklch(0.55, 0.12, 80), white);
R("text-gold-deep(0.55) on gold/15 over white", oklch(0.55, 0.12, 80), goldTint15White);
R("white on destructive(0.577)", white, destrCur);
R("text-destructive on destructive/10 over white", destrCur, destrTint10);
R("white on primary", white, oklch(0.44, 0.115, 160));
R("forest-deep on gold", oklch(0.26, 0.08, 165), gold);
R("forest-deep on gold-soft", oklch(0.26, 0.08, 165), oklch(0.9, 0.07, 90));

console.log("\n═ SWEEP: new light gold-deep (hue 78) — need ≥4.5 on gold/15-over-white, ideally ≥5.0 on white ═");
for (const L of [0.52, 0.5, 0.49, 0.48, 0.47, 0.46, 0.45]) {
  const c = oklch(L, 0.115, 78);
  const hex = "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  console.log(`  L=${L} ${hex}  on white ${ratio(c, white).toFixed(2)}  on gold/15@white ${ratio(c, goldTint15White).toFixed(2)}  on gold/15@card ${ratio(c, goldTint15Card).toFixed(2)}`);
}

console.log("\n═ SWEEP: new light destructive (hue 27) — need ≥4.5 white-on & ≥4.5 text on /10 tint ═");
for (const [L, C] of [[0.54, 0.22], [0.53, 0.22], [0.52, 0.22], [0.51, 0.22], [0.5, 0.22], [0.49, 0.21], [0.48, 0.21]]) {
  const c = oklch(L, C, 27);
  const hex = "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  console.log(`  L=${L} C=${C} ${hex}  white-on ${ratio(white, c).toFixed(2)}  on /10 tint ${ratio(c, over(oklch(L, C, 27, 0.1), white)).toFixed(2)}  on /5 tint ${ratio(c, over(oklch(L, C, 27, 0.05), white)).toFixed(2)}`);
}

console.log("\n═ DARK: text-gold-deep override candidates on gold/15-over-card ═");
const goldTint15CardD = over(oklch(0.78, 0.14, 88, 0.15), cardD);
for (const L of [0.74, 0.76, 0.78, 0.8]) {
  const c = oklch(L, 0.135, 88);
  console.log(`  L=${L}  on card ${ratio(c, cardD).toFixed(2)}  on gold/15@card ${ratio(c, goldTint15CardD).toFixed(2)}  on gold/10@bg ${ratio(c, over(oklch(0.78, 0.14, 88, 0.1), bgD)).toFixed(2)}`);
}
console.log("  (current 0.68):");
R("  text-gold-deep(0.68) on gold/15@card", goldDdeep, goldTint15CardD);

console.log("\n═ DARK: solid destructive button bg (white text) ═");
for (const [L, C] of [[0.62, 0.19], [0.6, 0.19], [0.58, 0.19], [0.56, 0.19], [0.55, 0.19], [0.54, 0.185]]) {
  const c = oklch(L, C, 26);
  const hex = "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  console.log(`  L=${L} ${hex}  white-on ${ratio(fgD, c).toFixed(2)}`);
}
console.log("  text-destructive on dark card (keep 0.704 for text):");
R("  destructive(0.704) on card", destrD, cardD);
R("  destructive(0.704) on destructive/15@card", destrD, over(oklch(0.704, 0.191, 22.216, 0.15), cardD));

console.log("\n═ NAVBAR transparent (over forest-deep 0.26, light mode) ═");
const fd = oklch(0.26, 0.08, 165);
R("white/90", over(oklch(1, 0, 0, 0.9), fd), fd);
R("white/85", over(oklch(1, 0, 0, 0.85), fd), fd);
R("white/80", over(oklch(1, 0, 0, 0.8), fd), fd);
R("white/75", over(oklch(1, 0, 0, 0.75), fd), fd);
R("white/70", over(oklch(1, 0, 0, 0.7), fd), fd);
R("gold on fd", gold, fd);
R("emerald-100/80 on fd", over(oklch(0.95, 0.052, 163, 0.8), fd), fd);
R("emerald-100/70 on fd", over(oklch(0.95, 0.052, 163, 0.7), fd), fd);
R("white on white/15 chip over fd", white, over(oklch(1, 0, 0, 0.15), fd));
R("white on white/10 hover over fd", white, over(oklch(1, 0, 0, 0.1), fd));

console.log("\n═ JOIN VIEW dues note (forest→forest-deep card) ═");
const forest = oklch(0.38, 0.1, 162);
const em100 = oklch(0.95, 0.052, 163);
for (const a of [0.6, 0.7, 0.8, 0.9, 1]) {
  console.log(`  emerald-100@${a}: on forest ${ratio(over({ ...em100, a }, forest), forest).toFixed(2)}  on forest-deep ${ratio(over({ ...em100, a }, oklch(0.26, 0.08, 165)), oklch(0.26, 0.08, 165)).toFixed(2)}`);
}

console.log("\n═ MISC FIX CHECKS ═");
R("dark .text-forest 0.74 on dark card", oklch(0.74, 0.1, 162), cardD);
R("gold-soft on gold/20 over fd (hero badge)", oklch(0.9, 0.07, 90), over(oklch(0.72, 0.135, 85, 0.2), fd));
R("gold-soft on primary/white10 chip", oklch(0.9, 0.07, 90), over(oklch(1, 0, 0, 0.1), oklch(0.44, 0.115, 160)));
R("gold-deep star on card (new token 0.49)", oklch(0.49, 0.115, 78), cardL);
R("text-emerald-200 on primary/20 over fd", oklch(0.905, 0.093, 164.15), over(oklch(0.44, 0.115, 160, 0.2), oklch(0.22, 0.05, 168)));
R("muted-foreground on white/5 over fd (auth tag /70)", over(oklch(0.95, 0.052, 163, 0.7), over(oklch(1, 0, 0, 0.05), fd)), over(oklch(1, 0, 0, 0.05), fd));
