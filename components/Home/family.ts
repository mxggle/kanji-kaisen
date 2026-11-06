// The home page's "Read a kanji by its parts" example: a phonetic series laid
// out as meaning part + sound part = kanji. Pure; tests in family.test.mjs.

import { radicalPosition } from "../Theme/view.ts";

export interface FamilyKanji {
    char: string;
    meanings: readonly string[];
    onyomi: readonly string[];
    category: string | null;
    components: readonly { char: string; role: string; radicalKey?: string }[];
}

export interface FamilyRow {
    char: string;
    /** First meaning ("pure"). */
    meaning: string;
    category: string | null;
    /** The meaning part (氵) and the radical it is. */
    part: { char: string; radicalKey: string };
}

/**
 * Kanji that show the pattern cleanly: exactly one meaning part that is an
 * atlas radical plus the sound part, read first with the family's on'yomi.
 * Keeps the series order (the atlas puts easier, commoner kanji first).
 */
export function familyRows(series: readonly FamilyKanji[], phonetic: string, reading: string, limit = 3): FamilyRow[] {
    const rows: FamilyRow[] = [];
    for (const k of series) {
        if (rows.length >= limit) break;
        if (k.char === phonetic || k.onyomi[0] !== reading || k.components.length !== 2) continue;
        const meaning = k.components.find((c) => c.role === "meaning");
        const sound = k.components.find((c) => c.role === "sound");
        if (!meaning?.radicalKey || sound?.char !== phonetic) continue;
        rows.push({ char: k.char, meaning: k.meanings[0] ?? "", category: k.category, part: { char: meaning.char, radicalKey: meaning.radicalKey } });
    }
    return rows;
}

/**
 * The first plain gloss of a radical's meaning, plus its position when it names
 * one: "Water (3 drops)" -> "water", "sun, day" -> "sun", "rain (top radical)" -> "rain · top".
 */
export function gloss(meaning: string): string {
    const first = meaning.split(/[,;/(]/)[0].trim().toLowerCase();
    const position = radicalPosition(meaning);
    return first && position ? `${first} · ${position}` : first;
}
