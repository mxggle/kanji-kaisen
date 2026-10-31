// Share card model (task 2E): what a 1080×1350 card for one kanji says, plus
// the pure helpers the canvas code needs (text fitting, KanjiVG path parsing,
// stroke colours, the 墨 ink-wash filter). No DOM here, so the Node test
// runner can load it; components/ShareCard/drawCard.ts does the drawing.

import { getCategoryImage, getThemeColor, isCategoryName } from "./atlas/categories.ts";
import type { ComponentRole, KanjiComponent } from "./atlas/types.ts";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
/** The canonical site, printed on every card (local builds would print localhost otherwise). */
export const SHARE_ORIGIN = "https://kanji-kaisen.harrysui.me";
/** PNG budget; the canvas code re-encodes with softer art above this. */
export const MAX_CARD_BYTES = 1_500_000;
/** Most parts the equation row shows; the glyph still colours every component. */
export const MAX_PARTS = 3;
/** Character caps applied before any measuring. */
export const MAX_MEANING = 28;
export const MAX_QUESTION_MEANING = 24;
export const MAX_GLOSS = 14;

export const VERMILION = "#B5341E";
/** Theme art for kanji without a theme (々). */
export const FALLBACK_ART = "/images/categories/others.png";

export type CardSkin = "night" | "ink";

/** Card colours per skin, from the 夜/墨 tokens in app/globals.css. */
export const CARD_PALETTE: Record<CardSkin, { bg: string; shade: string; ink: string; ink2: string; ink3: string; line: string }> = {
    night: { bg: "#06070A", shade: "6, 7, 10", ink: "#EDEAE2", ink2: "#B4AFA4", ink3: "#8C877D", line: "rgba(237, 234, 226, .2)" },
    ink: { bg: "#EEE9DF", shade: "238, 233, 223", ink: "#1B1915", ink2: "#4E4840", ink3: "#6D665C", line: "rgba(27, 25, 21, .2)" },
};

/** What the server knows about one component, keyed by its char (see components/ShareCard/getShareCardProps.ts). */
export interface ShareCardPartInfo {
    /** The atlas radical's meaning when the component is a radical ("person (standing)"). */
    radical?: string;
    /** The component's first meaning when it is an atlas kanji ("tree"). */
    kanji?: string;
    /** The radical's theme, else the kanji's. */
    category?: string | null;
}

export interface ShareCardPhonetic {
    char: string;
    /** On'yomi the family shares. */
    reading: string | null;
    /** This kanji reads like its family. */
    regular: boolean;
}

/** Plain props the kanji page passes from the server. */
export interface ShareCardInput {
    char: string;
    meanings: string[];
    onyomi: string[];
    kunyomi: string[];
    components: KanjiComponent[];
    category: string | null;
    parts?: Record<string, ShareCardPartInfo>;
    phonetic?: ShareCardPhonetic | null;
}

export interface CardPart {
    char: string;
    role: ComponentRole;
    /** Short English gloss, or the family's on'yomi for a regular sound part; "" when unknown. */
    gloss: string;
    /** "meaning", "sound", "meaning + sound", or "" for a part whose role no source states. */
    roleLabel: string;
    /** Theme colour (used in 夜). */
    color: string;
    /** 1-based inclusive KanjiVG stroke ranges in the kanji. */
    strokes: [number, number][];
}

export interface CardQuestion {
    /** why: "Why does 休 mean rest?"; how: "How is 張 built?" (meaning too long); what: "What does 海 mean?". */
    kind: "why" | "how" | "what";
    /** Latin text before and after the kanji, which is set in the Japanese face. */
    before: string;
    after: string;
    text: string;
}

export interface CardModel {
    char: string;
    question: CardQuestion;
    /** Headline meaning, at most MAX_MEANING characters. */
    meaning: string;
    /** Kana readings in priority order (first kun, first on, then alternating); show them with readingLine. */
    readings: string[];
    /** Every component, for colouring the glyph. */
    components: CardPart[];
    /** Parts shown in the equation row; empty when the kanji has fewer than two components. */
    equation: CardPart[];
    /** Components left out of the equation. */
    hiddenParts: number;
    /** The kanji's theme colour. */
    color: string;
    art: string;
    url: string;
    urlLabel: string;
    fileName: string;
    /** Text alternative for the card image. */
    alt: string;
}

const ROLE_LABELS: Record<ComponentRole, string> = {
    meaning: "meaning",
    sound: "sound",
    both: "meaning + sound",
    form: "",
};

