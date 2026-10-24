// Browse filters: URL query params <-> filter state, and the filter/sort
// itself. Pure and client-safe (used by the server page and the client island).

import type { JlptLevel } from "../../lib/atlas/types.ts";
import { getCategorySlug } from "../../lib/atlas/categories.ts";

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
}

export type BrowseSort = "jlpt" | "frequency" | "strokes";

export interface BrowseFilters {
    /** Selected levels; empty means all. Kept in N5→N1 order. */
    jlpt: JlptLevel[];
    minStrokes: number;
    maxStrokes: number;
    sort: BrowseSort;
    theme: string | null;
    radical: string | null;
}

export const ALL_LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
export const SORTS: { id: BrowseSort; label: string }[] = [
    { id: "jlpt", label: "JLPT level" },
    { id: "frequency", label: "Frequency" },
    { id: "strokes", label: "Stroke count" },
];
export const MIN_STROKES = 1;
export const MAX_STROKES = 30;
export const PAGE_SIZE = 120;

export const DEFAULT_FILTERS: BrowseFilters = {
    jlpt: [],
    minStrokes: MIN_STROKES,
    maxStrokes: MAX_STROKES,
    sort: "jlpt",
    theme: null,
    radical: null,
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
// Theme slugs use "-", radical keys may use "_" (hi_fire, ki_yellow).
const slugLike = (v: string | undefined) => (v && /^[a-z0-9_-]{1,64}$/.test(v) ? v : null);

function parseLevels(value: string | undefined): JlptLevel[] {
    if (!value) return [];
    const wanted = new Set(
        value
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .map((s) => (/^[1-5]$/.test(s) ? `N${s}` : s)),
    );
    return ALL_LEVELS.filter((l) => wanted.has(l));
}

function parseStrokes(value: string | undefined, fallback: number): number {
    const n = Number.parseInt(value ?? "", 10);
    return Number.isFinite(n) ? clamp(n, MIN_STROKES, MAX_STROKES) : fallback;
}

/** Reads `?jlpt=N5,N4&min=1&max=10&sort=strokes&theme=…&radical=…`. Unknown values fall back to defaults. */
export function parseBrowseParams(params: RawParams): BrowseFilters {
    const sortParam = first(params.sort);
    let minStrokes = parseStrokes(first(params.min), MIN_STROKES);
    let maxStrokes = parseStrokes(first(params.max), MAX_STROKES);
    if (minStrokes > maxStrokes) [minStrokes, maxStrokes] = [maxStrokes, minStrokes];
    const jlpt = parseLevels(first(params.jlpt));
    return {
        // Selecting every level is the same as no level filter.
        jlpt: jlpt.length === ALL_LEVELS.length ? [] : jlpt,
        minStrokes,
        maxStrokes,
        sort: SORTS.some((s) => s.id === sortParam) ? (sortParam as BrowseSort) : DEFAULT_FILTERS.sort,
        theme: slugLike(first(params.theme)),
        radical: slugLike(first(params.radical)),
    };
}

/** Inverse of parseBrowseParams; omits defaults. Returns "" or "?…". */
export function toBrowseQuery(filters: BrowseFilters): string {
    const params = new URLSearchParams();
    if (filters.jlpt.length && filters.jlpt.length < ALL_LEVELS.length) params.set("jlpt", filters.jlpt.join(","));
    if (filters.minStrokes !== MIN_STROKES) params.set("min", String(filters.minStrokes));
    if (filters.maxStrokes !== MAX_STROKES) params.set("max", String(filters.maxStrokes));
    if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
    if (filters.theme) params.set("theme", filters.theme);
    if (filters.radical) params.set("radical", filters.radical);
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

const levelRank = (l: JlptLevel) => ALL_LEVELS.indexOf(l);
const byFrequency = (a: BrowseKanji, b: BrowseKanji) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity);

const SORTERS: Record<BrowseSort, (a: BrowseKanji, b: BrowseKanji) => number> = {
    jlpt: (a, b) => levelRank(a.jlpt) - levelRank(b.jlpt) || byFrequency(a, b) || a.strokeCount - b.strokeCount,
    frequency: (a, b) => byFrequency(a, b) || levelRank(a.jlpt) - levelRank(b.jlpt) || a.strokeCount - b.strokeCount,
    strokes: (a, b) => a.strokeCount - b.strokeCount || byFrequency(a, b) || levelRank(a.jlpt) - levelRank(b.jlpt),
};

export function applyBrowseFilters(items: readonly BrowseKanji[], filters: BrowseFilters): BrowseKanji[] {
    const levels = filters.jlpt.length ? new Set(filters.jlpt) : null;
    const out = items.filter(
        (k) =>
            (!levels || levels.has(k.jlpt)) &&
            k.strokeCount >= filters.minStrokes &&
            k.strokeCount <= filters.maxStrokes &&
            (!filters.theme || k.theme === filters.theme) &&
            (!filters.radical || k.radical === filters.radical),
    );
    return out.sort((a, b) => SORTERS[filters.sort](a, b) || (a.char < b.char ? -1 : a.char > b.char ? 1 : 0));
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
    };
}
