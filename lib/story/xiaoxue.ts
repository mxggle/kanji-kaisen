// Pure helpers for ancient forms taken directly from Academia Sinica 小學堂
// (https://xiaoxue.iis.sinica.edu.tw), used by scripts/fetch-xiaoxue-forms.mjs:
//   - parse the 字形演變 (yanbian) query result and pick one glyph per stage
//   - turn the glyph image as served into a small black-on-transparent PNG
//     (crop, alpha from luminance, scale down; never redrawn)
//   - merge 小學堂 files into lib/core/ancient-forms.json without touching
//     Commons files, which keep precedence.
// No fs or network here, so the Node test runner can load it.

import zlib from "node:zlib";
import type { AccPeriod } from "./acc-license.ts";
import type { AncientStage } from "./journey.ts";
import type { AncientFormFile, AncientFormsEntry, AncientFormsManifest, AncientProvider } from "./types.ts";

export const XIAOXUE_ORIGIN = "https://xiaoxue.iis.sinica.edu.tw";
export const XIAOXUE_LICENSE_URL = "https://xiaoxue.iis.sinica.edu.tw/License/License";
export const XIAOXUE_AUTHOR = "Academia Sinica 小學堂";

const SHOWN: AncientStage[] = ["oracle", "bronze", "seal"];

/** Manifest `about` text shared by both fetch scripts, so either can rewrite it. */
export const ANCIENT_RULE =
    "Wikimedia Commons first: only files under {{ACClicense}} without the Richard Sears parameter (public domain), or CC0 files traced from Academia Sinica 小學堂. A shown stage with no such file is filled from Academia Sinica 小學堂 directly (glyph images and attributes from its query interface are CC0 1.0, " +
    XIAOXUE_LICENSE_URL +
    "). Files are never redrawn; a stage with neither is left out.";
export const ANCIENT_STAGES_NOTE =
    "oracle, bronze and seal are shown and self-hosted under /ancient (Commons: sanitised SVG; 小學堂: PNG); `other` lists Commons big seal, slip and silk files that pass the same filter (recorded, not downloaded).";
export const XIAOXUE_ABOUT: Record<string, string> = {
    xiaoxue: "Academia Sinica 小學堂 字形演變 (yanbian) query: " + XIAOXUE_ORIGIN + "/yanbian",
    xiaoxueLicense: "CC0 1.0 (" + XIAOXUE_LICENSE_URL + ")",
    xiaoxueSelection:
        "Per stage, the first glyph the 字形演變 result lists in that script: oracle = first 甲骨文 font glyph, bronze = first 金文 font glyph, seal = the 說文 small seal (北師大說文小篆 font, label 說文‧X部; else 說文篆文). The image is cropped to its ink, made transparent (alpha from luminance), scaled down to at most 256 px and saved as black-on-transparent PNG. Glyphs that look empty or broken (tiny, almost no ink, or over 12 KB: speckled rubbing scans) are dropped and the stage stays empty.",
    xiaoxueGeneratedBy: "scripts/fetch-xiaoxue-forms.mjs",
};

// ---------------------------------------------------------------- yanbian result

export interface YanbianGlyph {
    // Sinica glyph code, "42.EA66" (font number . code point in that font).
    code: string;
    // Font name from the image URL, e.g. "中研院甲骨文重文二".
    font: string;
    // Image path as served (relative), e.g. "/ImageText2/ShowImage.ashx?text=…".
    src: string;
    // Catalogue label ("甲600(甲)", "木父丁爵(金)", "說文‧木部") and era ("商").
    label: string;
    era: string;
}

export interface YanbianResult {
    // The 字頭 the site matched: its code ("0.6728") and Unicode char, or null
    // when the site's head glyph is a private-use code (no Unicode char).
    head: { code: string; char: string | null } | null;
    // 楷書 order the site uses in its own links (/jiaguwen?kaiOrder=139).
    kaiOrder: number | null;
    glyphs: YanbianGlyph[];
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Decodes the HTML entities the site emits (numeric and the basic named ones). */
export function decodeEntities(s: string): string {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
        if (e[0] === "#") {
            const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
        }
        return ENTITIES[e.toLowerCase()] ?? m;
    });
}

const isPrivateUse = (cp: number) => (cp >= 0xe000 && cp <= 0xf8ff) || cp >= 0xf0000;

