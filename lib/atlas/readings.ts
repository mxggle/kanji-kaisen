// Formatters for KANJIDIC reading notation.
//
//   ふる.い  -> the part after "." is okurigana: ふる(い)
//   -か      -> used as a suffix (e.g. 三日 みっか)
//   ふる-    -> used as a prefix
//
// Prefix/suffix dashes carry meaning, so formatting keeps them.

import { toHiragana, toRomaji } from "wanakana";

export interface ReadingParts {
    prefix: boolean;
    suffix: boolean;
    stem: string;
    okurigana: string;
}

export function splitReading(reading: string): ReadingParts {
    const trimmed = reading.trim();
    const suffix = trimmed.startsWith("-");
    const prefix = trimmed.endsWith("-");
    const core = trimmed.replace(/^-|-$/g, "");
    const dot = core.indexOf(".");
    return {
        prefix,
        suffix,
        stem: dot === -1 ? core : core.slice(0, dot),
        okurigana: dot === -1 ? "" : core.slice(dot + 1),
    };
}

/** `ふる.い` -> `ふる(い)`, `-か` -> `-か`, `ふる-` -> `ふる-`. */
export function formatReading(reading: string): string {
    const { prefix, suffix, stem, okurigana } = splitReading(reading);
    return `${suffix ? "-" : ""}${stem}${okurigana ? `(${okurigana})` : ""}${prefix ? "-" : ""}`;
}

/** Bare kana with notation removed: `ふる.い` -> `ふるい`. */
export function plainReading(reading: string): string {
    return reading.replace(/[.\-]/g, "").trim();
}

/** Romaji that keeps the prefix/suffix dashes: `-か` -> `-ka`, `ふる.い` -> `furui`. */
export function readingToRomaji(reading: string): string {
    const { prefix, suffix, stem, okurigana } = splitReading(reading);
    return `${suffix ? "-" : ""}${toRomaji(stem + okurigana)}${prefix ? "-" : ""}`;
}

/** Normalizes kana for comparison: katakana -> hiragana, notation stripped. */
export function normalizeKana(text: string): string {
    return toHiragana(plainReading(text), { passRomaji: true });
}