const STOP_WORDS = new Set(["a", "an", "and", "&", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);

/** Drops parenthesised asides: "Water (3 drops)" -> "Water". */
export function stripParens(text: string): string {
    return text.replace(/\s*\([^)]*\)/g, "").replace(/\s{2,}/g, " ").trim();
}

/** At most `max` characters, cut at a word boundary with "…", never ending on "for", "&" and the like. */
export function clip(text: string, max: number): string {
    const clean = text.trim().replace(/\s+/g, " ");
    if (clean.length <= max) return clean;
    if (max <= 1) return "…";
    const kept: string[] = [];
    for (const word of clean.split(" ")) {
        if ([...kept, word].join(" ").length + 1 > max) break;
        kept.push(word);
    }
    while (kept.length && STOP_WORDS.has(kept[kept.length - 1].toLowerCase())) kept.pop();
    const head = kept.join(" ").replace(/[\s,;:&\-–—/]+$/, "");
    return head ? `${head}…` : `${clean.slice(0, max - 1)}…`;
}

/** The first real meaning (skips notes like "(kokuji)"), capped at `max` characters. */
export function headlineMeaning(meanings: string[], max = MAX_MEANING): string {
    const list = meanings.map((m) => m.trim()).filter(Boolean);
    const first = list.find((m) => !m.startsWith("(")) ?? stripParens(list[0] ?? "");
    if (first.length <= max) return first;
    return clip(stripParens(first) || first, max);
}

/** A short gloss from a dictionary meaning: "metal, gold, money" -> "metal", "Water (3 drops)" -> "water". */
export function cleanGloss(text: string | undefined, max = MAX_GLOSS): string {
    if (!text) return "";
    let gloss = stripParens(text.split(/[,;]/)[0]) || stripParens(text);
    // Lower-case a capitalised word ("Water") but keep acronyms ("DNA").
    if (/^[A-Z][a-z]/.test(gloss)) gloss = gloss[0].toLowerCase() + gloss.slice(1);
    return clip(gloss, max);
}

/**
 * Meaning parts use the radical's meaning (金 in 鍋 is "metal", not "gold");
 * other parts use their own kanji meaning (月 in 明 is "month", not the
 * nikuzuki radical's "meat"). A regular sound part shows the family reading
 * instead (毎 in 海: カイ), since its sound is the point.
 */
export function componentGloss(component: KanjiComponent, info: ShareCardPartInfo | undefined, phonetic?: ShareCardPhonetic | null): string {
    if (component.role === "sound" && phonetic?.char === component.char && phonetic.regular && phonetic.reading) {
        return phonetic.reading;
    }
    const prefersRadical = component.role === "meaning" || component.role === "both";
    const raw = prefersRadical ? info?.radical || info?.kanji : info?.kanji || info?.radical;
    return cleanGloss(raw);
}

/** Up to `max` parts; when there are more, parts with a stated role win, then order is kept. */
export function pickEquation<T extends { role: ComponentRole }>(parts: T[], max = MAX_PARTS): T[] {
    if (parts.length <= max) return parts;
    const indexed = parts.map((part, index) => ({ part, index }));
    return [...indexed.filter((x) => x.part.role !== "form"), ...indexed.filter((x) => x.part.role === "form")]
        .slice(0, max)
        .sort((a, b) => a.index - b.index)
        .map((x) => x.part);
}

/** A kanji has a build when it splits into two or more parts and a source states at least one part's role. */
export function hasBuild(components: { role: ComponentRole }[]): boolean {
    return components.length >= 2 && components.some((c) => c.role !== "form");
}

export function cardQuestion(char: string, meaning: string, components: { role: ComponentRole }[]): CardQuestion {
    const make = (kind: CardQuestion["kind"], before: string, after: string): CardQuestion => ({
        kind,
        before,
        after,
        text: `${before}${char}${after}`,
    });
    if (!hasBuild(components)) return make("what", "What does ", " mean?");
    const short = stripParens(meaning);
    if (short && short.length <= MAX_QUESTION_MEANING && !short.endsWith("…")) return make("why", "Why does ", ` mean ${short}?`);
    return make("how", "How is ", " built?");
}

// Same as plainReading in lib/atlas/readings.ts, without pulling wanakana into the card chunk.
const kana = (reading: string) => reading.replace(/[.\-]/g, "").trim();
const isAffix = (reading: string) => /^-|-$/.test(reading.trim());
const isKatakana = (text: string) => /^[゠-ヿ]+$/.test(text);