// alt="&42.EA66;" -> "42.EA66"
const glyphCode = (attrs: string) => /\balt="&(\d+\.[0-9A-F]+);"/.exec(attrs)?.[1] ?? null;
const attr = (attrs: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1] ?? null;

/**
 * Parses the HTML fragment POST /yanbian/PageResult/PageResult returns. The
 * fragment is data: it is matched with regular expressions, never executed.
 * Throws when the glyph count the page states doesn't match what was parsed,
 * so a change in the site's markup fails loudly instead of dropping glyphs.
 */
export function parseYanbian(html: string): YanbianResult {
    const total = /共搜尋到(\d+)字/.exec(html);
    if (!total) throw new Error("Not a 字形演變 result (no 共搜尋到…字)");

    const headMatch = /class="ZiList"[\s\S]*?<img\b([^>]*)>/.exec(html);
    let head: YanbianResult["head"] = null;
    if (headMatch) {
        const code = glyphCode(headMatch[1]);
        if (code) {
            const [font, hex] = code.split(".");
            const cp = parseInt(hex, 16);
            head = { code, char: font === "0" && !isPrivateUse(cp) ? String.fromCodePoint(cp) : null };
        }
    }

    const glyphs: YanbianGlyph[] = [];
    const cell = /<td align="center" class="VariantList[A-Z]"><img\b([^>]*?)\/?>([\s\S]*?)<td>/g;
    for (const m of html.matchAll(cell)) {
        const code = glyphCode(m[1]);
        const src = decodeEntities(attr(m[1], "src") ?? "");
        if (!code || !src.startsWith("/ImageText2/ShowImage.ashx?")) throw new Error(`Unexpected glyph cell: ${m[0].slice(0, 200)}`);
        const font = new URLSearchParams(src.slice(src.indexOf("?") + 1)).get("font") ?? "";
        const [, label = "", era = ""] = m[2].split(/<br\s*\/?>/i).map((s) => decodeEntities(s.replace(/<[^>]*>/g, "")).trim());
        glyphs.push({ code, font, src, label, era });
    }
    if (glyphs.length !== Number(total[1])) throw new Error(`Parsed ${glyphs.length} glyphs, page states ${total[1]}`);

    const kai = /[?&]kaiOrder=(\d+)/.exec(html);
    return { head: glyphs.length ? head : null, kaiOrder: kai ? Number(kai[1]) : null, glyphs };
}

/** The shown stage a glyph belongs to, from its font and label; null for other scripts. */
export function glyphStage(g: Pick<YanbianGlyph, "font" | "label">): AncientStage | null {
    if (g.font.includes("甲骨文")) return "oracle";
    if (g.font.includes("金文")) return "bronze";
    if (g.font.includes("說文小篆") && (/^說文‧.+部$/.test(g.label) || g.label === "說文篆文")) return "seal";
    return null;
}

/**
 * One glyph per stage, deterministically: the first 甲骨文 glyph and the first
 * 金文 glyph in the order the site lists them, and the 說文 small seal headword
 * (label 說文‧X部), or 說文篆文 when the char has no headword form. 說文古文 and
 * 籀文 are not small seal and are never picked.
 */
export function pickGlyphs(glyphs: readonly YanbianGlyph[]): Partial<Record<AncientStage, YanbianGlyph>> {
    const out: Partial<Record<AncientStage, YanbianGlyph>> = {};
    for (const g of glyphs) {
        const stage = glyphStage(g);
        if (stage && stage !== "seal" && !out[stage]) out[stage] = g;
    }
    const seals = glyphs.filter((g) => glyphStage(g) === "seal");
    const seal = seals.find((g) => g.label !== "說文篆文") ?? seals[0];
    if (seal) out.seal = seal;
    return out;
}

/**
 * Whether a result can stand for `query`: its 字頭 is the query itself or one
 * of the char's etymon candidates (亻 is answered with 人), or a private-use
 * head the site matched to the query (冫, 丨). Returns the char the glyphs
 * depict, or null when the site answered with an unrelated character. For a
 * private-use head the caller may narrow the char with `samePrivateHead`.
 */
export function acceptedChar(result: YanbianResult, query: string, candidates: readonly string[]): string | null {
    if (!result.head || !result.glyphs.length) return null;
    const { char } = result.head;
    if (char === null) return query;
    return char === query || candidates.includes(char) ? char : null;
}

