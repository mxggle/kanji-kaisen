// Pure lookups over the atlas dataset. `lib/atlas/index.ts` binds these to the
// bundled JSON (server-only); tests bind them to the same files read from disk.

import type {
    AtlasCategory,
    AtlasCategorySummary,
    AtlasData,
    AtlasKanji,
    AtlasRadical,
    AtlasRadicalSummary,
    JlptLevel,
    Neighbors,
    StoriesData,
} from "./types.ts";
import { CATEGORIES, getCategoryFromSlug, getCategoryImage, getCategorySlug } from "./categories.ts";

export const JLPT_LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

const byJlptThenFrequency = (a: AtlasKanji, b: AtlasKanji) =>
    JLPT_LEVELS.indexOf(a.jlpt) - JLPT_LEVELS.indexOf(b.jlpt) ||
    (a.frequency ?? Infinity) - (b.frequency ?? Infinity) ||
    a.strokeCount - b.strokeCount ||
    a.char.localeCompare(b.char);

const categoryIndex = (category: string | null) => {
    const index = CATEGORIES.findIndex((c) => c === category);
    return index === -1 ? CATEGORIES.length : index;
};

// Radical order used for indexes and prev/next: theme order, then most kanji first.
const byCategoryThenSize = (a: AtlasRadicalSummary, b: AtlasRadicalSummary) =>
    categoryIndex(a.category) - categoryIndex(b.category) ||
    b.kanjiCount - a.kanjiCount ||
    a.key.localeCompare(b.key);

/** Decodes a route param that may arrive percent-encoded. */
export function decodeParam(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function neighborsIn<T>(list: T[], index: number): Neighbors<T> {
    if (index === -1) return { prev: null, next: null };
    return { prev: list[index - 1] ?? null, next: list[index + 1] ?? null };
}

export function createAtlas(data: AtlasData, stories: StoriesData) {
    const allKanji = [...data.kanji].sort(byJlptThenFrequency);
    const kanjiByChar = new Map(allKanji.map((k) => [k.char, k]));
    const radicals = [...data.radicals].sort(byCategoryThenSize);
    const radicalByKey = new Map(radicals.map((r) => [r.key, r]));

    const kanjiByRadical = new Map<string, AtlasKanji[]>();
    const kanjiByJlpt = new Map<JlptLevel, AtlasKanji[]>(JLPT_LEVELS.map((level) => [level, []]));
    for (const k of allKanji) {
        kanjiByJlpt.get(k.jlpt)?.push(k);
        if (!k.radical) continue;
        const list = kanjiByRadical.get(k.radical.key) ?? [];
        list.push(k);
        kanjiByRadical.set(k.radical.key, list);
    }

    // Story-only `*hen` variants share the kanji of the radical with the same char.
    const variantOf = (radical: AtlasRadicalSummary): AtlasRadicalSummary | null => {
        if (radical.kanjiCount > 0) return null;
        return radicals.find((r) => r.key !== radical.key && r.char === radical.char && r.kanjiCount > 0) ?? null;
    };

    function getAllKanji(): AtlasKanji[] {
        return allKanji;
    }

    function getKanji(char: string): AtlasKanji | null {
        return kanjiByChar.get(char) ?? kanjiByChar.get(decodeParam(char)) ?? null;
    }

    function getKanjiByJlpt(level: JlptLevel): AtlasKanji[] {
        return kanjiByJlpt.get(level) ?? [];
    }

    function getKanjiByRadical(key: string): AtlasKanji[] {
        return kanjiByRadical.get(key) ?? [];
    }

    function getKanjiByCategory(categoryOrSlug: string): AtlasKanji[] {
        const name = getCategoryFromSlug(categoryOrSlug) ?? categoryOrSlug;
        return allKanji.filter((k) => k.category === name);
    }

    /** Previous/next kanji in the same JLPT level, ordered by frequency. */
    function getNeighbors(char: string): Neighbors<AtlasKanji> {
        const kanji = getKanji(char);
        if (!kanji) return { prev: null, next: null };
        const level = getKanjiByJlpt(kanji.jlpt);
        return neighborsIn(level, level.indexOf(kanji));
    }

    function getAllRadicals(): AtlasRadicalSummary[] {
        return radicals;
    }

    function getRadicalSummary(key: string): AtlasRadicalSummary | null {
        return radicalByKey.get(key) ?? radicalByKey.get(decodeParam(key)) ?? null;
    }

    function getRadical(key: string): AtlasRadical | null {
        const summary = getRadicalSummary(key);
        if (!summary) return null;
        const story = stories.radicals[summary.key];
        const base = variantOf(summary);
        return {
            ...summary,
            origin: story?.origin ?? "",
            story: story?.story ?? "",
            position: story?.position ?? "",
            transformsMeaning: story?.transformsMeaning ?? "",
            exampleKanji: (story?.exampleKanji ?? []).map((e) => ({ ...e, exists: kanjiByChar.has(e.char) })),
            variantOf: base,
            kanji: getKanjiByRadical(base?.key ?? summary.key),
        };
    }

    /** Previous/next radical in index order (theme, then size). */
    function getRadicalNeighbors(key: string): Neighbors<AtlasRadicalSummary> {
        const summary = getRadicalSummary(key);
        return neighborsIn(radicals, summary ? radicals.indexOf(summary) : -1);
    }

    function summarizeCategory(name: string): AtlasCategorySummary {
        const story = stories.categories[name];
        return {
            name,
            slug: getCategorySlug(name),
            image: getCategoryImage(name),
            title: story?.title ?? "",
            icon: story?.icon ?? "",
            radicalCount: radicals.filter((r) => r.category === name).length,
            kanjiCount: allKanji.filter((k) => k.category === name).length,
        };
    }

    const categorySummaries = CATEGORIES.map(summarizeCategory);

    function getCategories(): AtlasCategorySummary[] {
        return categorySummaries;
    }

    function getCategory(slug: string): AtlasCategory | null {
        const name = getCategoryFromSlug(slug) ?? getCategoryFromSlug(decodeParam(slug));
        if (!name) return null;
        return {
            ...summarizeCategory(name),
            story: stories.categories[name] ?? null,
            radicals: radicals.filter((r) => r.category === name),
            kanji: getKanjiByCategory(name),
        };
    }

    /** Deterministic daily pick from N5–N3, keyed by the UTC date. */
    function getKanjiOfTheDay(date: Date = new Date()): AtlasKanji {
        const pool = [...getKanjiByJlpt("N5"), ...getKanjiByJlpt("N4"), ...getKanjiByJlpt("N3")];
        const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
        // Multiplying by a prime coprime with the pool size walks the whole pool
        // without neighbouring days landing on neighbouring kanji.
        return pool[(day * 7919) % pool.length];
    }

    return {
        getAllKanji,
        getKanji,
        getKanjiByJlpt,
        getKanjiByRadical,
        getKanjiByCategory,
        getNeighbors,
        getAllRadicals,
        getRadicalSummary,
        getRadical,
        getRadicalNeighbors,
        getCategories,
        getCategory,
        getKanjiOfTheDay,
    };
}

export type Atlas = ReturnType<typeof createAtlas>;
