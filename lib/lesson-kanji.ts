import type { JLPTRank, KanjiData } from "@/types/kanji";

// Shape of a kanji entry in kanji-alive-categorized.json (the learning path source).
export interface PathKanjiEntry {
    char: string;
    stroke: number;
    meaning: string;
    grade: number | null;
    onyomi: string;
    kunyomi: string;
}

function splitReadings(value: string): string[] {
    return value
        .split(/[、,]/)
        .map((reading) => reading.trim())
        .filter((reading) => reading.length > 0 && reading.toLowerCase() !== "n/a");
}

// Builds lesson data from the path entry for kanji that are missing from kanji-db.json,
// so every checkpoint kanji can be studied. Returns null when the entry has no meaning.
export function pathEntryToKanjiData(entry: PathKanjiEntry, jlpt: JLPTRank): KanjiData | null {
    const meaning = entry.meaning.trim();
    if (!meaning) return null;

    return {
        char: entry.char,
        meaning,
        onyomi: splitReadings(entry.onyomi),
        kunyomi: splitReadings(entry.kunyomi),
        jlpt,
        strokeCount: entry.stroke,
        frequency: 9999,
        grade: entry.grade ?? undefined,
    };
}
