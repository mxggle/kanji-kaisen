// Pure helpers for the radical journey page (/radical/[key]) and /radicals.
// Client-safe and loadable by the Node test runner (relative `.ts` imports).
// Tests in radical.test.mjs.

import { toHiragana } from "wanakana";
import { STAGE_META, type AncientJourneyStage } from "../../lib/story/journey.ts";

// ------------------------------------------------------------- wording

/** Lower-cases a leading capital unless the word is an acronym ("Fire, flame" -> "fire, flame"). */
function lowerFirst(text: string): string {
    return /^[A-Z](?![A-Z])/.test(text) ? text[0].toLowerCase() + text.slice(1) : text;
}

/** The first plain gloss of a radical's meaning: "Water (3 drops)" -> "water", "tree, wood" -> "tree". */
export function shortMeaning(meaning: string): string {
    return meaning.split(/[,;/(]/)[0].trim().toLowerCase();
}

// ------------------------------------------------------------- memory story examples

export interface StoryExample {
    char: string;
    meaning: string;
    explanation: string;
    /** True when the kanji has an atlas page. */
    exists?: boolean;
}

/** Story examples with a real character and meaning (the compiled stories hold a few placeholders). */
export function usableExamples<T extends StoryExample>(examples: readonly T[] = []): T[] {
    return examples.filter(
        (ex) =>
            ex.char &&
            ex.char !== "?" &&
            ex.char !== "undefined" &&
            ex.meaning &&
            ex.meaning !== "example" &&
            ex.meaning !== "undefined",
    );
}

// ------------------------------------------------------------- the journey

export interface StageFile {
    /** The code point the file depicts (the etymon or a variant). */
    char: string;
    src?: string;
}

const shownBy = (stage: AncientJourneyStage, files: readonly StageFile[]) =>
    files.find((f) => f.src && f.src === stage.src)?.char;

const joinAnd = (items: string[]) =>
    items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * Which stages show another character than `char`, e.g. "The bronze and seal
 * stages show 仌, not 冫 itself." or "The oracle bone stage shows 网 and the
 * bronze stage shows 冈, not 罒 itself." Empty when every stage shows `char`.
 */
export function shownNote(char: string, stages: readonly AncientJourneyStage[], files: readonly StageFile[]): string {
    const groups: { shown: string; names: string[] }[] = [];
    for (const s of stages) {
        const shown = shownBy(s, files);
        if (!shown || shown === char) continue;
        const name = STAGE_META[s.stage].en.toLowerCase();
        const group = groups.find((g) => g.shown === shown);
        if (group) group.names.push(name);
        else groups.push({ shown, names: [name] });
    }
    if (groups.length === 0) return "";
    const clauses = groups.map(
        (g, i) => `${i === 0 ? "The" : "the"} ${joinAnd(g.names)} ${g.names.length > 1 ? "stages show" : "stage shows"} ${g.shown}`,
    );
    return `${joinAnd(clauses)}, not ${char} itself.`;
}

/** The note under a journey with no ancient stage. */
export function emptyJourneyNote(char: string): string {
    return `No ancient form of ${char} passed our licence check yet. We only show forms from public-domain or CC0 sources.`;
}

// ------------------------------------------------------------- origin (Wiktionary)

/** Permanent link to the Wiktionary revision an origin was read from. */
export function wiktionaryRevisionUrl(page: string, revid: number): string {
    return `https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(page)}&oldid=${revid}`;
}

// A colon followed straight by a conjunction, or a colon ending the sentence,
// means the source showed an image there that the text can't carry
// ("originally drawn as: and later as 丷"). Empty brackets or quotes likewise.
const ELIDED = /:\s*(?:$|(?:and|or|but|then|later)\b)|\(\s*\)|“\s*”/i;

/**
 * Sourced origin text without sentences that lost an inline image in the
 * Wiktionary extract. Never adds or rewrites words.
 */
export function originText(text: string | undefined): string {
    if (!text) return "";
    return text
        .trim()
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !ELIDED.test(sentence.replace(/[.!?]+$/, "")))
        .join(" ");
}

// ------------------------------------------------------------- names

/** The romaji name in lower case, without notes: "Gen (Darkness)" -> "gen", "Hi / Nichi" -> "hi / nichi". */
export function romajiName(name: string): string {
    return name
        .replace(/\s*\([^)]*\)/g, "")
        .trim()
        .toLowerCase();
}

