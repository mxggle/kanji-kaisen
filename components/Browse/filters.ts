// Browse filters: URL query params <-> filter state, and the filter/sort
// itself. Pure and client-safe (used by the server page and the client island).

import { toHiragana } from "wanakana";
import type { JlptLevel } from "../../lib/atlas/types.ts";
import { CATEGORIES, THEME_SHORT, getCategoryFromSlug, getCategorySlug, type CategoryName } from "../../lib/atlas/categories.ts";
import { normalizeKana, splitReading } from "../../lib/atlas/readings.ts";
import { SHADES, SHADE_JP, SHADE_NAMES, type Shade } from "../../lib/ink.ts";
import { MAX_SET_KANJI, cleanTitle } from "../../lib/teach-set.ts";

/** Slim per-kanji record sent to the browse client (no examples). */
export interface BrowseKanji {
    char: string;
    meanings: string[];
    jlpt: JlptLevel;
    strokeCount: number;
    frequency: number | null;
    onyomi: string[];
    kunyomi: string[];
    /** Theme slug, e.g. "nature-elements". */
    theme: string | null;
    /** Radical key, e.g. "sanzui". */
    radical: string | null;
    /** Every reading as plain hiragana, kun stems included, space separated ("せい しょう あお あおい"). */
    readings: string;
}

export type BrowseSort = "jlpt" | "frequency" | "strokes";

export interface BrowseFilters {
    /** Selected levels; empty means all. Kept in N5→N1 order. */
    jlpt: JlptLevel[];
    minStrokes: number;
    maxStrokes: number;
    sort: BrowseSort;
    /** Theme slugs in path order; empty means all. */
    themes: string[];
    radical: string | null;
    /** Ink shades, lowest first; empty means any. Applied once the ink store hydrates. */
    ink: Shade[];
    /** A reading as typed: セイ, sei or やす. Matched against whole readings and kun stems. */
    reading: string | null;
}

export const ALL_LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
export const SORTS: { id: BrowseSort; label: string }[] = [
    { id: "jlpt", label: "JLPT level" },
    { id: "frequency", label: "Most used first" },
    { id: "strokes", label: "Fewest strokes" },
];
export const MIN_STROKES = 1;
export const MAX_STROKES = 30;
export const PAGE_SIZE = 120;
/** Longest reading the filter keeps. */
export const MAX_READING_LENGTH = 24;

/** The ten theme slugs, in path order. */
export const THEME_SLUGS: string[] = CATEGORIES.map(getCategorySlug);

