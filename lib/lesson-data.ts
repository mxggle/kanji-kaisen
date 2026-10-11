import { KANJI_DATA as PATH_DATA, getJLPTLevel } from "./checkpoints";
import { KANJI_DATA as KANJI_DB } from "./data";
import { pathEntryToKanjiData } from "./lesson-kanji";
import type { JLPTRank, KanjiData } from "@/types/kanji";

const KANJI_DB_BY_CHAR = new Map(KANJI_DB.map((k) => [k.char, k]));
const PATH_KANJI_BY_CHAR = new Map(
    Object.values(PATH_DATA).flatMap((radical) => radical.kanji.map((k) => [k.char, k] as const))
);

// Lesson data for a checkpoint kanji: kanji-db first, then the path entry as a fallback.
export function getLessonKanjiData(char: string): KanjiData | undefined {
    const fromDb = KANJI_DB_BY_CHAR.get(char);
    if (fromDb) return fromDb;

    const entry = PATH_KANJI_BY_CHAR.get(char);
    if (!entry) return undefined;

    return pathEntryToKanjiData(entry, getJLPTLevel(entry.grade) as JLPTRank) ?? undefined;
}
