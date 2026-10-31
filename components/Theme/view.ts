// Small pure helpers behind the theme page (/category/[slug]). Client-safe;
// tests in view.test.mjs.

import type { JlptLevel } from "../../lib/atlas/types.ts";

const LEVELS: readonly JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

/** A radical's first plain gloss, for seals: "Water (3 drops)" -> "water", "hill, village, mound" -> "hill". */
export function radicalGloss(meaning: string): string {
    const first = meaning.split(/[,;/(]/)[0].trim();
    // Lower a leading capital unless the word is an acronym.
    return /^[A-Z](?![A-Z])/.test(first) ? first[0].toLowerCase() + first.slice(1) : first;
}

/** The items before and after `current` in a ring (the last theme's next is the first). Null when it isn't in the list. */
export function ringNeighbours<T>(items: readonly T[], current: T): { prev: T; next: T } | null {
    const i = items.indexOf(current);
    if (i < 0 || items.length < 2) return null;
    return { prev: items[(i - 1 + items.length) % items.length], next: items[(i + 1) % items.length] };
}

/** Kanji per JLPT level, N5 first, leaving out levels with none. */
export function levelCounts(levels: Iterable<JlptLevel>): { level: JlptLevel; count: number }[] {
    const counts = new Map<JlptLevel, number>();
    for (const level of levels) counts.set(level, (counts.get(level) ?? 0) + 1);
    return LEVELS.filter((level) => counts.has(level)).map((level) => ({ level, count: counts.get(level) ?? 0 }));
}