export const DEFAULT_FILTERS: BrowseFilters = {
    jlpt: [],
    minStrokes: MIN_STROKES,
    maxStrokes: MAX_STROKES,
    sort: "jlpt",
    themes: [],
    radical: null,
    ink: [],
    reading: null,
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const commaList = (value: string | undefined) => (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
// Radical keys use lowercase letters, digits, "-" and "_" (hi_fire, ki_yellow).
const slugLike = (v: string | undefined) => (v && /^[a-z0-9_-]{1,64}$/.test(v) ? v : null);

function parseLevels(value: string | undefined): JlptLevel[] {
    const wanted = new Set(commaList(value).map((s) => s.toUpperCase()).map((s) => (/^[1-5]$/.test(s) ? `N${s}` : s)));
    const levels = ALL_LEVELS.filter((l) => wanted.has(l));
    // Selecting every level is the same as no level filter.
    return levels.length === ALL_LEVELS.length ? [] : levels;
}

/** `theme=nature-elements` or `theme=nature-elements,time-sequence`. Unknown slugs are dropped. */
function parseThemes(value: string | undefined): string[] {
    const wanted = new Set(commaList(value).map((s) => s.toLowerCase()));
    return THEME_SLUGS.filter((slug) => wanted.has(slug));
}

/** `ink=0,1`: shades 0–4. Anything else is dropped; all five is no filter. */
function parseInk(value: string | undefined): Shade[] {
    const wanted = new Set(commaList(value).filter((s) => /^[0-4]$/.test(s)).map(Number));
    const shades = SHADES.filter((s) => wanted.has(s));
    return shades.length === SHADES.length ? [] : shades;
}

// Kana (incl. ー), romaji with Hepburn macrons, and the notation people paste (やす.む, -か).
const READING_RE = /^[\p{Script=Hiragana}\p{Script=Katakana}ーa-zāīūēō' .-]+$/u;

/** A reading as typed, trimmed and lowercased; null when empty, too long or not kana/romaji. */
export function parseReading(value: string | undefined): string | null {
    const reading = (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
    if (!reading || reading.length > MAX_READING_LENGTH || !READING_RE.test(reading)) return null;
    return reading;
}

function parseStrokes(value: string | undefined, fallback: number): number {
    const n = Number.parseInt(value ?? "", 10);
    return Number.isFinite(n) ? clamp(n, MIN_STROKES, MAX_STROKES) : fallback;
}

/**
 * Reads `?jlpt=N5,N4&min=1&max=10&sort=strokes&theme=…,…&radical=…&ink=0,1&reading=sei`.
 * Unknown values fall back to defaults.
 */
export function parseBrowseParams(params: RawParams): BrowseFilters {
    const sortParam = first(params.sort);
    let minStrokes = parseStrokes(first(params.min), MIN_STROKES);
    let maxStrokes = parseStrokes(first(params.max), MAX_STROKES);
    if (minStrokes > maxStrokes) [minStrokes, maxStrokes] = [maxStrokes, minStrokes];
    return {
        jlpt: parseLevels(first(params.jlpt)),
        minStrokes,
        maxStrokes,
        sort: SORTS.some((s) => s.id === sortParam) ? (sortParam as BrowseSort) : DEFAULT_FILTERS.sort,
        themes: parseThemes(first(params.theme)),
        radical: slugLike(first(params.radical)),
        ink: parseInk(first(params.ink)),
        reading: parseReading(first(params.reading)),
    };
}

/** Inverse of parseBrowseParams; omits defaults. Returns "" or "?…". */
export function toBrowseQuery(filters: BrowseFilters): string {
    const params = new URLSearchParams();
    if (filters.jlpt.length && filters.jlpt.length < ALL_LEVELS.length) params.set("jlpt", filters.jlpt.join(","));
    if (filters.minStrokes !== MIN_STROKES) params.set("min", String(filters.minStrokes));
    if (filters.maxStrokes !== MAX_STROKES) params.set("max", String(filters.maxStrokes));
    if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
    if (filters.themes.length) params.set("theme", filters.themes.join(","));
    if (filters.radical) params.set("radical", filters.radical);
    if (filters.ink.length && filters.ink.length < SHADES.length) params.set("ink", filters.ink.join(","));
    if (filters.reading) params.set("reading", filters.reading);
    // Keep "N5,N4" readable instead of "N5%2CN4".
    const qs = params.toString().replace(/%2C/g, ",");
    return qs ? `?${qs}` : "";
}

/** Page heading / title for the filters. */
export function browseHeading(filters: BrowseFilters) {
    return filters.jlpt.length === 1 ? `JLPT ${filters.jlpt[0]} kanji` : "Browse kanji";
}

export function isDefaultFilters(filters: BrowseFilters): boolean {
    return toBrowseQuery(filters) === "";
}

/** Clamps and orders a stroke range: the bound that just moved wins. */
export function withStrokes(filters: BrowseFilters, patch: { minStrokes?: number; maxStrokes?: number }): BrowseFilters {
    const next = { ...filters, ...patch };
    next.minStrokes = clamp(Math.round(next.minStrokes) || MIN_STROKES, MIN_STROKES, MAX_STROKES);
    next.maxStrokes = clamp(Math.round(next.maxStrokes) || MAX_STROKES, MIN_STROKES, MAX_STROKES);
    if (next.minStrokes > next.maxStrokes) {
        if (patch.minStrokes !== undefined) next.maxStrokes = next.minStrokes;
        else next.minStrokes = next.maxStrokes;
    }
    return next;
}

// Hepburn macrons, as the search box reads them: "sē" -> "sei", "kō" -> "kou".
const MACRONS: Record<string, string> = { ā: "aa", ī: "ii", ū: "uu", ē: "ei", ō: "ou" };

/** The typed reading as plain hiragana ("セイ", "sei" -> "せい"), or null when it isn't one yet ("sh"). */
export function readingKey(reading: string | null): string | null {
    if (!reading) return null;
    const compact = reading.replace(/[\s.\-]/g, "").replace(/[āīūēō]/g, (c) => MACRONS[c]);
    const kana = normalizeKana(toHiragana(compact, { passRomaji: false }));
    return /^[ぁ-ゟー]+$/.test(kana) ? kana : null;
}

/** Every reading of a kanji as plain hiragana: on'yomi, whole kun'yomi and kun stems. */
export function readingForms(onyomi: readonly string[], kunyomi: readonly string[]): string {
    const forms = new Set<string>();
    for (const on of onyomi) forms.add(normalizeKana(on));
    for (const kun of kunyomi) {
        const { stem, okurigana } = splitReading(kun);
        forms.add(normalizeKana(stem + okurigana));
        if (okurigana) forms.add(normalizeKana(stem));
    }
    forms.delete("");
    return [...forms].join(" ");
}

const levelRank = (l: JlptLevel) => ALL_LEVELS.indexOf(l);
const byFrequency = (a: BrowseKanji, b: BrowseKanji) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity);

const SORTERS: Record<BrowseSort, (a: BrowseKanji, b: BrowseKanji) => number> = {
    jlpt: (a, b) => levelRank(a.jlpt) - levelRank(b.jlpt) || byFrequency(a, b) || a.strokeCount - b.strokeCount,
    frequency: (a, b) => byFrequency(a, b) || levelRank(a.jlpt) - levelRank(b.jlpt) || a.strokeCount - b.strokeCount,
    strokes: (a, b) => a.strokeCount - b.strokeCount || byFrequency(a, b) || levelRank(a.jlpt) - levelRank(b.jlpt),
};

export interface ApplyOptions {
    /**
     * The learner's shade per kanji. Without it the ink filter is skipped, so the
     * server and the first client render (before the ink store hydrates) show everything.
     */
    shadeOf?: (char: string) => Shade;
}

/** One predicate per filter group, so counts can leave one group out. */
function matchers(filters: BrowseFilters, { shadeOf }: ApplyOptions) {
    const levels = filters.jlpt.length ? new Set(filters.jlpt) : null;
    const themes = filters.themes.length ? new Set(filters.themes) : null;
    const ink = filters.ink.length ? new Set<Shade>(filters.ink) : null;
    // A reading that isn't kana yet ("sh") matches nothing rather than everything.
    const key = filters.reading ? readingKey(filters.reading) : null;
    const reading = filters.reading ? ` ${key ?? "\u0000"} ` : null;
    return {
        jlpt: (k: BrowseKanji) => !levels || levels.has(k.jlpt),
        rest: (k: BrowseKanji) =>
            k.strokeCount >= filters.minStrokes &&
            k.strokeCount <= filters.maxStrokes &&
            (!themes || (k.theme !== null && themes.has(k.theme))) &&
            (!filters.radical || k.radical === filters.radical) &&
            (!reading || ` ${k.readings} `.includes(reading)) &&
            (!ink || !shadeOf || ink.has(shadeOf(k.char))),
    };
}

export function applyBrowseFilters(items: readonly BrowseKanji[], filters: BrowseFilters, options: ApplyOptions = {}): BrowseKanji[] {
    const match = matchers(filters, options);
    const out = items.filter((k) => match.jlpt(k) && match.rest(k));
    return out.sort((a, b) => SORTERS[filters.sort](a, b) || (a.char < b.char ? -1 : a.char > b.char ? 1 : 0));
}

export type LevelCounts = Record<JlptLevel | "all", number>;

/** How many kanji each JLPT chip would show, given every other filter. */
export function levelCounts(items: readonly BrowseKanji[], filters: BrowseFilters, options: ApplyOptions = {}): LevelCounts {
    const match = matchers(filters, options);
    const counts: LevelCounts = { all: 0, N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    for (const k of items) {
        if (!match.rest(k)) continue;
        counts.all += 1;
        counts[k.jlpt] += 1;
    }
    return counts;
}

/** Slim record for the client from a full atlas kanji. */
export function toBrowseKanji(k: {
    char: string;
    meanings: string[];
    jlpt: JlptLevel;
    strokeCount: number;
    frequency: number | null;
    onyomi: string[];
    kunyomi: string[];
    category: string | null;
    radical: { key: string } | null;
}): BrowseKanji {
    return {
        char: k.char,
        meanings: k.meanings.slice(0, 2),
        jlpt: k.jlpt,
        strokeCount: k.strokeCount,
        frequency: k.frequency,
        onyomi: k.onyomi.slice(0, 1),
        kunyomi: k.kunyomi.slice(0, 1),
        theme: k.category ? getCategorySlug(k.category) : null,
        radical: k.radical?.key ?? null,
        readings: readingForms(k.onyomi, k.kunyomi),
    };
}

/** The theme name for a slug ("nature-elements" -> "Nature & Elements"), or null. */
export function themeName(slug: string | null): CategoryName | null {
    return slug ? getCategoryFromSlug(slug) ?? null : null;
}

/** One removable tag per active filter value. */
export interface FilterTag {
    key: string;
    label: string;
    /** Set on theme tags: the theme name, for its dot. */
    theme?: CategoryName;
    /** Set on ink tags: the shade, for its swatch. */
    shade?: Shade;
    /** The filters with this value removed. */
    without: BrowseFilters;
}

function strokesLabel(min: number, max: number): string {
    if (min === max) return `${min} stroke${min === 1 ? "" : "s"}`;
    if (max === MAX_STROKES) return `${min}+ strokes`;
    if (min === MIN_STROKES) return `Up to ${max} strokes`;
    return `${min}–${max} strokes`;
}

/**
 * The active filters as tags, in rail order. `radicalLabel` names a radical
 * key ("氵 water"); without one the key itself is shown.
 */
export function filterTags(filters: BrowseFilters, radicalLabel?: (key: string) => string | null | undefined): FilterTag[] {
    const tags: FilterTag[] = [];
    for (const level of filters.jlpt) {
        tags.push({ key: `jlpt-${level}`, label: level, without: { ...filters, jlpt: filters.jlpt.filter((l) => l !== level) } });
    }
    for (const slug of filters.themes) {
        const theme = themeName(slug);
        if (!theme) continue;
        tags.push({ key: `theme-${slug}`, label: THEME_SHORT[theme], theme, without: { ...filters, themes: filters.themes.filter((t) => t !== slug) } });
    }
    for (const shade of filters.ink) {
        tags.push({ key: `ink-${shade}`, label: `${SHADE_JP[shade]} ${SHADE_NAMES[shade]}`, shade, without: { ...filters, ink: filters.ink.filter((s) => s !== shade) } });
    }
    if (filters.minStrokes !== MIN_STROKES || filters.maxStrokes !== MAX_STROKES) {
        tags.push({
            key: "strokes",
            label: strokesLabel(filters.minStrokes, filters.maxStrokes),
            without: { ...filters, minStrokes: MIN_STROKES, maxStrokes: MAX_STROKES },
        });
    }
    if (filters.radical) {
        tags.push({ key: "radical", label: radicalLabel?.(filters.radical) ?? filters.radical, without: { ...filters, radical: null } });
    }
    if (filters.reading) {
        tags.push({ key: "reading", label: `Read ${filters.reading}`, without: { ...filters, reading: null } });
    }
    return tags;
}

/** Most kanji a /study?chars= or /teach?k= link carries (the teacher set contract). */
export const MAX_LINK_KANJI = MAX_SET_KANJI;

export interface SetLink {
    href: string;
    /** How many kanji the link opens. */
    count: number;
    /** True when the link holds only the first MAX_LINK_KANJI of the results. */
    capped: boolean;
}

const onlyChanged = (filters: BrowseFilters, keys: (keyof BrowseFilters)[]) => {
    const rest = { ...filters, sort: DEFAULT_FILTERS.sort };
    for (const k of keys) (rest as Record<string, unknown>)[k] = DEFAULT_FILTERS[k];
    return isDefaultFilters(rest);
};

/** A short title for a set made from these filters: "N5 · Nature · 1–5 strokes". */
export function setTitle(filters: BrowseFilters, radicalLabel?: (key: string) => string | null | undefined): string {
    const labels = filterTags(filters, radicalLabel).map((t) => t.label);
    return cleanTitle(labels.length ? labels.join(" · ") : "All kanji");
}

/**
 * "Study these N". When the filters are exactly one existing deck (one JLPT
 * level, one theme or one radical) the link opens that whole deck; otherwise
 * it carries the first 60 kanji in the current order, since /study?chars= holds
 * at most 60.
 */
export function studyLink(filters: BrowseFilters, chars: readonly string[], title: string): SetLink {
    if (filters.jlpt.length === 1 && onlyChanged(filters, ["jlpt"])) {
        return { href: `/study?jlpt=${filters.jlpt[0]}`, count: chars.length, capped: false };
    }
    if (filters.themes.length === 1 && onlyChanged(filters, ["themes"])) {
        return { href: `/study?theme=${filters.themes[0]}`, count: chars.length, capped: false };
    }
    if (filters.radical && onlyChanged(filters, ["radical"])) {
        return { href: `/study?radical=${encodeURIComponent(filters.radical)}`, count: chars.length, capped: false };
    }
    const picked = chars.slice(0, MAX_LINK_KANJI);
    const href = `/study?chars=${encodeURIComponent(picked.join(""))}&t=${encodeURIComponent(title)}`;
    return { href, count: picked.length, capped: chars.length > picked.length };
}

/** "Make a worksheet": /teach with the first 60 kanji and a title. */
export function teachLink(chars: readonly string[], title: string): SetLink {
    const picked = chars.slice(0, MAX_LINK_KANJI);
    return {
        href: `/teach?k=${encodeURIComponent(picked.join(""))}&t=${encodeURIComponent(title)}`,
        count: picked.length,
        capped: chars.length > picked.length,
    };
}
