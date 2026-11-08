// Pure look-alike comparison: which parts differ between two kanji, and which
// of their strokes to highlight (client-safe).

import type { KanjiComponent } from "../../lib/atlas/types.ts";
import { rangeIndexes } from "./strokes.ts";

export interface CompareInput {
    char: string;
    strokeCount: number;
    components: readonly KanjiComponent[];
}

export interface PartDiff {
    /** Parts only `a` has (by character). */
    onlyA: string[];
    /** Parts only `b` has. */
    onlyB: string[];
    /** 0-based stroke indexes of `a`'s own parts. */
    highlightA: number[];
    /** 0-based stroke indexes of `b`'s own parts. */
    highlightB: number[];
    /** "海 has 氵 where 悔 has 忄." or a neutral prompt when the parts don't tell them apart. */
    caption: string;
}

function own(of: CompareInput, other: CompareInput): { chars: string[]; strokes: number[] } {
    const otherChars = new Set(other.components.map((c) => c.char));
    const mine = of.components.filter((c) => !otherChars.has(c.char));
    const chars = [...new Set(mine.map((c) => c.char))];
    const strokes = [...new Set(mine.flatMap((c) => rangeIndexes(c.strokes, of.strokeCount)))].sort((x, y) => x - y);
    return { chars, strokes };
}

const list = (chars: string[]) => chars.join(" + ");

export function compareParts(a: CompareInput, b: CompareInput): PartDiff {
    // Without parts on both sides there is nothing to line up.
    if (!a.components.length || !b.components.length) {
        return { onlyA: [], onlyB: [], highlightA: [], highlightB: [], caption: "Compare the two shapes stroke by stroke." };
    }
    const fromA = own(a, b);
    const fromB = own(b, a);
    let caption: string;
    if (fromA.chars.length && fromB.chars.length) caption = `${a.char} has ${list(fromA.chars)} where ${b.char} has ${list(fromB.chars)}.`;
    else if (fromB.chars.length) caption = `${b.char} adds ${list(fromB.chars)}.`;
    else if (fromA.chars.length) caption = `${a.char} adds ${list(fromA.chars)}.`;
    else caption = `Same parts, arranged differently.`;
    return { onlyA: fromA.chars, onlyB: fromB.chars, highlightA: fromA.strokes, highlightB: fromB.strokes, caption };
}
