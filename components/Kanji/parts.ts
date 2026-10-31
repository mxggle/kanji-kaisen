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