/**
 * The name in hiragana: "Sanzui" -> "さんずい", "Hi / Nichi" -> "ひ / にち".
 * Rendaku つ is written づ ("Nikuzuki" -> "にくづき", "Sunzukuri" -> "すんづくり").
 */
export function radicalKana(name: string): string {
    return romajiName(name)
        .split(/\s*\/\s*/)
        .map((word) => toHiragana(word.replace(/(?<=.)zu(?=ki|kuri)/g, "du")))
        .join(" / ");
}

/** The meaning as a title, a leading capital lowered: "Water (3 drops)" -> "water (3 drops)". */
export function radicalTitle(meaning: string): string {
    return lowerFirst(meaning.trim());
}

// ------------------------------------------------------------- where it sits (KanjiVG)

/** Where a radical sits in a kanji, from KanjiVG's kvg:position, or "repeated" when it is drawn more than once. */
export type Placement = "left" | "right" | "top" | "bottom" | "enclosing" | "top-left" | "bottom-left" | "repeated";

const POSITIONS: Record<string, Placement> = {
    left: "left",
    right: "right",
    top: "top",
    bottom: "bottom",
    kamae: "enclosing",
    tare: "top-left",
    nyo: "bottom-left",
};

export interface KvgGroup {
    element?: string;
    position?: string;
    part?: string;
    /** 1-based stroke numbers of every path inside. */
    strokes: number[];
    parent: KvgGroup | null;
}

const KVG_TAG = /<g\b([^>]*)>|<\/g>|<path\b([^>]*?)\/?>/g;
const kvgAttr = (attrs: string, name: string) => attrs.match(new RegExp(`kvg:${name}="([^"]*)"`))?.[1];