function distinctReadings(readings: string[], byStem: boolean): string[] {
    const usable = readings.filter((r) => r.trim() && !isAffix(r));
    const pool = usable.length ? usable : readings.filter((r) => r.trim());
    const seen = new Set<string>();
    const out: string[] = [];
    for (const reading of pool) {
        // やす.む, やす.まる and やす.める are one word family: keep the first.
        const key = byStem ? reading.replace(/^-|-$/g, "").split(".")[0] : kana(reading);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(kana(reading));
    }
    return out;
}

/**
 * Card readings in priority order: the first kun, the first on, then
 * alternating, at most `max` readings. Readings after the first two are added
 * only while the total stays within `maxChars` kana. Show them with
 * readingLine, which puts kun before on.
 */
export function cardReadings(kunyomi: string[], onyomi: string[], { max = 3, maxChars = 10 } = {}): string[] {
    const kun = distinctReadings(kunyomi, true);
    const on = distinctReadings(onyomi, false);
    const interleaved: string[] = [];
    for (let i = 0; i < Math.max(kun.length, on.length); i++) {
        if (kun[i]) interleaved.push(kun[i]);
        if (on[i]) interleaved.push(on[i]);
    }
    const out: string[] = [];
    let chars = 0;
    for (const reading of interleaved) {
        if (out.length >= max) break;
        if (out.length >= 2 && chars + reading.length > maxChars) continue;
        out.push(reading);
        chars += reading.length;
    }
    return out;
}

/** Kun (hiragana) first, then on (katakana), joined: "やすむ · キュウ". */
export function readingLine(readings: string[], separator = " · "): string {
    return [...readings.filter((r) => !isKatakana(r)), ...readings.filter(isKatakana)].join(separator);
}

export function cardUrl(char: string, origin = SHARE_ORIGIN): { url: string; label: string } {
    const base = origin.trim().replace(/\/+$/, "");
    return {
        url: `${base}/kanji/${encodeURIComponent(char)}`,
        label: `${base.replace(/^https?:\/\//, "")}/kanji/${char}`,
    };
}

/** The atlas getters shareCardInput needs (getRadicalSummary and getKanji on the server). */
export interface ShareCardLookup {
    radical(key: string): { meaning: string; category: string | null } | null;
    kanji(char: string): { meanings: string[]; category: string | null } | null;
}

type CardSource = Pick<ShareCardInput, "char" | "meanings" | "onyomi" | "kunyomi" | "components" | "category"> & {
    phonetic: ShareCardPhonetic | null;
};

/** Plain, serialisable card props for an atlas kanji, with what is known about each component. */
export function shareCardInput(kanji: CardSource, lookup: ShareCardLookup): ShareCardInput {
    const parts: Record<string, ShareCardPartInfo> = {};
    for (const component of kanji.components) {
        if (parts[component.char]) continue;
        const radical = component.radicalKey ? lookup.radical(component.radicalKey) : null;
        const own = lookup.kanji(component.char);
        const info: ShareCardPartInfo = { category: radical?.category ?? own?.category ?? null };
        if (radical?.meaning) info.radical = radical.meaning;
        if (own?.meanings[0]) info.kanji = own.meanings[0];
        parts[component.char] = info;
    }
    const { phonetic } = kanji;
    return {
        char: kanji.char,
        meanings: kanji.meanings,
        onyomi: kanji.onyomi,
        kunyomi: kanji.kunyomi,
        components: kanji.components,
        category: kanji.category,
        parts,
        phonetic: phonetic ? { char: phonetic.char, reading: phonetic.reading, regular: phonetic.regular } : null,
    };
}

