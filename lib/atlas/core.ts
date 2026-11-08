// Pure lookups over the atlas dataset. `lib/atlas/index.ts` binds these to the
// bundled JSON (server-only); tests bind them to the same files read from disk.

import type {
    AtlasCategory,
    AtlasCategorySummary,
    AtlasData,
    AtlasKanji,
    AtlasKanjiRecord,
    AtlasRadical,
    AtlasRadicalSummary,
    JlptLevel,
    Neighbors,
    PhoneticSeriesInfo,
    SameOnInfo,
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

/** Turns the stored word indexes of `wordsByReading` back into example objects. */
function hydrate(record: AtlasKanjiRecord): AtlasKanji {
    return {
        ...record,
        wordsByReading: record.wordsByReading.map((group) => ({
            ...group,
            words: group.words.map((i) => record.examples[i]),
        })),
    };
}

export function createAtlas(data: AtlasData, stories: StoriesData) {
    const allKanji = data.kanji.map(hydrate).sort(byJlptThenFrequency);
    const kanjiByChar = new Map(allKanji.map((k) => [k.char, k]));
    const resolve = (chars: Iterable<string>): AtlasKanji[] => {
        const out: AtlasKanji[] = [];
        for (const char of chars) {
            const kanji = kanjiByChar.get(char);
            if (kanji) out.push(kanji);
        }
        return out;
    };

    // Sound component -> the kanji that use it (their stored series), and
    // component -> kanji built on it, for "Also built on X".
    const seriesByPhonetic = new Map<string, { reading: string | null; series: string[] }>();
    const kanjiByComponent = new Map<string, AtlasKanji[]>();
    for (const k of allKanji) {
        if (k.phonetic && !seriesByPhonetic.has(k.phonetic.char)) {
            seriesByPhonetic.set(k.phonetic.char, { reading: k.phonetic.reading, series: k.phonetic.series });
        }
        for (const char of new Set(k.components.map((c) => c.char))) {
            const list = kanjiByComponent.get(char) ?? [];
            list.push(k);
            kanjiByComponent.set(char, list);
        }
    }
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

    /** The phonetic series `char` belongs to through its sound component (海 -> 毎: 毎 海 梅 悔 …). */
    function getPhoneticSeries(char: string): PhoneticSeriesInfo | null {
        const phonetic = getKanji(char)?.phonetic;
        if (!phonetic) return null;
        return { phonetic: phonetic.char, reading: phonetic.reading, kanji: resolve(phonetic.series) };
    }

    /** The series `char` heads as a sound component (毎 -> 毎 海 梅 悔 …), whether or not it has one itself. */
    function getSoundFamily(char: string): PhoneticSeriesInfo | null {
        const key = decodeParam(char);
        const family = seriesByPhonetic.get(key);
        if (!family) return null;
        return { phonetic: key, reading: family.reading, kanji: resolve(family.series) };
    }

    /** For each on'yomi of `char`, other kanji read the same way (capped at 12, `total` uncapped). */
    function getSameOn(char: string): SameOnInfo[] {
        return (getKanji(char)?.sameOn ?? []).map((g) => ({ reading: g.reading, kanji: resolve(g.chars), total: g.total }));
    }

    /** Up to 6 look-alikes, best first (未 -> 末 …, 待 -> 持 …). */
    function getLookAlikes(char: string): AtlasKanji[] {
        return resolve(getKanji(char)?.lookAlikes ?? []);
    }

    /** Kanji with `component` among their top-level components, in atlas order (for "Also built on X"). */
    function getKanjiWithComponent(component: string, options: { exclude?: string; limit?: number } = {}): AtlasKanji[] {
        const list = (kanjiByComponent.get(decodeParam(component)) ?? []).filter((k) => k.char !== options.exclude);
        return options.limit === undefined ? list : list.slice(0, options.limit);
    }

    /** Resolves a list of characters (a teacher's set, a pasted text) to atlas kanji: unknown and repeated ones are dropped. */
    function getKanjiList(chars: string | Iterable<string>): AtlasKanji[] {
        const unique = new Set(typeof chars === "string" ? Array.from(chars) : chars);
        return resolve(unique);
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
        getPhoneticSeries,
        getSoundFamily,
        getSameOn,
        getLookAlikes,
        getKanjiWithComponent,
        getKanjiList,
    };
}

export type Atlas = ReturnType<typeof createAtlas>;