/**
 * For a private-use 字頭 (no Unicode char), the first other etymon candidate
 * the site answers with the same 字頭: 辶 and 辵 share one head, so the glyphs
 * are 辵's. `headOf` gives each candidate's answer; null keeps the query.
 */
export function samePrivateHead(
    result: YanbianResult,
    query: string,
    candidates: readonly string[],
    headOf: (candidate: string) => YanbianResult["head"],
): string | null {
    if (!result.head || result.head.char !== null) return null;
    return candidates.find((c) => c !== query && headOf(c)?.code === result.head!.code) ?? null;
}

/** Period from the site's era line ("商", "西周早期", "戰國晚期.晉"); none when it hedges (或). */
export function eraPeriod(era: string): AccPeriod | undefined {
    if (!era || era.includes("或")) return undefined;
    if (era.startsWith("商")) return "shang";
    if (era.startsWith("西周")) return "western-zhou";
    if (era.startsWith("春秋")) return "spring-autumn";
    if (era.startsWith("戰國")) return "warring-states";
    return undefined;
}

/** Catalogue reference as the site gives it, minus the script marker: "甲600 (商)", "說文‧木部". */
export function glyphRef(g: Pick<YanbianGlyph, "label" | "era">): string {
    const label = g.label.replace(/\((甲|金)\)$/, "").trim();
    return g.era ? `${label} (${g.era})` : label;
}

/** Absolute image URL for a glyph at `size` (the site renders any size). */
export function glyphImageUrl(src: string, size: number): string {
    if (!src.startsWith("/ImageText2/ShowImage.ashx?")) throw new Error(`Not a 小學堂 glyph image: ${src}`);
    return XIAOXUE_ORIGIN + src.replace(/([?&]size=)\d+/, `$1${size}`);
}

/** The page a person can open for the char: 字形演變 by the site's 楷書 order. */
export function yanbianPageUrl(kaiOrder: number | null): string {
    return kaiOrder ? `${XIAOXUE_ORIGIN}/yanbian?kaiOrder=${kaiOrder}` : `${XIAOXUE_ORIGIN}/yanbian`;
}

/** Manifest key for a glyph: "xiaoxue-42.EA66.png". */
export const xiaoxueFileName = (code: string) => `xiaoxue-${code}.png`;

// ---------------------------------------------------------------- PNG

export interface RgbaImage {
    width: number;
    height: number;
    // 4 bytes per pixel, rows top to bottom.
    data: Uint8Array;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(buf: Uint8Array): number {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/** Decodes an 8-bit, non-interlaced PNG (grey, RGB, palette, grey+alpha or RGBA) to RGBA. */
export function decodePng(buf: Uint8Array): RgbaImage {
    const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    if (b.length < 8 || !b.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("Not a PNG");
    let off = 8;
    let width = 0;
    let height = 0;
    let colorType = -1;
    let palette: Buffer | null = null;
    let trns: Buffer | null = null;
    const idat: Buffer[] = [];
    while (off + 8 <= b.length) {
        const len = b.readUInt32BE(off);
        const type = b.toString("latin1", off + 4, off + 8);
        const data = b.subarray(off + 8, off + 8 + len);
        if (data.length !== len) throw new Error("Truncated PNG");
        if (type === "IHDR") {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            const depth = data[8];
            colorType = data[9];
            if (depth !== 8 || !(colorType in CHANNELS) || data[12] !== 0) {
                throw new Error(`Unsupported PNG (depth ${depth}, colour type ${colorType}, interlace ${data[12]})`);
            }
        } else if (type === "PLTE") palette = data;
        else if (type === "tRNS") trns = data;
        else if (type === "IDAT") idat.push(data);
        else if (type === "IEND") break;
        off += 12 + len;
    }
    if (!width || !height || !idat.length) throw new Error("PNG without image data");
    if (width * height > 4096 * 4096) throw new Error("PNG too large");
    const ch = CHANNELS[colorType];
    const stride = width * ch;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    if (raw.length < height * (stride + 1)) throw new Error("PNG image data too short");
    const px = new Uint8Array(height * stride);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
        const row = y * stride;
        for (let x = 0; x < stride; x++) {
            const a = x >= ch ? px[row + x - ch] : 0;
            const up = y ? px[row - stride + x] : 0;
            const c = x >= ch && y ? px[row - stride + x - ch] : 0;
            let v = line[x];
            if (filter === 1) v += a;
            else if (filter === 2) v += up;
            else if (filter === 3) v += (a + up) >> 1;
            else if (filter === 4) v += paeth(a, up, c);
            else if (filter !== 0) throw new Error(`Bad PNG filter ${filter}`);
            px[row + x] = v & 0xff;
        }
    }
    const out = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        const o = i * 4;
        if (colorType === 6) out.set(px.subarray(i * 4, i * 4 + 4), o);
        else if (colorType === 2) out.set([px[i * 3], px[i * 3 + 1], px[i * 3 + 2], 255], o);
        else if (colorType === 0) out.set([px[i], px[i], px[i], 255], o);
        else if (colorType === 4) out.set([px[i * 2], px[i * 2], px[i * 2], px[i * 2 + 1]], o);
        else {
            const p = px[i];
            if (!palette || p * 3 + 2 >= palette.length) throw new Error("PNG palette index out of range");
            out.set([palette[p * 3], palette[p * 3 + 1], palette[p * 3 + 2], trns && p < trns.length ? trns[p] : 255], o);
        }
    }
    return { width, height, data: out };
}

function chunk(type: string, data: Uint8Array): Buffer {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "latin1");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, crc]);
}

