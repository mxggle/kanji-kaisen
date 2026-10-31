// Pure helpers behind My list (/my-list): shade counts, the "Worth a revisit"
// suggestion and the study decks. Client-safe; tests in my-list.test.mjs.

import { getShade, type InkEntries, type Shade } from "../../lib/ink.ts";
import type { JlptLevel } from "../../lib/atlas/types.ts";

/** Kanji shown (and practised) under "Worth a revisit". */
export const REVISIT_LIMIT = 8;

/** The atlas in a compact form for the client: every theme's and JLPT level's kanji as one string each. */
export interface AtlasIndex {
    /** Every kanji in the atlas. */
    total: number;
    themes: { name: string; chars: string }[];
    jlpt: { level: JlptLevel; chars: string }[];
}

/** How many of `chars` sit at each shade (index = shade). Duplicates count once. */
export function shadeCounts(entries: InkEntries, chars: Iterable<string>): [number, number, number, number, number] {
    const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    for (const char of new Set(chars)) counts[getShade(entries, char)] += 1;
    return counts;
}

/**
 * Kanji at 淡 or 中, the longest untouched first: a suggestion, never a queue.
 * `known` keeps only atlas kanji.
 */
export function revisitChars(entries: InkEntries, limit = REVISIT_LIMIT, known?: (char: string) => boolean): string[] {
    return Object.entries(entries)
        .filter(([char, entry]) => (entry.shade === 1 || entry.shade === 2) && (!known || known(char)))
        .sort(([a, x], [b, y]) => x.updatedAt.localeCompare(y.updatedAt) || a.localeCompare(b))
        .slice(0, limit)
        .map(([char]) => char);
}

/** Where the four steps start for a deck: its first kanji below 濃, else its first. */
export function firstToLearn(entries: InkEntries, chars: readonly string[]): string | null {
    return chars.find((char) => getShade(entries, char) < 3) ?? chars[0] ?? null;
}

/** The first JLPT level, N5 up, that still has a kanji below 濃 (N1 when all are done). */
export function currentLevel(entries: InkEntries, levels: readonly { level: JlptLevel; chars: string }[]): JlptLevel {
    const open = levels.find((l) => Array.from(l.chars).some((char) => getShade(entries, char) < 3));
    return open?.level ?? levels[levels.length - 1]?.level ?? "N5";
}

/** The theme of the kanji whose ink changed last, else the first theme. */
export function recentTheme(entries: InkEntries, themes: readonly { name: string; chars: string }[]): string | null {
    let latest: { char: string; at: string } | null = null;
    for (const [char, entry] of Object.entries(entries)) {
        if (!latest || entry.updatedAt > latest.at) latest = { char, at: entry.updatedAt };
    }
    const found = latest && themes.find((t) => t.chars.includes(latest.char));
    return found?.name ?? themes[0]?.name ?? null;
}

/** Saved kanji at one shade (all of them for "all"), keeping the list's order. */
export function filterByShade(entries: InkEntries, chars: readonly string[], shade: Shade | "all"): string[] {
    return shade === "all" ? [...chars] : chars.filter((char) => getShade(entries, char) === shade);
}
