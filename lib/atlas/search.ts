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
        readingForms(reading).forEach((form, i) => {
            // A whole-reading match (ひと for 人) beats an okurigana-less stem (ひと.つ for 一).
            if (form === kana) best = Math.max(best, i === 0 ? exact : exact - 2);
            else if (form.startsWith(kana)) best = Math.max(best, prefix);
        });
    }
    return best;
}

// KANJIDIC meanings are bare ("eat", "sea"), so "to eat" / "the sea" drop the lead word.
const LEADING_FILLER_RE = /^(?:to|a|an|the)\s+(?=\S)/;

// Hepburn macrons: "kūki" -> "kuuki". ō and ē are ambiguous (おう/おお, えい/ええ),
// so both spellings are tried.
const MACRON_SPELLINGS: Record<string, string>[] = [
    { ā: "aa", ī: "ii", ū: "uu", ē: "ei", ō: "ou" },
    { ā: "aa", ī: "ii", ū: "uu", ē: "ee", ō: "oo" },
];
const macronSpellings = (text: string) =>
    [...new Set(MACRON_SPELLINGS.map((map) => text.replace(/[āīūēō]/g, (c) => map[c])))];

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
        const meaningQuery = text.replace(LEADING_FILLER_RE, "");
        const compact = text.replace(/[\s.\-]/g, "");
        const kana = normalizeKana(compact);
        const isKana = KANA_ONLY_RE.test(kana);
        const romajiKana: string[] = [];
        if (!isKana) {
            for (const spelling of macronSpellings(compact)) {
                if (!ROMAJI_ONLY_RE.test(spelling)) continue;
                const converted = plainReading(toHiragana(spelling));
                if (KANA_ONLY_RE.test(converted)) romajiKana.push(converted);
            }
        }

        const textHits: SearchResult[] = [];
        for (const entry of index) {
            if (seen.has(entry.c)) continue;
            const meaning = isKana ? 0 : Math.max(meaningScore(entry.m, text), meaningScore(entry.m, meaningQuery));
            let reading = 0;
            if (isKana) reading = readingScore(entry, kana, SCORE.kanaExact, SCORE.kanaPrefix);
            else for (const r of romajiKana) reading = Math.max(reading, readingScore(entry, r, SCORE.romajiExact, SCORE.romajiPrefix));
            const score = Math.max(meaning, reading);
            if (score > 0) textHits.push({ entry, score, match: meaning >= reading ? "meaning" : "reading" });
        }
        textHits.sort(compareResults);
        results.push(...textHits);
    }

    return results.slice(0, limit);
}