/**
 * Encodes an alpha mask as an 8-bit grey+alpha PNG, black ink on transparent.
 * Each row takes the PNG filter with the smallest sum of absolute values.
 */
export function encodeAlphaPng(width: number, height: number, alpha: Uint8Array): Buffer {
    const stride = width * 2;
    const px = new Uint8Array(height * stride);
    for (let i = 0; i < width * height; i++) px[i * 2 + 1] = alpha[i];
    const raw = Buffer.alloc(height * (stride + 1));
    const cand = Array.from({ length: 5 }, () => new Uint8Array(stride));
    for (let y = 0; y < height; y++) {
        const row = y * stride;
        let best = 0;
        let bestSum = Infinity;
        for (let f = 0; f < 5; f++) {
            let sum = 0;
            for (let x = 0; x < stride; x++) {
                const v = px[row + x];
                const a = x >= 2 ? px[row + x - 2] : 0;
                const up = y ? px[row - stride + x] : 0;
                const c = x >= 2 && y ? px[row - stride + x - 2] : 0;
                const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? up : f === 3 ? (a + up) >> 1 : paeth(a, up, c);
                const out = (v - pred) & 0xff;
                cand[f][x] = out;
                sum += out < 128 ? out : 256 - out;
            }
            if (sum < bestSum) {
                bestSum = sum;
                best = f;
            }
        }
        raw[y * (stride + 1)] = best;
        raw.set(cand[best], y * (stride + 1) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.set([8, 4, 0, 0, 0], 8);
    return Buffer.concat([
        PNG_SIGNATURE,
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw, { level: 9, memLevel: 9 })),
        chunk("IEND", new Uint8Array(0)),
    ]);
}

// ---------------------------------------------------------------- glyph processing

/** Ink per pixel (0–255): the pixel composited over white, then 255 − luminance. */
export function inkFromRgba(img: RgbaImage): Uint8Array {
    const ink = new Uint8Array(img.width * img.height);
    for (let i = 0; i < ink.length; i++) {
        const o = i * 4;
        const a = img.data[o + 3];
        const lum = (299 * img.data[o] + 587 * img.data[o + 1] + 114 * img.data[o + 2]) / 1000;
        const over = (lum * a + 255 * (255 - a)) / 255;
        ink[i] = Math.round(255 - over);
    }
    return ink;
}

/** Bounding box of pixels with any ink, or null for an empty image. */
export function inkBox(ink: Uint8Array, width: number, height: number) {
    let x0 = width;
    let y0 = height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!ink[y * width + x]) continue;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
        }
    }
    return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

// Area-weighted (box filter) resampling of one axis.
function resampleAxis(src: Float64Array, w: number, h: number, outLen: number, horizontal: boolean): Float64Array {
    const inLen = horizontal ? w : h;
    const lines = horizontal ? h : w;
    const out = new Float64Array(horizontal ? outLen * h : w * outLen);
    const scale = inLen / outLen;
    for (let o = 0; o < outLen; o++) {
        const start = o * scale;
        const end = (o + 1) * scale;
        for (let line = 0; line < lines; line++) {
            let sum = 0;
            for (let i = Math.floor(start); i < Math.min(inLen, Math.ceil(end)); i++) {
                const weight = Math.min(end, i + 1) - Math.max(start, i);
                sum += weight * src[horizontal ? line * w + i : i * w + line];
            }
            out[horizontal ? line * outLen + o : o * w + line] = sum / scale;
        }
    }
    return out;
}

