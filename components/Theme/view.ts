// Small pure helpers behind the theme page (/category/[slug]). Client-safe;
// tests in view.test.mjs.

import type { JlptLevel } from "../../lib/atlas/types.ts";

const LEVELS: readonly JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

// A radical's position note in its meaning: "rain (top radical)", "hill (left form)".
const POSITION = /\((top|bottom|left|right|side|enclosure)\b[^)]*\)/i;

/** The position a meaning names ("rain (top radical)" -> "top"), or null when it names none ("Water (3 drops)"). */
export function radicalPosition(meaning: string): string | null {
    return POSITION.exec(meaning)?.[1].toLowerCase() ?? null;
}

/**
 * A radical's first plain gloss, for seals, plus its position when the meaning
 * names one, so 雨 and its top form stay apart: "Water (3 drops)" -> "water",
 * "rain (top radical)" -> "rain · top", "hill, village, mound (left form)" -> "hill · left".
 */
export function radicalGloss(meaning: string): string {
    const first = meaning.split(/[,;/(]/)[0].trim();
    // Lower a leading capital unless the word is an acronym.
    const gloss = /^[A-Z](?![A-Z])/.test(first) ? first[0].toLowerCase() + first.slice(1) : first;
    const position = radicalPosition(meaning);
    return gloss && position ? `${gloss} · ${position}` : gloss;
}

/** Kanji per JLPT level, N5 first, leaving out levels with none. */
export function levelCounts(levels: Iterable<JlptLevel>): { level: JlptLevel; count: number }[] {
    const counts = new Map<JlptLevel, number>();
    for (const level of levels) counts.set(level, (counts.get(level) ?? 0) + 1);
    return LEVELS.filter((level) => counts.has(level)).map((level) => ({ level, count: counts.get(level) ?? 0 }));
}
