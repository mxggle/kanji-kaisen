// The home page's "Where you left off" card: which kanji to continue with and
// which learn step comes next, read from the ink store. Pure and client-safe;
// tests in continue.test.mjs.

import { SHADES, type InkEntries, type InkEntry, type InkStep, type Shade } from "../../lib/ink.ts";

/** The four learn steps, in order. */
export const LEARN_STEPS: readonly InkStep[] = ["meet", "recall", "trace", "write"];

export const STEP_NAMES: Record<InkStep, string> = {
    meet: "Meet",
    recall: "Recall",
    trace: "Trace",
    write: "Write",
};

export interface ContinuePick {
    char: string;
    shade: Shade;
    /** The step to do next (never "meet": a kanji with ink has been met). */
    step: InkStep;
    /** 1-based position of `step` in the four. */
    stepNumber: number;
    updatedAt: string;
}

/**
 * The step a kanji's ink says comes next, or null once the loop is done.
 * 淡 waits for recall and trace (in either order), 中 for writing. 濃 means it
 * was written on two days, so all four steps are done: 印 only follows a write
 * three weeks later, and asking for that would make the card a review queue.
 * A shade marked by hand counts its earlier steps as done.
 */
export function nextStep(entry: InkEntry): InkStep | null {
    if (entry.shade >= 3) return null;
    if (entry.shade === 2) return "write";
    if (!entry.recall) return "recall";
    if (!entry.trace) return "trace";
    return "write";
}

function time(iso: string): number {
    const t = Date.parse(iso);
    return Number.isNaN(t) ? -Infinity : t;
}

/**
 * The most recently inked kanji that still has a step to do. Ties on
 * updatedAt go to the lower code point, so the pick never depends on the
 * order of the stored entries. Null with no ink, or when every kanji is 濃 or 印.
 */
export function pickContinue(entries: InkEntries): ContinuePick | null {
    let best: ContinuePick | null = null;
    for (const [char, entry] of Object.entries(entries)) {
        const step = nextStep(entry);
        if (!step) continue;
        if (best) {
            const diff = time(entry.updatedAt) - time(best.updatedAt);
            if (diff < 0 || (diff === 0 && char > best.char)) continue;
        }
        best = { char, shade: entry.shade, step, stepNumber: LEARN_STEPS.indexOf(step) + 1, updatedAt: entry.updatedAt };
    }
    return best;
}

export type ContinueCard =
    | { kind: "first" }
    | { kind: "continue"; pick: ContinuePick }
    | { kind: "done" };

/**
 * What the card shows: the method for a first visit (no ink, or the store not
 * hydrated yet, so the server and first client render match), the kanji to
 * continue with, or "done" when every inked kanji is through the four steps.
 */
export function continueCard(entries: InkEntries | null): ContinueCard {
    if (!entries || Object.keys(entries).length === 0) return { kind: "first" };
    const pick = pickContinue(entries);
    return pick ? { kind: "continue", pick } : { kind: "done" };
}

/**
 * How many kanji sit at each shade, 白 to 印. 白 is everything in the atlas
 * without ink (`total` is the atlas size), never below zero.
 */
export function shadeCounts(entries: InkEntries, total: number): Record<Shade, number> {
    const counts: Record<Shade, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let inked = 0;
    for (const entry of Object.values(entries)) {
        if (!SHADES.includes(entry.shade) || entry.shade === 0) continue;
        counts[entry.shade] += 1;
        inked += 1;
    }
    counts[0] = Math.max(0, total - inked);
    return counts;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const DAY_MS = 24 * 60 * 60 * 1000;

const count = (n: number, unit: string) => `${WORDS[n] ?? n} ${unit}${n === 1 ? "" : "s"} ago`;

/**
 * "today", "yesterday", "two days ago", "three weeks ago", "five months ago",
 * "over a year ago", by the learner's calendar days. Null for a bad date.
 */
export function agoLabel(iso: string, now: Date = new Date()): string | null {
    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return null;
    const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    // Rounded, so a 23- or 25-hour day around a clock change still counts as one.
    const days = Math.round((start(now) - start(then)) / DAY_MS);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 14) return count(days, "day");
    if (days < 60) return count(Math.floor(days / 7), "week");
    if (days < 365) return count(Math.floor(days / 30), "month");
    return "over a year ago";
}