/** Scales an ink mask down (never up) so its long side is at most `maxSide`. */
export function scaleDown(ink: Uint8Array, width: number, height: number, maxSide: number) {
    const long = Math.max(width, height);
    if (long <= maxSide) return { width, height, ink };
    const w = Math.max(1, Math.round((width * maxSide) / long));
    const h = Math.max(1, Math.round((height * maxSide) / long));
    const across = resampleAxis(Float64Array.from(ink), width, height, w, true);
    const buf = resampleAxis(across, w, height, h, false);
    const out = new Uint8Array(w * h);
    for (let i = 0; i < out.length; i++) out[i] = Math.min(255, Math.round(buf[i]));
    return { width: w, height: h, ink: out };
}

export interface ProcessedGlyph {
    png: Buffer;
    width: number;
    height: number;
    // Pixels at least half inked in the served image, and their share of it.
    darkPixels: number;
    coverage: number;
}

/**
 * The served glyph image -> a small black-on-transparent PNG: crop to the ink,
 * alpha from luminance, scale down to `maxSide`. Mechanical only; the shape is
 * never altered. Throws for an image with no ink at all.
 */
export function processGlyph(served: Uint8Array, maxSide = 256): ProcessedGlyph {
    const img = decodePng(served);
    const ink = inkFromRgba(img);
    let darkPixels = 0;
    for (const v of ink) if (v >= 128) darkPixels++;
    const box = inkBox(ink, img.width, img.height);
    if (!box) throw new Error("Glyph image has no ink");
    const cropped = new Uint8Array(box.width * box.height);
    for (let y = 0; y < box.height; y++) {
        const from = (box.y + y) * img.width + box.x;
        cropped.set(ink.subarray(from, from + box.width), y * box.width);
    }
    const scaled = scaleDown(cropped, box.width, box.height, maxSide);
    return {
        png: encodeAlphaPng(scaled.width, scaled.height, scaled.ink),
        width: scaled.width,
        height: scaled.height,
        darkPixels,
        coverage: darkPixels / (img.width * img.height),
    };
}

/** Size budget per glyph PNG. At 256 px a clean glyph stays well under it. */
export const MAX_GLYPH_BYTES = 12 * 1024;

/**
 * Why a processed glyph looks empty or broken, or null when it looks fine:
 * a tiny file, almost no ink, a canvas mostly filled (an error tile), or a
 * file over the size budget (at 256 px only speckled rubbing scans get there,
 * and those read as noise, not as a glyph).
 */
export function glyphProblem(g: Pick<ProcessedGlyph, "png" | "darkPixels" | "coverage">, servedBytes: number): string | null {
    if (servedBytes < 200) return `served image is ${servedBytes} bytes`;
    if (g.png.length < 200) return `PNG is ${g.png.length} bytes`;
    if (g.png.length > MAX_GLYPH_BYTES) return `PNG is ${(g.png.length / 1024).toFixed(1)} KB, over the ${MAX_GLYPH_BYTES / 1024} KB budget (a speckled scan)`;
    if (g.darkPixels < 50) return `${g.darkPixels} inked pixels`;
    if (g.coverage > 0.6) return `ink covers ${(g.coverage * 100).toFixed(0)}% of the image`;
    return null;
}

