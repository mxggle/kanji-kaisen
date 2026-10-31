// Suggested order inside a theme, and the next kanji that home, theme and
// radical pages derive from it. Pure and client-safe; tests in order.test.mjs.

import type { Shade } from "../../lib/ink.ts";

/** Reads one kanji's shade (0 when it has no ink, or before the store hydrates). */
export type ShadeOf = (char: string) => Shade;

export interface OrderRadical {
    key: string;
}

export interface OrderKanji {
    char: string;
    /** Newspaper frequency rank (1 = most common), null when unranked. */
    frequency: number | null;
    strokeCount: number;
    radical: { key: string } | null;
}

export interface RadicalGroup<R extends OrderRadical, K extends OrderKanji> {
    radical: R;
    kanji: K[];
}

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Most common first; unranked kanji last, then fewer strokes, then code point. */
export function compareByFrequency(a: OrderKanji, b: OrderKanji): number {
    return (
        (a.frequency ?? Infinity) - (b.frequency ?? Infinity) ||
        a.strokeCount - b.strokeCount ||
        byCodePoint(a.char, b.char)
    );
}

/**
 * A theme's radicals with their kanji in the suggested order: radicals with the
 * most kanji first (ties by key), and each radical's kanji by frequency.
 * Radicals with no kanji in `kanji` are left out.
 */
export function suggestedOrder<R extends OrderRadical, K extends OrderKanji>(
    radicals: readonly R[],
    kanji: readonly K[],
): RadicalGroup<R, K>[] {
    const byRadical = new Map<string, K[]>();
    for (const k of kanji) {
        const key = k.radical?.key;
        if (!key) continue;
        const list = byRadical.get(key) ?? [];
        list.push(k);
        byRadical.set(key, list);
    }
    return radicals
        .filter((r) => byRadical.has(r.key))
        .map((radical) => ({ radical, kanji: [...(byRadical.get(radical.key) ?? [])].sort(compareByFrequency) }))
        .sort((a, b) => b.kanji.length - a.kanji.length || byCodePoint(a.radical.key, b.radical.key));
}

/** Every kanji of the groups, in order. */
export function flattenOrder(groups: readonly RadicalGroup<OrderRadical, OrderKanji>[]): string[] {
    return groups.flatMap((g) => g.kanji.map((k) => k.char));
}

export type NextMode = "start" | "continue" | "revisit";

export interface NextKanji {
    char: string;
    /** start: nothing here has ink yet; continue: some has; revisit: everything is 印. */
    mode: NextMode;
}

/**
 * The kanji to learn next in a suggested order: the first below 中 (Learning).
 * When all are at 中 or above, the first below 印; when all are 印, the first
 * one again. Null for an empty list.
 */
export function nextKanji(chars: readonly string[], shadeOf: ShadeOf): NextKanji | null {
    if (chars.length === 0) return null;
    let started = false;
    let belowLearning: string | null = null;
    let belowMastered: string | null = null;
    for (const char of chars) {
        const shade = shadeOf(char);
        if (shade > 0) started = true;
        if (shade < 2 && belowLearning === null) belowLearning = char;
        if (shade < 4 && belowMastered === null) belowMastered = char;
    }
    if (!started) return { char: chars[0], mode: "start" };
    if (belowLearning !== null) return { char: belowLearning, mode: "continue" };
    if (belowMastered !== null) return { char: belowMastered, mode: "continue" };
    return { char: chars[0], mode: "revisit" };
}

/** The words before the kanji in a next-kanji action: "Start with", "Continue with", "Revisit". */
export function nextVerb(mode: NextMode): string {
    if (mode === "start") return "Start with";
    if (mode === "continue") return "Continue with";
    return "Revisit";
}

/** "Start with 決", "Continue with 海", "Revisit 木". */
export function nextLabel(next: NextKanji): string {
    return `${nextVerb(next.mode)} ${next.char}`;
}

/** The index of the group holding `char`; 0 (the first, most useful group) when none does. */
export function groupOf(groups: readonly (readonly string[])[], char: string | null | undefined): number {
    if (!char) return 0;
    const index = groups.findIndex((group) => group.includes(char));
    return index < 0 ? 0 : index;
}
