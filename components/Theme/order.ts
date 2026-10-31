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

/** Splits a flat order back into its radical groups, given each group's size. */
export function sliceGroups<T>(order: readonly T[], counts: readonly number[]): T[][] {
    const groups: T[][] = [];
    let start = 0;
    for (const count of counts) {
        groups.push(order.slice(start, start + count));
        start += count;
    }
    return groups;
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

/** @deprecated One Atlas: RadicalSeal `chars` + <InkPaint> fill seals (sealShade in lib/ink-paint). */
export type SealState = "blank" | "met" | "now" | "familiar" | "sealed";

/**
 * A radical's common kanji: its first (most frequent) SEAL_COMMON kanji.
 * @deprecated One Atlas: SEAL_KANJI in lib/ink-paint.
 */
export const SEAL_COMMON = 8;

/** @deprecated One Atlas: seals show ink as their fill (RadicalSeal `chars`), with no named states. */
export const SEAL_LABELS: Record<SealState, string> = {
    blank: "not started",
    met: "started",
    now: "up next",
    familiar: "familiar",
    sealed: "sealed",
};

/**
 * The ink state of a radical's seal, from its kanji (most frequent first).
 * - sealed: every common kanji is 濃 (Familiar) or 印 (Mastered)
 * - now: it holds the theme's next kanji (`isNext`)
 * - familiar: at least half of the common kanji are 濃 or above
 * - met: any of its kanji has ink
 * - blank: none has
 * @deprecated One Atlas: RadicalSeal `chars` + <InkPaint> (sealShade in lib/ink-paint).
 */
export function sealState(chars: readonly string[], shadeOf: ShadeOf, isNext = false): SealState {
    const common = chars.slice(0, SEAL_COMMON);
    const known = common.filter((c) => shadeOf(c) >= 3).length;
    if (common.length > 0 && known === common.length) return "sealed";
    if (isNext) return "now";
    if (known > 0 && known * 2 >= common.length) return "familiar";
    if (chars.some((c) => shadeOf(c) > 0)) return "met";
    return "blank";
}

/** The item with the highest `painted` share, or null when none has ink. Ties go to the earlier item. */
export function mostPainted<T extends { painted: number }>(items: readonly T[]): T | null {
    let best: T | null = null;
    for (const item of items) {
        if (item.painted > 0 && (best === null || item.painted > best.painted)) best = item;
    }
    return best;
}

/**
 * The opening of a story for a quote: whole sentences while they fit in
 * `max` characters, or the first sentence cut at a word with "…".
 */
export function storyExcerpt(text: string, max = 180): string {
    const trimmed = text.trim().replace(/\s+/g, " ");
    if (!trimmed) return "";
    // A sentence ends at . ! or ? (optionally followed by a closing quote) and a space.
    const sentences = trimmed.split(/(?<=[.!?]["'”’)]?)\s+/);
    let out = "";
    for (const sentence of sentences) {
        const next = out ? `${out} ${sentence}` : sentence;
        if (next.length > max) break;
        out = next;
    }
    if (out) return out;
    const cut = sentences[0].slice(0, max - 1);
    const space = cut.lastIndexOf(" ");
    return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.—–-]+$/, "")}…`;
}
