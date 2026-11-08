// Server-side view models for the home page.

import "server-only";

import { getAllKanji, getAllRadicals, getCategories, getKanjiByCategory, getKanjiByRadical, getRadicalSummary, getSoundFamily } from "@/lib/atlas";
import { compareByFrequency } from "@/components/Theme/order";
import { familyRows, gloss } from "./family";

export interface HomeTheme {
    name: string;
    /** The theme's kanji, concatenated. */
    chars: string;
}

/** The ten themes with their kanji, in path order. */
export function homeThemes(): HomeTheme[] {
    return getCategories().map((c) => ({ name: c.name, chars: getKanjiByCategory(c.name).map((k) => k.char).join("") }));
}

export interface HomeSeal {
    key: string;
    char: string;
    /** "water". */
    name: string;
    category: string | null;
    /** Its kanji, most common first. */
    chars: string;
    count: number;
}

/** The radicals with the most kanji (氵 木 亻 扌 …). */
export function commonRadicals(limit = 8): HomeSeal[] {
    return [...getAllRadicals()]
        .sort((a, b) => b.kanjiCount - a.kanjiCount || a.key.localeCompare(b.key))
        .slice(0, limit)
        .map((r) => {
            const kanji = [...getKanjiByRadical(r.key)].sort(compareByFrequency);
            return { key: r.key, char: r.char, name: gloss(r.meaning), category: r.category, chars: kanji.map((k) => k.char).join(""), count: kanji.length };
        });
}

export interface SoundFamily {
    /** The sound part (青). */
    phonetic: string;
    /** The on'yomi the family shares (セイ). */
    reading: string;
    /** The sound part's own theme, for its colour. */
    category: string | null;
    rows: { char: string; meaning: string; category: string | null; part: { char: string; key: string; gloss: string } }[];
}

/** A phonetic series as meaning part + sound part = kanji, e.g. 氵 + 青 = 清. Null when the atlas lacks it. */
export function soundFamily(phonetic: string): SoundFamily | null {
    const family = getSoundFamily(phonetic);
    if (!family?.reading) return null;
    const head = family.kanji.find((k) => k.char === phonetic);
    const rows = familyRows(family.kanji, phonetic, family.reading).map((row) => ({
        char: row.char,
        meaning: row.meaning,
        category: row.category,
        part: { char: row.part.char, key: row.part.radicalKey, gloss: gloss(getRadicalSummary(row.part.radicalKey)?.meaning ?? "") },
    }));
    if (rows.length === 0) return null;
    return { phonetic, reading: family.reading, category: head?.category ?? null, rows };
}

/** Stroke-count bands for Browse (min and max are inclusive). */
export const STROKE_BANDS = [
    { label: "1–3", min: 1, max: 3 },
    { label: "4–5", min: 4, max: 5 },
    { label: "6–7", min: 6, max: 7 },
    { label: "8–9", min: 8, max: 9 },
    { label: "10–12", min: 10, max: 12 },
    { label: "13+", min: 13, max: 30 },
] as const;

export function kanjiCount(): number {
    return getAllKanji().length;
}
