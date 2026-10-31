// Teacher sets in the URL (no backend): `k` is the kanji concatenated and
// URL-encoded, `t` the title. Pure and client-safe; relative imports carry
// `.ts` so the Node test runner can load this file.
//
//   /teach/print?k=海泳&t=Lesson%207&paper=a4&key=1
//   /teach/present?k=海泳&t=Lesson%207
//   /set?k=海泳&t=Lesson%207

/** Most kanji a set can hold. */
export const MAX_SET_KANJI = 60;
/** Longest title, in characters. */
export const MAX_TITLE_LENGTH = 80;

export interface TeachSet {
    chars: string[];
    title: string;
}

export type SetKind = "print" | "present" | "set";
export type Paper = "a4" | "letter";

/** The atlas's known characters: a Set, any iterable, or a predicate. Omitted means "any kanji". */
export type KnownChars = ReadonlySet<string> | Iterable<string> | ((char: string) => boolean);

const KANJI_RE = /^[\p{Script=Han}々]$/u;

export function isKanji(char: string): boolean {
    return KANJI_RE.test(char);
}

function toPredicate(known?: KnownChars): (char: string) => boolean {
    if (!known) return () => true;
    if (typeof known === "function") return known;
    const set = known instanceof Set ? (known as ReadonlySet<string>) : new Set(known);
    return (char) => set.has(char);
}

/**
 * Kanji in `text`, in order: non-kanji, unknown and repeated characters are
 * dropped, then the list is capped at `max`.
 */
export function extractKanji(text: string, known?: KnownChars, max = MAX_SET_KANJI): string[] {
    const isKnown = toPredicate(known);
    const seen = new Set<string>();
    const result: string[] = [];
    for (const char of text) {
        if (result.length >= max) break;
        if (seen.has(char) || !isKanji(char) || !isKnown(char)) continue;
        seen.add(char);
        result.push(char);
    }
    return result;
}

// C0 controls and DEL.
const CONTROL_RE = new RegExp("[\\u0000-\\u001f\\u007f]", "g");

/** Trimmed, whitespace collapsed, control characters removed, at most 80 characters. */
export function cleanTitle(title: string | null | undefined): string {
    const clean = (title ?? "").replace(CONTROL_RE, " ").replace(/\s+/g, " ").trim();
    return Array.from(clean).slice(0, MAX_TITLE_LENGTH).join("").trim();
}

type SetLike = { chars: readonly string[] | string; title?: string | null };

/** Applies the URL contract to any set: kanji only, known, unique, capped; title cleaned. */
export function normalizeSet(set: SetLike, known?: KnownChars): TeachSet {
    const text = typeof set.chars === "string" ? set.chars : set.chars.join("");
    return { chars: extractKanji(text, known), title: cleanTitle(set.title) };
}

/** Query string without the leading `?`: `k=%E6%B5%B7&t=Lesson`. Empty when the set is empty. */
export function encodeSet(set: SetLike, known?: KnownChars): string {
    const { chars, title } = normalizeSet(set, known);
    if (chars.length === 0) return "";
    const parts = [`k=${encodeURIComponent(chars.join(""))}`];
    if (title) parts.push(`t=${encodeURIComponent(title)}`);
    return parts.join("&");
}

export type SetParams = URLSearchParams | string | Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined | null): string => (Array.isArray(value) ? value[0] ?? "" : value ?? "");

function readParam(params: SetParams, name: string): string {
    if (typeof params === "string") return new URLSearchParams(params.replace(/^\?/, "")).get(name) ?? "";
    if (params instanceof URLSearchParams) return params.get(name) ?? "";
    return firstValue(params[name]);
}

/** Reads `k` and `t` from a query string, URLSearchParams or Next.js searchParams. */
export function decodeSet(params: SetParams, known?: KnownChars): TeachSet {
    return normalizeSet({ chars: readParam(params, "k"), title: readParam(params, "t") }, known);
}

export function parsePaper(value: string | string[] | null | undefined): Paper {
    return firstValue(value).toLowerCase() === "letter" ? "letter" : "a4";
}

const SET_ROUTES: Record<SetKind, string> = {
    print: "/teach/print",
    present: "/teach/present",
    set: "/set",
};

export interface PrintOptions {
    paper?: Paper;
    answerKey?: boolean;
    /** False hides the "Read these words" section (`words=0`). */
    words?: boolean;
}

/** `/teach/print?…`, `/teach/present?…` or `/set?…` for a set. Print options only apply to `print`. */
export function setPath(kind: SetKind, set: SetLike, options: PrintOptions = {}): string {
    const parts = [encodeSet(set)].filter(Boolean);
    if (kind === "print") {
        if (options.paper) parts.push(`paper=${options.paper}`);
        if (options.answerKey) parts.push("key=1");
        if (options.words === false) parts.push("words=0");
    }
    const query = parts.join("&");
    return query ? `${SET_ROUTES[kind]}?${query}` : SET_ROUTES[kind];
}

