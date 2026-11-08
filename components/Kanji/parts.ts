// Pure labels for a kanji's parts (client-safe).

import type { ComponentRole } from "../../lib/atlas/types.ts";

export const ROLE_LABELS: Record<ComponentRole, string> = {
    meaning: "meaning",
    sound: "sound",
    both: "meaning and sound",
    form: "part",
};

/** Roles whose part carries the accent in 墨 (meaning-bearing); the others are drawn in ink. */
export function isAccentRole(role: ComponentRole): boolean {
    return role === "meaning" || role === "both";
}

export interface CaptionPart {
    char: string;
    role: ComponentRole;
    gloss: string | null;
}

/** One part as caption text: "氵 water (meaning)", "毎 (sound)", "木 tree". */
export function partPhrase(part: CaptionPart): string {
    switch (part.role) {
        case "meaning":
        case "both":
            return `${part.char}${part.gloss ? ` ${part.gloss}` : ""} (${ROLE_LABELS[part.role]})`;
        case "sound":
            return `${part.char} (sound)`;
        default:
            return `${part.char}${part.gloss ? ` ${part.gloss}` : ""}`;
    }
}

/** "氵 water (meaning) + 毎 (sound)". */
export function partsCaption(parts: readonly CaptionPart[]): string {
    return parts.map(partPhrase).join(" + ");
}

/** Parts with repeated characters merged (三 = 一 + 一 + 一 -> one chip), keeping the strongest role. */
export function uniqueParts<T extends CaptionPart>(parts: readonly T[]): T[] {
    const rank: Record<ComponentRole, number> = { meaning: 0, both: 1, sound: 2, form: 3 };
    const byChar = new Map<string, T>();
    for (const part of parts) {
        const seen = byChar.get(part.char);
        if (!seen || rank[part.role] < rank[seen.role]) byChar.set(part.char, part);
    }
    return parts.filter((p) => byChar.get(p.char) === p);
}

/** Rule 2's three lines: what a component role draws as (both carries meaning). */
export type PartLine = "meaning" | "sound" | "form";

export function partLine(role: ComponentRole): PartLine {
    if (role === "meaning" || role === "both") return "meaning";
    return role;
}

/** The small word after a part chip: "meaning", "sound", "form", "meaning · sound". */
export function partNote(role: ComponentRole): string {
    return role === "both" ? "meaning · sound" : role;
}

export interface BuildClause {
    chars: string[];
    line: PartLine;
    /** "carries the meaning", "give the sound", "are drawn in". */
    text: string;
}

const CLAUSE_ORDER: ComponentRole[] = ["meaning", "both", "sound", "form"];

const CLAUSE_TEXT: Record<ComponentRole, [one: string, many: string]> = {
    meaning: ["carries the meaning", "carry the meaning"],
    both: ["carries meaning and sound", "carry meaning and sound"],
    sound: ["gives the sound", "give the sound"],
    form: ["is drawn in", "are drawn in"],
};

/**
 * The build caption as clauses, one per role: "亻 carries the meaning · 木 is
 * drawn in", "氵 carries the meaning · 毎 gives the sound". Repeated parts count once.
 */
export function buildClauses(parts: readonly CaptionPart[]): BuildClause[] {
    const unique = uniqueParts(parts);
    return CLAUSE_ORDER.flatMap((role) => {
        const chars = unique.filter((p) => p.role === role).map((p) => p.char);
        if (!chars.length) return [];
        const [one, many] = CLAUSE_TEXT[role];
        return [{ chars, line: partLine(role), text: chars.length === 1 ? one : many }];
    });
}

/** "亻", "木 and 口", "一, 口 and 木". */
export function joinChars(chars: readonly string[]): string {
    if (chars.length <= 1) return chars.join("");
    return `${chars.slice(0, -1).join(", ")} and ${chars[chars.length - 1]}`;
}

/** The clauses as plain text, for aria labels. */
export function buildCaptionText(parts: readonly CaptionPart[]): string {
    return buildClauses(parts)
        .map((c) => `${joinChars(c.chars)} ${c.text}`)
        .join(" · ");
}
