// Pure helpers for the #learn stage and step card: how each stroke is drawn
// (rule 2, line = role) and what the Trace step says about a stroke.
// Client-safe; tests in stage.test.mjs.

import type { ComponentRole } from "../../lib/atlas/types.ts";

/** meaning: solid in --c · sound: dashed in --c · form: grey. */
export type StrokeLine = "meaning" | "sound" | "form";

interface PartLike {
    char: string;
    role: ComponentRole;
    roleLabel?: string;
}

/**
 * The line of each stroke, from the role of the part that owns it. A part that
 * carries meaning and sound draws solid. Loose strokes are form; a kanji with
 * no parts is drawn whole, as meaning.
 */
export function strokeLines(parts: readonly PartLike[], owners: readonly (string | null)[], count: number): StrokeLine[] {
    const roleOf = new Map(parts.map((p) => [p.char, p.role]));
    return Array.from({ length: count }, (_, i) => {
        const owner = owners[i];
        if (!owner) return parts.length ? "form" : "meaning";
        const role = roleOf.get(owner);
        if (role === "sound") return "sound";
        if (role === "form" || role === undefined) return "form";
        return "meaning";
    });
}

/** "Stroke 4 of 9: a dot. It begins the sound part 毎." */
export function traceNote(at: number, total: number, strokeName: string, owners: readonly (string | null)[], parts: readonly PartLike[]): string {
    const head = `Stroke ${at} of ${total}${strokeName ? `: ${strokeName}` : ""}.`;
    const owner = owners[at - 1];
    const part = owner ? parts.find((p) => p.char === owner) : null;
    if (!part) return head;
    const role = part.roleLabel && part.roleLabel !== "part" ? `the ${part.roleLabel} part` : "the part";
    const begins = owners.indexOf(owner) === at - 1;
    return `${head} It ${begins ? "begins" : "belongs to"} ${role} ${part.char}.`;
}