/** The groups of a KanjiVG file below the kanji's own group, in document order. */
export function kvgGroups(raw: string): KvgGroup[] {
    const start = raw.indexOf('id="kvg:StrokePaths_');
    if (start === -1) return [];
    const end = raw.indexOf('id="kvg:StrokeNumbers_', start);
    const body = raw.slice(raw.lastIndexOf("<g", start), end === -1 ? undefined : raw.lastIndexOf("<g", end));
    const out: KvgGroup[] = [];
    // The first two levels are the StrokePaths group and the kanji's own group.
    const stack: (KvgGroup | null)[] = [];
    let count = 0;
    for (const [tag, groupAttrs, pathAttrs] of body.matchAll(KVG_TAG)) {
        if (groupAttrs !== undefined) {
            if (stack.length < 2) {
                stack.push(null);
                continue;
            }
            const group: KvgGroup = { strokes: [], parent: stack[stack.length - 1] };
            for (const name of ["element", "position", "part"] as const) {
                const value = kvgAttr(groupAttrs, name);
                if (value) group[name] = value;
            }
            out.push(group);
            stack.push(group);
        } else if (tag === "</g>") {
            stack.pop();
        } else if (pathAttrs !== undefined) {
            count++;
            const n = Number(pathAttrs.match(/\bid="[^"]*-s(\d+)"/)?.[1] ?? count);
            for (const group of stack) group?.strokes.push(n);
        }
    }
    return out;
}

function within(group: KvgGroup, others: readonly KvgGroup[]): boolean {
    for (let g = group.parent; g; g = g.parent) if (others.includes(g)) return true;
    return false;
}

export interface PlacementHit {
    placement: Placement;
    /** The radical's strokes in the kanji (1-based, ascending). */
    strokes: number[];
}

/**
 * Where a radical sits in a kanji's KanjiVG file. `forms` are its shapes as
 * KanjiVG names them (亻, 忄 …). The group's own kvg:position counts, else its
 * nearest positioned ancestor's; a radical drawn more than once is
 * "repeated". Null when the file has no such group or no position for it
 * (本, or 東 where another part splits it).
 */
export function placementIn(raw: string, forms: readonly string[]): PlacementHit | null {
    const groups = kvgGroups(raw);
    const matches = groups.filter((g) => g.element !== undefined && forms.includes(g.element));
    const outer = matches.filter((g) => !within(g, matches));
    // kvg:part 2, 3 … continue part 1 of the same shape.
    const distinct = outer.filter((g) => !g.part || g.part === "1");
    if (distinct.length === 0) return null;
    // A copy nested in another part counts as the radical only when every
    // group around it is made of the radical alone (林 in 森), not when it is
    // a piece of another part (the 亻 inside 隹 in 催).
    const pure = (g: KvgGroup) => groups.filter((c) => c.parent === g).every((c) => matches.includes(c));
    const own = distinct.filter((g) => {
        for (let p = g.parent; p; p = p.parent) if (!pure(p)) return false;
        return true;
    });
    if (own.length > 1) {
        return { placement: "repeated", strokes: [...new Set(own.flatMap((g) => g.strokes))].sort((a, b) => a - b) };
    }
    const main = own[0] ?? distinct[0];
    // Split by another part (東): no single place.
    if (main.part) return null;
    const strokes = [...main.strokes].sort((a, b) => a - b);
    for (let g: KvgGroup | null = main; g; g = g.parent) {
        const placement = g.position ? POSITIONS[g.position] : undefined;
        if (placement) return { placement, strokes };
    }
    return null;
}

/**
 * The first kanji (in the given order) for each placement, up to `limit`,
 * looking at the first `scan` kanji. `placementOf` reads one; null skips it.
 */
export function pickPlacements<T extends { char: string }>(
    kanji: readonly T[],
    placementOf: (k: T) => PlacementHit | null,
    limit = 3,
    scan = 60,
): (PlacementHit & { kanji: T })[] {
    const out: (PlacementHit & { kanji: T })[] = [];
    for (const k of kanji.slice(0, scan)) {
        if (out.length >= limit) break;
        const hit = placementOf(k);
        if (!hit || out.some((p) => p.placement === hit.placement)) continue;
        out.push({ ...hit, kanji: k });
    }
    return out;
}

// ------------------------------------------------------------- what it grows into (Wiktionary)

export interface SourcedComponent {
    char: string;
    form?: string;
    role?: "semantic" | "phonetic";
}

export interface FormulaPart {
    /** As written in the kanji: the radical in the page's own shape (氵, not 水). */
    char: string;
    /** sound: marked phonetic; meaning: marked semantic, or unmarked (the parts of an ideogrammic compound). */
    role: "meaning" | "sound";
    radical: boolean;
    /** Repeats in a row ("木 × 3"). */
    count: number;
}

const isRadical = (c: SourcedComponent, forms: readonly string[]) => forms.includes(c.form ?? c.char) || forms.includes(c.char);

/** A sourced origin builds on the radical: one of its parts is the radical, or (with no parts) its text names it. */
export function buildsOn(entry: { components: readonly SourcedComponent[]; text?: string }, forms: readonly string[]): boolean {
    if (entry.components.length > 0) return entry.components.some((c) => isRadical(c, forms));
    return forms.some((f) => !!entry.text?.includes(f));
}

/** The sourced parts as a formula, repeats collapsed and the radical written as `radicalChar`. */
export function growthFormula(components: readonly SourcedComponent[], radicalChar: string, forms: readonly string[]): FormulaPart[] {
    const parts: FormulaPart[] = [];
    for (const c of components) {
        const radical = isRadical(c, forms);
        const char = radical ? radicalChar : (c.form ?? c.char);
        const role = c.role === "phonetic" ? "sound" : "meaning";
        const prev = parts[parts.length - 1];
        if (prev && prev.char === char && prev.role === role) prev.count++;
        else parts.push({ char, role, radical, count: 1 });
    }
    return parts;
}

/** The radical alone, repeated (林 = 木 + 木, 森 = 木 × 3). */
export function onlyRadical(formula: readonly FormulaPart[]): boolean {
    return formula.length > 0 && formula.every((p) => p.radical) && formula.reduce((n, p) => n + p.count, 0) > 1;
}

/**
 * Orders sourced examples for "What it grows into": the radical repeated
 * first, then compounds of meaning and pictures, then sound compounds; those
 * with a sourced sentence before those without; else in the given order
 * (most common first). At most `limit`.
 */
export function rankGrowth<T extends { formation: string | null; text: string; formula?: readonly FormulaPart[] }>(items: readonly T[], limit: number): T[] {
    const tier = (item: T) =>
        (item.formula && onlyRadical(item.formula) ? -2 : 0) + (item.formation === "phono-semantic-compound" ? 2 : 0) + (item.text ? 0 : 1);
    return items
        .map((item, i) => ({ item, i }))
        .sort((a, b) => tier(a.item) - tier(b.item) || a.i - b.i)
        .slice(0, limit)
        .map(({ item }) => item);
}
