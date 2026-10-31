// What the #learn layer says about the next shade: "淡 Met → 中 after Trace" in
// the bar, and the goal line of the Write step. Mirrors recordStep in
// lib/ink.ts. Client-safe; tests in next-shade.test.mjs.

import { dayKey, MASTERY_DAYS, SHADE_JP, SHADE_NAMES, type InkEntry, type Shade } from "../../lib/ink.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ShadeGoal {
    to: Shade;
    /** "Trace", "Recall and Trace", "a Write on another day". */
    after: string;
}

/** Days until a write can make the kanji 印 (0 when it already can), or null without a first write. */
function daysToMastery(entry: InkEntry | undefined, now: Date): number | null {
    if (!entry?.firstWrite) return null;
    const left = Date.parse(entry.firstWrite) + MASTERY_DAYS * DAY_MS - now.getTime();
    return left <= 0 ? 0 : Math.ceil(left / DAY_MS);
}

/** The next shade and what reaches it; null at 印. */
export function nextShadeGoal(entry: InkEntry | undefined, now = new Date()): ShadeGoal | null {
    const shade = entry?.shade ?? 0;
    if (shade === 0) return { to: 1, after: "Meet" };
    if (shade === 1) {
        const missing = [!entry?.recall && "Recall", !entry?.trace && "Trace"].filter(Boolean);
        return { to: 2, after: missing.length ? missing.join(" and ") : "Recall and Trace" };
    }
    if (shade === 2) {
        const days = entry?.writeDays ?? [];
        if (days.length === 0) return { to: 3, after: "Writes on two days" };
        return { to: 3, after: days.includes(dayKey(now)) ? "a Write on another day" : "a Write today" };
    }
    if (shade === 3) {
        const left = daysToMastery(entry, now);
        if (left === null) return { to: 4, after: "Writes three weeks apart" };
        if (left === 0) return { to: 4, after: "your next Write" };
        return { to: 4, after: left === 1 ? "a Write tomorrow" : `a Write in ${left} days` };
    }
    return null;
}

/**
 * Where the layer opens: the first step whose evidence is missing. Unmet →
 * Meet; met → Recall, then Trace, then Write. 濃 and 印 count as finished and
 * open at Meet, like an unmet kanji.
 */
export function firstStep(entry: InkEntry | undefined): "meet" | "recall" | "trace" | "write" {
    const shade = entry?.shade ?? 0;
    if (shade === 0 || shade >= 3) return "meet";
    if (!entry?.recall) return "recall";
    if (!entry.trace) return "trace";
    return "write";
}

/** The Write step's goal line: "Get it right on two different days and 海 turns 濃 Familiar." */
export function writeGoal(char: string, entry: InkEntry | undefined, now = new Date()): string {
    const shade = entry?.shade ?? 0;
    const familiar = `${SHADE_JP[3]} ${SHADE_NAMES[3]}`;
    const mastered = `${SHADE_JP[4]} ${SHADE_NAMES[4]}`;
    if (shade < 3) {
        const days = entry?.writeDays ?? [];
        if (days.length === 0) return `Get it right on two different days and ${char} turns ${familiar}.`;
        if (days.includes(dayKey(now))) return `You wrote it today. Get it right again on another day and ${char} turns ${familiar}.`;
        return `Get it right today and ${char} turns ${familiar}.`;
    }
    if (shade === 3) {
        const left = daysToMastery(entry, now);
        if (left === null) return `Get it right now and again three weeks later, and ${char} turns ${mastered}.`;
        if (left === 0) return `Get it right now and ${char} turns ${mastered}.`;
        return `Get it right ${left === 1 ? "tomorrow" : `in ${left} days`} or later and ${char} turns ${mastered}.`;
    }
    return `${char} is already ${mastered}. Writing it keeps your hand in.`;
}
