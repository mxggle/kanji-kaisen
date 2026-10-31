// Prints the contrast of ink-shade tile fills for every theme colour in both skins.
// Usage: node scripts/check-ink-contrast.mjs. Values match docs/design/one-atlas.css.
// Contrast of ink-shade tiles: color-mix(in oklab, sc P%, card) with text colours.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const delin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function toOklab([r, g, b]) {
  [r, g, b] = [r, g, b].map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map((c) => Math.min(1, Math.max(0, delin(c))));
}
const mix = (a, b, p) => { const A = toOklab(hex(a)), B = toOklab(hex(b)); return fromOklab(A.map((x, i) => x * p + B[i] * (1 - p))); };
const lum = (rgb) => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
const T = { Nature: "#34D399", Body: "#60A5FA", Action: "#F87171", Home: "#D6CFC4", Animals: "#FBBF24", Tools: "#A5B4C8", Thought: "#C084FC", Plants: "#A3E635", States: "#F472B6", Time: "#A5B4FC" };
const night = { card: "#0D0F12", ink: "#EDEAE2", ink2: "#B4AFA4", onacc: "#06070A" };
for (const p of [0.6, 0.45, 0.35]) {
  const rows = Object.entries(T).map(([n, c]) => { const bg = mix(c, night.card, p); return `${n} ink ${cr(bg, hex(night.ink)).toFixed(2)} dark ${cr(bg, hex(night.onacc)).toFixed(2)}`; });
  console.log(`夜 i3 at ${p * 100}%:`, rows.join(" | "));
}
console.log("夜 i4 solid, dark text:", Object.entries(T).map(([n, c]) => `${n} ${cr(hex(c), hex(night.onacc)).toFixed(2)}`).join(" | "));
console.log("夜 i2 24%, ink-2 text:", Object.entries(T).map(([n, c]) => `${n} ${cr(mix(c, night.card, 0.24), hex(night.ink2)).toFixed(2)}`).join(" | "));
const ink = { card: "#F7F3EA", sc: "#1B1915", text: "#F7F3EA", ink2: "#4E4840", seal: "#B5341E" };
for (const p of [0.6, 0.7]) console.log(`墨 i3 at ${p * 100}%: light text`, cr(mix(ink.sc, ink.card, p), hex(ink.text)).toFixed(2));
console.log("墨 i2 24%, ink-2 text:", cr(mix(ink.sc, ink.card, 0.24), hex(ink.ink2)).toFixed(2), "| 墨 i4 vermilion, card text:", cr(hex(ink.seal), hex(ink.text)).toFixed(2));

// Full matrix (One Atlas 1.6 / 3.3): every theme × shade × the text each fill carries, in both skins,
// with the values that ship in app/globals.css (濃 = 45% in 夜, 60% in 墨). Tiles sit on --card; 白 is
// transparent, so its text is checked on --bg and --card. fg-2 = 12px meaning, fg-3 = 11px reading.
const SKINS = {
  "夜": { bg: "#06070A", card: "#0D0F12", ink: "#EDEAE2", ink2: "#B4AFA4", ink3: "#8C877D", onacc: "#06070A", on3: "#EDEAE2", i3: 0.45, sc: (c) => c, c: (c) => c },
  "墨": { bg: "#EEE9DF", card: "#F7F3EA", ink: "#1B1915", ink2: "#4E4840", ink3: "#6D665C", onacc: "#F7F3EA", on3: "#F7F3EA", i3: 0.6, sc: () => "#1B1915", c: () => "#B5341E" },
};
let worst = Infinity;
const fails = [];
for (const [skin, s] of Object.entries(SKINS)) {
  for (const [name, tc] of Object.entries(T)) {
    const fills = {
      "白": [[hex(s.bg), s.ink3, s.ink3], [hex(s.card), s.ink3, s.ink3]],
      // Readings use ink-2 on 淡 and 中 (globals.css --fg-3); ink-3 there fell to 2.88:1.
      "淡": [[mix(s.sc(tc), s.card, 0.09), s.ink2, s.ink2]],
      "中": [[mix(s.sc(tc), s.card, 0.24), s.ink2, s.ink2]],
      "濃": [[mix(s.sc(tc), s.card, s.i3), s.on3, s.on3]],
      "印": [[hex(s.c(tc)), s.onacc, s.onacc]],
    };
    for (const [shade, cases] of Object.entries(fills)) {
      for (const [bg, fg2, fg3] of cases) {
        for (const [role, fg] of [["meaning", fg2], ["reading", fg3]]) {
          const ratio = cr(bg, hex(fg));
          worst = Math.min(worst, ratio);
          if (ratio < 4.5) fails.push(`${skin} ${name} ${shade} ${role} ${ratio.toFixed(2)}`);
        }
      }
    }
  }
}
console.log(`\nFull matrix, 2 skins × 10 themes × 5 shades × meaning/reading: lowest ${worst.toFixed(2)}:1`);
console.log(fails.length ? `Below 4.5:1 (${fails.length}): ${fails.join(" | ")}` : "All ≥ 4.5:1");
// Captions: --ink-3 on --card and --bg, and --ink-2 on --card, in both skins (One Atlas 3.3).
for (const [skin, s] of Object.entries(SKINS)) {
  console.log(`${skin} captions: ink-3 on card ${cr(hex(s.card), hex(s.ink3)).toFixed(2)}, ink-3 on bg ${cr(hex(s.bg), hex(s.ink3)).toFixed(2)}, ink-2 on card ${cr(hex(s.card), hex(s.ink2)).toFixed(2)}`);
}