export function buildCardModel(input: ShareCardInput, { origin = SHARE_ORIGIN }: { origin?: string } = {}): CardModel {
    const { char, category } = input;
    const meaning = headlineMeaning(input.meanings);
    const components: CardPart[] = input.components.map((component) => {
        const info = input.parts?.[component.char];
        return {
            char: component.char,
            role: component.role,
            gloss: componentGloss(component, info, input.phonetic),
            roleLabel: ROLE_LABELS[component.role],
            color: getThemeColor(info?.category ?? null),
            strokes: component.strokes,
        };
    });
    const equation = components.length >= 2 ? pickEquation(components) : [];
    const readings = cardReadings(input.kunyomi, input.onyomi);
    const { url, label } = cardUrl(char, origin);
    const question = cardQuestion(char, meaning, input.components);

    const sum = equation
        .map((p) => [p.char, p.gloss, p.roleLabel && `(${p.roleLabel})`].filter(Boolean).join(" "))
        .join(" + ");
    const alt = [
        `Share card for ${char}.`,
        question.text,
        sum ? `${sum} = ${meaning}.` : meaning ? `${char} means ${meaning}.` : "",
        readings.length ? `Read ${readingLine(readings, ", ")}.` : "",
        label,
    ]
        .filter(Boolean)
        .join(" ");

    return {
        char,
        question,
        meaning,
        readings,
        components,
        equation,
        hiddenParts: equation.length ? components.length - equation.length : 0,
        color: getThemeColor(category),
        art: isCategoryName(category) ? getCategoryImage(category) : FALLBACK_ART,
        url,
        urlLabel: label,
        fileName: `kanji-${char}.png`,
        alt,
    };
}

/** A component's stroke colour: its theme in 夜; vermilion for meaning parts and ink otherwise in 墨. */
export function partColor(part: Pick<CardPart, "role" | "color">, skin: CardSkin): string {
    if (skin === "night") return part.color;
    return part.role === "meaning" || part.role === "both" ? VERMILION : CARD_PALETTE.ink.ink;
}

/** One colour per KanjiVG stroke; strokes outside every component take the kanji's colour (夜) or ink (墨). */
export function strokeColors(model: Pick<CardModel, "color" | "components">, skin: CardSkin, strokeCount: number): string[] {
    const colors = Array.from({ length: strokeCount }, () => (skin === "night" ? model.color : CARD_PALETTE.ink.ink));
    for (const part of model.components) {
        const color = partColor(part, skin);
        for (const index of strokeIndexes(part.strokes)) {
            if (index < strokeCount) colors[index] = color;
        }
    }
    return colors;
}

/** 0-based path indexes for 1-based inclusive ranges: [[1, 2], [5, 5]] -> [0, 1, 4]. */
export function strokeIndexes(ranges: [number, number][]): number[] {
    const out: number[] = [];
    for (const [from, to] of ranges) {
        for (let i = Math.max(1, from); i <= to; i++) out.push(i - 1);
    }
    return out;
}

// --- KanjiVG paths -------------------------------------------------------------

/** The `d` of every stroke path in a KanjiVG file, in stroke order. */
export function parseStrokePaths(svg: string): string[] {
    return [...svg.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]);
}

export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

const PARAM_COUNT: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7 };

/**
 * Bounds of SVG path data from its end and control points (a slight
 * overestimate on curves, which is fine for fitting a part into a box).
 */
export function pathBounds(paths: string[]): Bounds | null {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const add = (x: number, y: number) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    };
    for (const d of paths) {
        const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
        let x = 0;
        let y = 0;
        let startX = 0;
        let startY = 0;
        let command = "";
        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];
            if (/^[a-zA-Z]$/.test(token)) {
                command = token;
                i++;
                if (command === "z" || command === "Z") {
                    x = startX;
                    y = startY;
                }
                continue;
            }
            const lower = command.toLowerCase();
            const count = PARAM_COUNT[lower];
            if (!count) {
                i++;
                continue;
            }
            const args = tokens.slice(i, i + count).map(Number);
            if (args.length < count) break;
            i += count;
            const relative = command === lower;
            const ox = relative ? x : 0;
            const oy = relative ? y : 0;
            switch (lower) {
                case "m":
                    x = ox + args[0];
                    y = oy + args[1];
                    startX = x;
                    startY = y;
                    add(x, y);
                    // Further pairs after a moveto are linetos.
                    command = relative ? "l" : "L";
                    break;
                case "l":
                case "t":
                    x = ox + args[0];
                    y = oy + args[1];
                    add(x, y);
                    break;
                case "h":
                    x = ox + args[0];
                    add(x, y);
                    break;
                case "v":
                    y = oy + args[0];
                    add(x, y);
                    break;
                case "c":
                    add(ox + args[0], oy + args[1]);
                    add(ox + args[2], oy + args[3]);
                    x = ox + args[4];
                    y = oy + args[5];
                    add(x, y);
                    break;
                case "s":
                case "q":
                    add(ox + args[0], oy + args[1]);
                    x = ox + args[2];
                    y = oy + args[3];
                    add(x, y);
                    break;
                case "a":
                    x = ox + args[5];
                    y = oy + args[6];
                    add(x, y);
                    break;
            }
        }
    }
    return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/**
 * Scale and offset that centre `bounds` in a `box`-sized square, leaving
 * `padding` for the stroke. Small parts (冖) are not blown up past
 * `box / minExtent` per viewBox unit.
 */
