// Study deck/session helpers: query params <-> deck request, session slicing,
// shuffling and quiz candidates. Pure and client-safe (used by the server page
// and the client session).

import type { JlptLevel } from "../../lib/atlas/types.ts";
import type { QuizCandidate } from "../../lib/atlas/quiz.ts";
import type { SearchIndexEntry } from "../../lib/atlas/search.ts";

/** Cards per session. Larger decks are studied in consecutive chunks of this size. */
export const SESSION_SIZE = 20;

export type StudyMode = "flashcards" | "quiz";

export type DeckRequest =
    | { kind: "list" }
    | { kind: "learning" }
    | { kind: "jlpt"; level: JlptLevel }
    | { kind: "radical"; key: string }
    | { kind: "theme"; slug: string };

export type StudyParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();

export function parseMode(value: string | string[] | undefined): StudyMode | null {
    const mode = first(value).toLowerCase();
    return mode === "flashcards" || mode === "quiz" ? mode : null;
}

/** "N5", "n5" and "5" all mean N5. */
export function parseJlpt(value: string): JlptLevel | null {
    const match = /^n?([1-5])$/i.exec(value.trim());
    return match ? (`N${match[1]}` as JlptLevel) : null;
}

export interface ParsedStudyParams {
    request: DeckRequest | null;
    /** True when a deck param was given but can't be understood (e.g. `?jlpt=N9`, `?deck=foo`). */
    invalid: boolean;
    mode: StudyMode | null;
}

/** First matching param wins: deck, then jlpt, radical, theme. */
export function parseStudyParams(params: StudyParams): ParsedStudyParams {
    const mode = parseMode(params.mode);
    const deck = first(params.deck).toLowerCase();
    const jlpt = first(params.jlpt);
    const radical = first(params.radical);
    const theme = first(params.theme);

    if (deck) {
        if (deck === "list" || deck === "learning") return { request: { kind: deck }, invalid: false, mode };
        return { request: null, invalid: true, mode };
    }
    if (jlpt) {
        const level = parseJlpt(jlpt);
        return level ? { request: { kind: "jlpt", level }, invalid: false, mode } : { request: null, invalid: true, mode };
    }
    if (radical) return { request: { kind: "radical", key: radical }, invalid: false, mode };
    if (theme) return { request: { kind: "theme", slug: theme.toLowerCase() }, invalid: false, mode };
    return { request: null, invalid: false, mode };
}

/** `/study?...` for a deck, keeping the mode when given. */
export function studyPath(request: DeckRequest | null, mode?: StudyMode | null): string {
    const params = new URLSearchParams();
    if (request) {
        if (request.kind === "list" || request.kind === "learning") params.set("deck", request.kind);
        else if (request.kind === "jlpt") params.set("jlpt", request.level);
        else if (request.kind === "radical") params.set("radical", request.key);
        else params.set("theme", request.slug);
    }
    if (mode) params.set("mode", mode);
    const query = params.toString();
    return query ? `/study?${query}` : "/study";
}

export interface SessionRange {
    start: number;
    end: number;
    label: string;
}

/** Consecutive chunks of `size` cards: 1–20, 21–40, … */
export function sessionRanges(total: number, size = SESSION_SIZE): SessionRange[] {
    const ranges: SessionRange[] = [];
    for (let start = 0; start < total; start += size) {
        const end = Math.min(start + size, total);
        ranges.push({ start, end, label: end - start === 1 ? `${start + 1}` : `${start + 1}–${end}` });
    }
    return ranges;
}

/** Small seeded PRNG (mulberry32) so shuffles are reproducible in tests. */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Fisher–Yates shuffle into a new array. */
export function shuffled<T>(items: readonly T[], seed: number): T[] {
    const random = mulberry32(seed);
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export const jlptLevelOf = (j: number): JlptLevel => `N${Math.min(5, Math.max(1, Math.round(j) || 1))}` as JlptLevel;

/** Short meaning label used as a quiz option: up to three meanings. */
export function meaningLabel(meanings: readonly string[]): string {
    return meanings.slice(0, 3).join(", ");
}

export function toQuizCandidate(entry: SearchIndexEntry, category: string | null): QuizCandidate {
    return {
        char: entry.c,
        meaning: meaningLabel(entry.m),
        jlpt: jlptLevelOf(entry.j),
        strokeCount: entry.s,
        category,
    };
}

/** Distinct characters, in order. */
export function uniqueChars(chars: readonly string[]): string[] {
    return [...new Set(chars)];
}
