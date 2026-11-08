// Shapes of the unified atlas dataset (see scripts/build-kanji-atlas.mjs).

import type { ZhInfo } from "../core/zh.ts";

export type { ZhInfo, ZhRelation } from "../core/zh.ts";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

/** Kanji alive (CC BY 4.0) or JMdict (EDRDG, CC BY-SA 4.0); credit accordingly. */
export type ExampleSource = "kanjialive" | "jmdict";

export interface KanjiExample {
    word: string;
    reading: string;
    meaning: string;
    // Irregular reading (jukujikun/ateji, or none of the kanji's readings fits):
    // marked "*" in Kanji Alive, or found by reading alignment.
    special?: boolean;
    source?: ExampleSource;
}

/**
 * meaning: the radical or the semantic side of a phono-semantic compound;
 * sound: KanjiVG marks it as the phonetic; both: radical and phonetic;
 * form: a structural part whose role no source states.
 */
export type ComponentRole = "meaning" | "sound" | "both" | "form";

export interface KanjiComponent {
    char: string;
    role: ComponentRole;
    /** The atlas radical this component is, when there is one (氵 -> sanzui). */
    radicalKey?: string;
    /** KanjiVG stroke numbers, 1-based inclusive ranges ([[1, 3]] = paths 1–3); split parts have several. */
    strokes: [number, number][];
}

export interface KanjiPhonetic {
    /** The sound component (海 -> 毎). */
    char: string;
    /** Atlas kanji sharing it, the component itself first when it is a kanji; includes this kanji. */
    series: string[];
    /** On'yomi most of the family shares, null when none is shared. */
    reading: string | null;
    /** This kanji reads like its family. */
    regular: boolean;
}

export interface SameOnGroup {
    /** One of this kanji's on'yomi. */
    reading: string;
    /** Other atlas kanji with that on'yomi, in atlas order, capped at 12. */
    chars: string[];
    /** How many there are without the cap. */
    total: number;
}

/** on/kun: one of the kanji's KANJIDIC readings; special: irregular words (今日, 海老). */
export type ReadingKind = "on" | "kun" | "special";

export interface ReadingWords<W = KanjiExample> {
    /** The KANJIDIC reading (カイ, う.まれる); "" for the special group. */
    reading: string;
    kind: ReadingKind;
    /** Words for this reading, may be empty. */
    words: W[];
}

export interface AtlasKanji {
    char: string;
    /** English meanings, KANJIDIC2 priority order (土: soil, earth, …). */
    meanings: string[];
    /** KANJIDIC2 order. */
    onyomi: string[];
    kunyomi: string[];
    jlpt: JlptLevel;
    grade: number | null;
    strokeCount: number;
    frequency: number | null;
    radical: { key: string; char: string } | null;
    category: string | null;
    /** Kanji alive words first, then JMdict words (up to 8 in all when Kanji alive has fewer than 6). */
    examples: KanjiExample[];
    /** On readings, then kun readings (KANJIDIC2 order), then a "special" group when there are irregular words. */
    wordsByReading: ReadingWords[];
    /** Top-level KanjiVG components; empty for kanji KanjiVG doesn't split (木). */
    components: KanjiComponent[];
    phonetic: KanjiPhonetic | null;
    sameOn: SameOnGroup[];
    /** Up to 6 kanji that look alike (shared components or the same strokes), best first. */
    lookAlikes: string[];
    /** In the 2010 jōyō list (Unihan kJoyoKanji). */
    joyo: boolean;
    /** Not jōyō but allowed in names (Unihan kJinmeiyoKanji). */
    nameKanji: boolean;
    /** No level in the kanjiapi.dev JLPT lists: the level is the project's choice (N1 for added jōyō). */
    jlptEditorial: boolean;
    /** The Chinese counterpart from Unihan; null for characters Unihan doesn't cover (々). */
    zh: ZhInfo | null;
    /** The code point ancient forms hang on: the traditional form (学 -> 學), else the kanji itself. */
    etymon: string;
}

/** AtlasKanji as stored in kanji-atlas.json: wordsByReading holds indexes into `examples`. */
export type AtlasKanjiRecord = Omit<AtlasKanji, "wordsByReading"> & { wordsByReading: ReadingWords<number>[] };

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
    kanji: AtlasKanjiRecord[];
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

export interface PhoneticSeriesInfo {
    /** The sound component. */
    phonetic: string;
    /** On'yomi most of the family shares, null when none is shared. */
    reading: string | null;
    /** Atlas kanji in the series, the component itself first when it is a kanji. */
    kanji: AtlasKanji[];
}

export interface SameOnInfo {
    reading: string;
    /** Other atlas kanji with this on'yomi, capped at 12. */
    kanji: AtlasKanji[];
    total: number;
}