export function fitBounds(bounds: Bounds, box: number, { padding = 0, minExtent = 72 } = {}): { scale: number; x: number; y: number } {
    const width = Math.max(bounds.maxX - bounds.minX, 1);
    const height = Math.max(bounds.maxY - bounds.minY, 1);
    const inner = box - 2 * padding;
    const scale = Math.min(inner / width, inner / height, box / minExtent);
    return {
        scale,
        x: (box - width * scale) / 2 - bounds.minX * scale,
        y: (box - height * scale) / 2 - bounds.minY * scale,
    };
}

// --- Text fitting --------------------------------------------------------------

/** Width of `text` at font size `size` (the canvas passes ctx.measureText). */
export type Measure = (text: string, size: number) => number;

interface SizeRange {
    max: number;
    min: number;
    step?: number;
}

/** The largest size from max down to min at which `text` fits, else min with the text clipped. */
export function fitText(text: string, maxWidth: number, measure: Measure, { max, min, step = 2 }: SizeRange): { text: string; size: number } {
    for (let size = max; size >= min; size -= step) {
        if (measure(text, size) <= maxWidth) return { text, size };
    }
    for (let n = text.length - 1; n >= 1; n--) {
        const clipped = clip(text, n);
        if (measure(clipped, min) <= maxWidth) return { text: clipped, size: min };
    }
    return { text: "…", size: min };
}

/** Greedy word wrap at one size; a word wider than the line gets a line of its own. */
export function wrapWords(text: string, maxWidth: number, measure: Measure, size: number): string[] {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (line && measure(next, size) > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/**
 * One line as large as possible down to 75% of max; then up to `maxLines`
 * lines down to min; then min with the overflow clipped into the last line.
 */
export function fitLines(
    text: string,
    maxWidth: number,
    measure: Measure,
    { max, min, step = 2, maxLines = 2 }: SizeRange & { maxLines?: number },
): { lines: string[]; size: number } {
    const floor = Math.max(min, Math.round(max * 0.75));
    for (let size = max; size >= floor; size -= step) {
        if (measure(text, size) <= maxWidth) return { lines: [text], size };
    }
    for (let size = floor; size >= min; size -= step) {
        const lines = wrapWords(text, maxWidth, measure, size);
        if (lines.length <= maxLines && lines.every((l) => measure(l, size) <= maxWidth)) return { lines, size };
    }
    const lines = wrapWords(text, maxWidth, measure, min);
    const fit = (line: string) => fitText(line, maxWidth, measure, { max: min, min }).text;
    if (lines.length <= maxLines) return { lines: lines.map(fit), size: min };
    return { lines: [...lines.slice(0, maxLines - 1).map(fit), fit(lines.slice(maxLines - 1).join(" "))], size: min };
}

/**
 * Fits readings joined by `separator` (kun first, see readingLine): shrink
 * from max to min, and when they still don't fit, drop the lowest-priority
 * reading (the last) and try again. Keeps at least one.
 */
export function fitList(
    items: string[],
    maxWidth: number,
    measure: Measure,
    { max, min, step = 2, separator = " · " }: SizeRange & { separator?: string },
): { items: string[]; text: string; size: number } {
    for (let n = items.length; n >= 1; n--) {
        const kept = items.slice(0, n);
        const text = readingLine(kept, separator);
        for (let size = max; size >= min; size -= step) {
            if (measure(text, size) <= maxWidth) return { items: kept, text, size };
        }
    }
    const first = items.slice(0, 1);
    return { items: first, text: readingLine(first, separator), size: min };
}

// --- 墨 art --------------------------------------------------------------------

/**
 * The 墨 `ink-art` filter from app/globals.css, grayscale(1) contrast(1.45)
 * brightness(1.18), applied in place to RGBA pixels. Done by hand because
 * CanvasRenderingContext2D.filter is missing in older Safari.
 */
export function inkWash(data: Uint8ClampedArray | number[], contrast = 1.45, brightness = 1.18): void {
    const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const value = Math.round(clamp(clamp((gray - 127.5) * contrast + 127.5) * brightness));
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
    }
}
