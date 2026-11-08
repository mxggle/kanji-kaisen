// Pure helpers behind <InkPaint> (components/Ink/InkPaint.tsx), which fills
// server-rendered tiles, seals and painted bars with the learner's ink after
// hydration. Client-safe; tests in ink-paint.test.mjs.

import { paintedPercent, themeProgress, type InkEntries, type Shade, type ThemeProgress } from "./ink.ts";

/** A radical seal's fill comes from this many of its most common kanji. */
export const SEAL_KANJI = 8;

/**
 * A seal's shade: the rounded mean of its first SEAL_KANJI kanji's shades
 * (most common first), so a radical and its kanji always match. 0 with none.
 */
export function sealShade(shades: readonly Shade[]): Shade {
    const common = shades.slice(0, SEAL_KANJI);
    if (common.length === 0) return 0;
    const sum = common.reduce<number>((total, shade) => total + shade, 0);
    return Math.round(sum / common.length) as Shade;
}

/** Σshade / (4·N) over the distinct kanji, from 0 to 1 (0 for none). */
export function paintedShare(entries: InkEntries, chars: Iterable<string>): number {
    return themeProgress(entries, chars).painted;
}

/** "18% painted · 9 of 112 familiar" (familiar: 濃 or 印). */
export function paintCaption(progress: Pick<ThemeProgress, "painted" | "known" | "total">): string {
    return `${paintedPercent(progress.painted)}% painted · ${progress.known.toLocaleString("en")} of ${progress.total.toLocaleString("en")} familiar`;
}
