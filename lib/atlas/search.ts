// Pure kanji search over the slim index (public/data/search-index.json).
// Client-safe: no data imports. Relative imports carry `.ts` so the Node
// test runner can load this file directly.

import { toHiragana } from "wanakana";
import { normalizeKana, plainReading, splitReading } from "./readings.ts";

/** One entry of public/data/search-index.json (see scripts/build-kanji-atlas.mjs). */
export interface SearchIndexEntry {
    /** The kanji character. */
    c: string;
    /** English meanings. */
    m: string[];
    /** On'yomi in katakana. */
    on: string[];
    /** Kun'yomi in hiragana, KANJIDIC notation (`ふる.い`, `-か`, `ふる-`). */
    kun: string[];
    /** JLPT level as a number, 5 (N5) … 1 (N1). */
    j: number;
    /** Stroke count. */
    s: number;
    /** Frequency rank (1 = most common), null when unknown. */
    f: number | null;
}

export type SearchMatchKind = "kanji" | "meaning" | "reading";

export interface SearchResult {
    entry: SearchIndexEntry;
    score: number;
    match: SearchMatchKind;
}

export interface SearchOptions {
    /** Maximum number of results (default 50). */
    limit?: number;
}

// Match-quality scores. Kanji typed directly always win; within text matches,
// typed kana beats romaji and an exact English meaning beats a reading.
const SCORE = {
    kanji: 1000,
    meaningExact: 100,
    kanaExact: 95,
    romajiExact: 85,
    meaningWordPrefix: 70,
    kanaPrefix: 60,
    romajiPrefix: 50,
    meaningSubstring: 40,
} as const;

const KANJI_RE = /[\p{Script=Han}々]/u;
const KANJI_GLOBAL_RE = /[\p{Script=Han}々]/gu;
const KANA_ONLY_RE = /^[ぁ-ゟー]+$/;
const ROMAJI_ONLY_RE = /^[a-z']+$/;

function meaningScore(meanings: string[], q: string): number {
    let best = 0;
    for (const raw of meanings) {
        const m = raw.toLowerCase();
        if (m === q) return SCORE.meaningExact;
        const at = m.indexOf(q);
        if (at === -1) continue;
        // Word prefix: the match starts the meaning or follows a non-letter.
        const wordStart = at === 0 || !/[a-z0-9]/.test(m[at - 1]);
        best = Math.max(best, wordStart ? SCORE.meaningWordPrefix : SCORE.meaningSubstring);
    }
    return best;
}

/** Comparable forms of a reading: the whole word and, for `ふる.い`, the stem. */
function readingForms(reading: string): string[] {
    const full = normalizeKana(reading);
    const { stem } = splitReading(reading);
    const stemForm = normalizeKana(stem);
    return stemForm && stemForm !== full ? [full, stemForm] : [full];
}

function readingScore(entry: SearchIndexEntry, kana: string, exact: number, prefix: number): number {
    let best = 0;
    for (const reading of [...entry.kun, ...entry.on]) {
        for (const form of readingForms(reading)) {
            if (form === kana) return exact;
            if (form.startsWith(kana)) best = prefix;
        }
    }
    return best;
}

function compareResults(a: SearchResult, b: SearchResult): number {
    if (a.score !== b.score) return b.score - a.score;
    const fa = a.entry.f ?? Infinity;
    const fb = b.entry.f ?? Infinity;
    if (fa !== fb) return fa - fb;
    if (a.entry.j !== b.entry.j) return b.entry.j - a.entry.j; // N5 first
    return a.entry.c < b.entry.c ? -1 : a.entry.c > b.entry.c ? 1 : 0;
}

/**
 * Searches the slim kanji index.
 *
 * - Every kanji character in the query is a hit, in query order, ranked first.
 * - English meanings: exact > word prefix > substring (case-insensitive).
 * - Kana readings (katakana and hiragana alike, KANJIDIC `.`/`-` ignored): exact > prefix.
 * - Romaji is converted to hiragana and matched against readings.
 *
 * Ties are broken by frequency (unknown last), then JLPT (N5 first).
 */
export function searchKanji(index: readonly SearchIndexEntry[], query: string, options: SearchOptions = {}): SearchResult[] {
    const limit = options.limit ?? 50;
    const q = query.trim().toLowerCase();
    if (!q || limit <= 0) return [];

    const results: SearchResult[] = [];
    const seen = new Set<string>();

    // 1. Kanji characters typed directly, in query order.
    if (KANJI_RE.test(q)) {
        const byChar = new Map(index.map((e) => [e.c, e]));
        const chars = q.match(KANJI_GLOBAL_RE) ?? [];
        chars.forEach((char, i) => {
            const entry = byChar.get(char);
            if (!entry || seen.has(char)) return;
            seen.add(char);
            results.push({ entry, score: SCORE.kanji + chars.length - i, match: "kanji" });
        });
    }

    // 2. Text matching on whatever isn't kanji.
    const text = q.replace(KANJI_GLOBAL_RE, " ").replace(/\s+/g, " ").trim();
    if (text) {
        const compact = text.replace(/[\s.\-]/g, "");
        const kana = normalizeKana(compact);
        const isKana = KANA_ONLY_RE.test(kana);
        let romajiKana = "";
        if (!isKana && ROMAJI_ONLY_RE.test(compact)) {
            const converted = plainReading(toHiragana(compact));
            if (KANA_ONLY_RE.test(converted)) romajiKana = converted;
        }

        const textHits: SearchResult[] = [];
        for (const entry of index) {
            if (seen.has(entry.c)) continue;
            const meaning = isKana ? 0 : meaningScore(entry.m, text);
            let reading = 0;
            if (isKana) reading = readingScore(entry, kana, SCORE.kanaExact, SCORE.kanaPrefix);
            else if (romajiKana) reading = readingScore(entry, romajiKana, SCORE.romajiExact, SCORE.romajiPrefix);
            const score = Math.max(meaning, reading);
            if (score > 0) textHits.push({ entry, score, match: meaning >= reading ? "meaning" : "reading" });
        }
        textHits.sort(compareResults);
        results.push(...textHits);
    }

    return results.slice(0, limit);
}