// Example words for worksheets are served as static shards, so a one-kanji
// sheet doesn't download words for the whole atlas.

export const TEACH_WORDS_SHARDS = 16;

export function wordsShardOf(char: string): number {
    return (char.codePointAt(0) ?? 0) % TEACH_WORDS_SHARDS;
}

export const wordsShardPath = (shard: number) => `/data/teach-words/${shard}`;

export interface TeachWord {
    word: string;
    reading: string;
    meaning: string;
}

/** Shape of each words shard: at most two words per kanji. */
export type TeachWords = Record<string, TeachWord[]>;

export const MAX_TEACH_WORDS = 2;
const MAX_WORD_MEANING = 32;

// Two-kanji compounds make the best reading exercise, then longer words, then
// the kanji on its own (usually its kun'yomi).
const LENGTH_RANK = [Infinity, 2, 0, 1, 3];

/** First gloss of a meaning ("sea; ocean, marine" -> "sea"), shortened for a worksheet line. */
export function shortGloss(meaning: string): string {
    const gloss = meaning.split(/[;,]/)[0].replace(/\s+/g, " ").trim();
    return gloss.length > MAX_WORD_MEANING ? `${gloss.slice(0, MAX_WORD_MEANING - 1).trimEnd()}…` : gloss;
}

/**
 * Up to two words for "Read these words": regular readings only (no
 * jukujikun), containing the kanji, at most four characters; the source order
 * (most useful first) breaks ties.
 */
export function pickTeachWords(char: string, examples: readonly { word: string; reading: string; meaning: string; special?: boolean }[]): TeachWord[] {
    return examples
        .map((e, index) => ({ e, index, length: Array.from(e.word).length }))
        .filter(({ e, length }) => !e.special && e.word.includes(char) && e.reading && length <= 4)
        .sort((a, b) => LENGTH_RANK[a.length] - LENGTH_RANK[b.length] || a.index - b.index)
        .slice(0, MAX_TEACH_WORDS)
        .map(({ e }) => ({ word: e.word, reading: e.reading, meaning: shortGloss(e.meaning) }));
}

// Saved sets (localStorage "kanji-teach-sets").

export const SAVED_SETS_KEY = "kanji-teach-sets";
export const MAX_SAVED_SETS = 50;

export interface SavedSet {
    id: string;
    title: string;
    /** Kanji concatenated. */
    chars: string;
    savedAt: string;
}

/** Drops malformed entries from stored JSON. */
export function sanitizeSavedSets(value: unknown): SavedSet[] {
    if (!Array.isArray(value)) return [];
    const result: SavedSet[] = [];
    const ids = new Set<string>();
    for (const item of value) {
        if (result.length >= MAX_SAVED_SETS) break;
        if (!item || typeof item !== "object") continue;
        const { id, title, chars, savedAt } = item as Partial<SavedSet>;
        if (typeof id !== "string" || !id || ids.has(id)) continue;
        if (typeof chars !== "string" || typeof savedAt !== "string") continue;
        const kanji = extractKanji(chars);
        if (kanji.length === 0) continue;
        ids.add(id);
        result.push({ id, title: cleanTitle(typeof title === "string" ? title : ""), chars: kanji.join(""), savedAt });
    }
    return result;
}

/**
 * Saves a set at the top of the list. A set with the same (non-empty) title
 * replaces the older one, so saving a lesson twice doesn't duplicate it.
 */
export function upsertSavedSet(sets: readonly SavedSet[], set: SetLike, now = new Date()): SavedSet[] {
    const normalized = normalizeSet(set);
    if (normalized.chars.length === 0) return [...sets];
    const sameTitle = normalized.title ? sets.find((s) => s.title === normalized.title) : undefined;
    const entry: SavedSet = {
        id: sameTitle?.id ?? `s${now.getTime().toString(36)}`,
        title: normalized.title,
        chars: normalized.chars.join(""),
        savedAt: now.toISOString(),
    };
    return [entry, ...sets.filter((s) => s.id !== entry.id)].slice(0, MAX_SAVED_SETS);
}

export function removeSavedSet(sets: readonly SavedSet[], id: string): SavedSet[] {
    return sets.filter((s) => s.id !== id);
}

/** Moves the item at `from` to index `to` (clamped). Returns a new array. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
    const target = Math.max(0, Math.min(items.length - 1, to));
    if (from < 0 || from >= items.length || target === from) return [...items];
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(target, 0, item);
    return next;
}

/** The radical key every kanji shares, or null (needs at least two kanji). */
export function sharedRadical(chars: readonly string[], radicalOf: (char: string) => string | null | undefined): string | null {
    if (chars.length < 2) return null;
    const first = radicalOf(chars[0]);
    if (!first) return null;
    return chars.every((c) => radicalOf(c) === first) ? first : null;
}