/** Whether two PNGs hold the same pixels (so a rerun needn't rewrite a file). */
export function samePixels(a: Uint8Array, b: Uint8Array): boolean {
    try {
        const x = decodePng(a);
        const y = decodePng(b);
        return x.width === y.width && x.height === y.height && Buffer.from(x.data).equals(Buffer.from(y.data));
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------- manifest merge

export type EntryTable = "chars" | "radicals";

export interface StageFill {
    table: EntryTable;
    // Display char (chars) or radical key (radicals).
    key: string;
    stage: AncientStage;
    // Key in `files`.
    file: string;
}

const providerOf = (f: AncientFormFile | undefined): AncientProvider => f?.provider ?? "commons";

/**
 * An entry in canonical key order (etymon, oracle, bronze, seal, other,
 * picture); the etymon is the char of the first shown stage's file, else of
 * the first recorded file, as the Commons script sets it. Null when empty.
 */
function canonicalEntry(entry: AncientFormsEntry, files: Record<string, AncientFormFile>): AncientFormsEntry | null {
    const shown = SHOWN.filter((s) => entry[s] && files[entry[s]!]);
    const other = (entry.other ?? []).filter((n) => files[n]);
    if (!shown.length && !other.length && !entry.picture) return null;
    const first = shown.length ? entry[shown[0]]! : other[0];
    const out: AncientFormsEntry = { etymon: first ? files[first].char : entry.etymon };
    for (const s of shown) out[s] = entry[s];
    if (other.length) out.other = other;
    if (entry.picture) out.picture = entry.picture;
    return out;
}

function sortedRecord<T>(rec: Record<string, T>, compare?: (a: string, b: string) => number): Record<string, T> {
    const out: Record<string, T> = {};
    for (const k of Object.keys(rec).sort(compare)) out[k] = rec[k];
    return out;
}

const byLocale = (a: string, b: string) => a.localeCompare(b);

function rebuild(
    manifest: AncientFormsManifest,
    files: Record<string, AncientFormFile>,
    tables: Record<EntryTable, Record<string, AncientFormsEntry>>,
): AncientFormsManifest {
    const out: AncientFormsManifest = { ...manifest, files: sortedRecord(files), chars: {}, radicals: {} };
    for (const table of ["chars", "radicals"] as const) {
        const rec: Record<string, AncientFormsEntry> = {};
        for (const [key, entry] of Object.entries(tables[table])) {
            const e = canonicalEntry(entry, files);
            if (e) rec[key] = e;
        }
        out[table] = sortedRecord(rec, byLocale);
    }
    return out;
}

/** The manifest without `provider`'s files and the stage slots they held. */
export function stripProvider(manifest: AncientFormsManifest, provider: AncientProvider): AncientFormsManifest {
    const files = Object.fromEntries(Object.entries(manifest.files).filter(([, f]) => providerOf(f) !== provider));
    const strip = (rec: Record<string, AncientFormsEntry>) =>
        Object.fromEntries(
            Object.entries(rec).map(([k, e]) => {
                const copy: AncientFormsEntry = { ...e };
                for (const s of SHOWN) if (copy[s] && !files[copy[s]!]) delete copy[s];
                return [k, copy];
            }),
        );
    return rebuild(manifest, files, { chars: strip(manifest.chars), radicals: strip(manifest.radicals) });
}

/** Every stage slot held by a `provider` file, for carrying fills over a rebuild. */
export function providerFills(manifest: AncientFormsManifest, provider: AncientProvider): StageFill[] {
    const fills: StageFill[] = [];
    for (const table of ["chars", "radicals"] as const) {
        for (const [key, entry] of Object.entries(manifest[table])) {
            for (const stage of SHOWN) {
                const file = entry[stage];
                if (file && manifest.files[file] && providerOf(manifest.files[file]) === provider) fills.push({ table, key, stage, file });
            }
        }
    }
    return fills;
}

/** Whether the entry already shows `stage` with a self-hosted file. */
export function hasStage(manifest: AncientFormsManifest, table: EntryTable, key: string, stage: AncientStage): boolean {
    const name = manifest[table][key]?.[stage];
    return !!(name && manifest.files[name]?.src);
}

/**
 * Adds fills to empty stage slots only (files already there keep precedence),
 * with the files they use. Unused files are not added. Entries are created as
 * needed and every entry's etymon follows its first shown stage.
 */
export function applyFills(
    manifest: AncientFormsManifest,
    newFiles: Record<string, AncientFormFile>,
    fills: readonly StageFill[],
): AncientFormsManifest {
    const files = { ...manifest.files };
    const tables = {
        chars: Object.fromEntries(Object.entries(manifest.chars).map(([k, e]) => [k, { ...e }])),
        radicals: Object.fromEntries(Object.entries(manifest.radicals).map(([k, e]) => [k, { ...e }])),
    } as Record<EntryTable, Record<string, AncientFormsEntry>>;
    for (const fill of fills) {
        const file = newFiles[fill.file];
        if (!file || file.stage !== fill.stage) throw new Error(`Fill ${fill.table}.${fill.key}.${fill.stage}: no such ${fill.stage} file ${fill.file}`);
        const entry = (tables[fill.table][fill.key] ??= { etymon: file.char });
        const held = entry[fill.stage];
        if (held && files[held]?.src) continue;
        entry[fill.stage] = fill.file;
        files[fill.file] = file;
    }
    return rebuild(manifest, files, tables);
}
