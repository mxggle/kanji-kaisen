// Shapes of the unified atlas dataset (see scripts/build-kanji-atlas.mjs).

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface KanjiExample {
    word: string;
    reading: string;
    meaning: string;
    // Irregular reading (jukujikun/ateji), marked "*" in Kanji Alive.
    special?: boolean;
}

export interface AtlasKanji {
    char: string;
    meanings: string[];
    onyomi: string[];
    kunyomi: string[];
    jlpt: JlptLevel;
    grade: number | null;
    strokeCount: number;
    frequency: number | null;
    radical: { key: string; char: string } | null;
    category: string | null;
    examples: KanjiExample[];
}

export interface AtlasRadicalSummary {
    key: string;
    char: string;
    name: string;
    meaning: string;
    category: string | null;
    hasStory: boolean;
    kanjiCount: number;
}

export interface AtlasData {
    kanji: AtlasKanji[];
    radicals: AtlasRadicalSummary[];
}

export interface RadicalStoryData {
    key: string;
    char: string;
    name: string;
    meaning: string;
    origin: string;
    story: string;
    position: string;
    transformsMeaning: string;
    exampleKanji: { char: string; meaning: string; explanation: string }[];
}

export interface CategoryStoryData {
    name: string;
    title: string;
    description: string;
    whyItMatters: string;
    learningTip: string;
    commonPatterns: string[];
    icon: string;
}

export interface StoriesData {
    categories: Record<string, CategoryStoryData>;
    radicals: Record<string, RadicalStoryData>;
}

export interface AtlasRadical extends AtlasRadicalSummary {
    origin: string;
    story: string;
    position: string;
    transformsMeaning: string;
    exampleKanji: { char: string; meaning: string; explanation: string; exists: boolean }[];
    // For left-side `*hen` story variants that have no kanji of their own,
    // the radical whose kanji they share (e.g. kihen -> ki).
    variantOf: AtlasRadicalSummary | null;
    kanji: AtlasKanji[];
}

export interface AtlasCategorySummary {
    name: string;
    slug: string;
    image: string;
    title: string;
    icon: string;
    radicalCount: number;
    kanjiCount: number;
}

export interface AtlasCategory extends AtlasCategorySummary {
    story: CategoryStoryData | null;
    radicals: AtlasRadicalSummary[];
    kanji: AtlasKanji[];
}

export interface Neighbors<T> {
    prev: T | null;
    next: T | null;
}
