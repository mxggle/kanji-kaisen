// Server-only view model for /kanji/[char]: everything the page and its client
// islands need, as plain props. Client components never import the atlas.

import "server-only";

import { cache } from "react";
import fs from "node:fs";
import path from "node:path";
import {
    getAllKanji,
    getAllRadicals,
    getKanji,
    getKanjiWithComponent,
    getLookAlikes,
    getNeighbors,
    getPhoneticSeries,
    getRadical,
    getRadicalSummary,
    getSameOn,
    getSoundFamily,
} from "@/lib/atlas";
import type { AtlasKanji, AtlasRadical, KanjiComponent } from "@/lib/atlas/types";
import { kanjivgFileName } from "@/lib/atlas/kanjivg-svg";
import { getThemeColor } from "@/lib/atlas/categories";
import { kanjiPath, radicalPath, searchPath } from "@/lib/atlas/paths";
import { plainReading, readingToRomaji } from "@/lib/atlas/readings";
import { buildMeaningOptions, type QuizCandidate } from "@/lib/atlas/quiz";
import unihanData from "@/lib/core/unihan.json";
import type { UnihanEntry } from "@/lib/core/zh";
import { firstSentences, truncate } from "@/components/Atlas/kanji/summary";
import { displayMeanings, gradeLabel, layoutReadings, meaningHeadline, partGloss, titleReadings } from "@/components/Kanji/readings";
import { extractStrokes, partOffsets, rangeIndexes, strokeOwners, type Stroke } from "@/components/Kanji/strokes";
import { compareParts } from "@/components/Kanji/compare";
import { zhFacts, type ZhFacts } from "@/components/Kanji/zh";
import { isAccentRole, partsCaption, ROLE_LABELS, uniqueParts } from "@/components/Kanji/parts";
import { etymologyView, journeyCaptions } from "@/components/Kanji/story";
import { getAncientForms, getEtymology } from "@/lib/story";
import type {
    AlsoBuiltOn,
    BuildView,
    EtymologyView,
    JourneyView,
    KanjiLite,
    LookAlikeView,
    MemoryStoryView,
    PartView,
    SameOnView,
    SoundFamilyView,
    StrokeData,
} from "@/components/Kanji/types";
import type { LearnData } from "@/components/Learn/types";

// Pages are fully prerendered, so the KanjiVG files needn't be traced into the
// server bundle; the ignore comments keep Turbopack from globbing them.
const KANJIVG_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "kanjivg", "kanji");

const kanjivgPath = (char: string) => path.join(/* turbopackIgnore: true */ KANJIVG_DIR, kanjivgFileName(char));

function readStrokes(char: string): Stroke[] {
    try {
        const raw = fs.readFileSync(/* turbopackIgnore: true */ kanjivgPath(char), "utf8");
        return extractStrokes(raw);
    } catch {
        return [];
    }
}

const unihan = (unihanData as unknown as { chars: Record<string, UnihanEntry> }).chars;
const getUnihan = (char: string) => unihan[char];

const ALSO_BUILT_LIMIT = 12;

/** Display meanings joined for options and links ("sea, ocean"). */
const meaningLabel = (k: Pick<AtlasKanji, "meanings">, count = 3) => displayMeanings(k.meanings).slice(0, count).join(", ");

function lite(k: AtlasKanji): KanjiLite {
    return {
        char: k.char,
        meaning: displayMeanings(k.meanings)[0] ?? "",
        reading: plainReading(k.onyomi[0] ?? k.kunyomi[0] ?? ""),
    };
}

// ---------------------------------------------------------------------------
// Parts

function toPart(component: KanjiComponent, strokeCount: number): PartView {
    const radical = component.radicalKey ? getRadicalSummary(component.radicalKey) : null;
    const asKanji = getKanji(component.char);
    const category = radical?.category ?? asKanji?.category ?? null;
    const gloss = radical ? partGloss(radical.meaning) : asKanji ? partGloss(displayMeanings(asKanji.meanings)[0] ?? "") : null;
    return {
        char: component.char,
        role: component.role,
        roleLabel: ROLE_LABELS[component.role],
        gloss: gloss || null,
        themeColor: getThemeColor(category),
        alt: !isAccentRole(component.role),
        href: radical ? radicalPath(radical.key) : asKanji ? kanjiPath(asKanji.char) : null,
        strokes: rangeIndexes(component.strokes, strokeCount),
    };
}

// ---------------------------------------------------------------------------
// Memory story: the kanji's own line in a radical story when there is one
// (a mnemonic, labelled as such), else the radical's story.

let exampleIndex: Map<string, { key: string; explanation: string }> | null = null;

function storyLineFor(char: string, preferred: string | null): { key: string; explanation: string } | null {
    if (!exampleIndex) {
        exampleIndex = new Map();
        for (const summary of getAllRadicals()) {
            const radical = getRadical(summary.key);
            for (const e of radical?.exampleKanji ?? []) {
                if (!e.explanation) continue;
                const key = `${e.char}\u0000${summary.key}`;
                exampleIndex.set(key, { key: summary.key, explanation: e.explanation });
                if (!exampleIndex.has(e.char)) exampleIndex.set(e.char, { key: summary.key, explanation: e.explanation });
            }
        }
    }
    if (preferred) {
        const own = exampleIndex.get(`${char}\u0000${preferred}`);
        if (own) return own;
    }
    return exampleIndex.get(char) ?? null;
}

function memoryStory(kanji: AtlasKanji, radical: AtlasRadical | null): MemoryStoryView | null {
    const line = storyLineFor(kanji.char, radical?.key ?? null);
    const source = line ? getRadical(line.key) : radical;
    if (!source) return null;
    const text = line?.explanation ?? firstSentences(source.story, 2);
    if (!text) return null;
    return {
        text,
        specific: Boolean(line),
        radical: { key: source.key, char: source.char, name: source.name, href: radicalPath(source.key) },
    };
}

// ---------------------------------------------------------------------------
// Recall options (meaning multiple choice)

let quizPool: QuizCandidate[] | null = null;

const toCandidate = (k: AtlasKanji): QuizCandidate => ({
    char: k.char,
    meaning: meaningLabel(k),
    jlpt: k.jlpt,
    strokeCount: k.strokeCount,
    category: k.category,
});

function recallOptions(kanji: AtlasKanji): LearnData["recall"] {
    quizPool ??= getAllKanji().map(toCandidate);
    const target = toCandidate(kanji);
    const options = buildMeaningOptions(target, quizPool);
    return {
        answer: target.meaning,
        options: options.map((text) => ({
            text,
            from: text === target.meaning ? kanji.char : (quizPool!.find((c) => c.meaning === text && c.char !== kanji.char)?.char ?? null),
        })),
    };
}

// ---------------------------------------------------------------------------
// Links

function alsoBuiltOn(kanji: AtlasKanji, parts: PartView[]): AlsoBuiltOn[] {
    return uniqueParts(parts)
        .map((part) => {
            const all = getKanjiWithComponent(part.char, { exclude: kanji.char });
            const component = kanji.components.find((c) => c.char === part.char);
            const moreHref = component?.radicalKey ? radicalPath(component.radicalKey) : part.href;
            return { part, kanji: all.slice(0, ALSO_BUILT_LIMIT).map(lite), total: all.length, moreHref };
        })
        .filter((group) => group.total > 0);
}

function familyView(
    phonetic: string,
    reading: string | null,
    members: AtlasKanji[],
    self: AtlasKanji,
    regular: boolean,
): SoundFamilyView {
    const asKanji = getKanji(phonetic);
    return {
        phonetic,
        phoneticHref: asKanji ? kanjiPath(asKanji.char) : null,
        reading,
        romaji: reading ? readingToRomaji(reading) : null,
        regular,
        ownReadings: self.onyomi,
        members: members.map((k) => {
            const matches = reading !== null && k.onyomi.includes(reading);
            return {
                ...lite(k),
                reading: plainReading(matches && reading ? reading : (k.onyomi[0] ?? k.kunyomi[0] ?? "")),
                matches,
                self: k.char === self.char,
            };
        }),
    };
}

function soundFamily(kanji: AtlasKanji): SoundFamilyView | null {
    const series = getPhoneticSeries(kanji.char);
    if (!series || series.kanji.length < 2 || !kanji.phonetic) return null;
    return familyView(series.phonetic, series.reading, series.kanji, kanji, kanji.phonetic.regular);
}

/** The family this kanji gives its sound to (毎 -> 海 梅 悔 侮), when it heads one. */
function headedFamily(kanji: AtlasKanji): SoundFamilyView | null {
    if (kanji.phonetic?.char === kanji.char) return null;
    const family = getSoundFamily(kanji.char);
    if (!family) return null;
    const members = family.kanji.filter((k) => k.char !== kanji.char);
    if (!members.length) return null;
    const regular = family.reading !== null && kanji.onyomi.includes(family.reading);
    return familyView(family.phonetic, family.reading, members, kanji, regular);
}

function sameOn(kanji: AtlasKanji): SameOnView[] {
    return getSameOn(kanji.char)
        .filter((g) => g.kanji.length > 0)
        .map((g) => {
            const romaji = readingToRomaji(g.reading);
            const kanji = g.kanji.map((k) => ({ ...lite(k), reading: plainReading(g.reading) }));
            return { reading: g.reading, romaji, kanji, total: g.total, href: searchPath(romaji) };
        });
}

function lookAlikes(kanji: AtlasKanji): LookAlikeView[] {
    return getLookAlikes(kanji.char).map((other) => ({
        ...lite(other),
        strokeCount: other.strokeCount,
        paths: readStrokes(other.char).map((s) => s.d),
        diff: compareParts(kanji, other),
    }));
}

// ---------------------------------------------------------------------------

function metaLine(kanji: AtlasKanji): string {
    return [`JLPT ${kanji.jlpt}`, `${kanji.strokeCount} strokes`, gradeLabel(kanji.grade)].filter(Boolean).join(" · ");
}

function describe(kanji: AtlasKanji, parts: PartView[]): string {
    const bits = [`${kanji.char} means ${meaningLabel(kanji)}.`];
    const layout = layoutReadings(kanji.wordsByReading);
    const firstOn = layout.main.find((b) => b.kind === "on");
    const firstKun = layout.main.find((b) => b.kind === "kun");
    if (firstOn) {
        const word = firstOn.words[0];
        const plain = plainReading(firstOn.reading);
        bits.push(word ? `Read ${plain} (${firstOn.romaji}) in words like ${word.word} (${word.meaning})` : `Read ${plain} (${firstOn.romaji})`);
        if (firstKun) bits[bits.length - 1] += ` and ${plainReading(firstKun.reading)} (${firstKun.romaji}) on its own`;
        bits[bits.length - 1] += ".";
    } else if (firstKun) {
        bits.push(`Read ${plainReading(firstKun.reading)} (${firstKun.romaji}).`);
    }
    if (parts.length >= 2) bits.push(`Built from ${partsCaption(uniqueParts(parts))}.`);
    bits.push(`JLPT ${kanji.jlpt}, ${kanji.strokeCount} strokes, with stroke order.`);
    return truncate(bits.join(" "), 160);
}

export interface KanjiPageData {
    kanji: AtlasKanji;
    meanings: string[];
    headline: string;
    themeColor: string;
    radical: AtlasRadical | null;
    parts: PartView[];
    strokes: StrokeData;
    build: BuildView | null;
    memory: MemoryStoryView | null;
    /** Sourced glyph origin (Wiktionary), null when there is none. */
    etymology: EtymologyView | null;
    /** Sourced ancient forms (Wikimedia Commons, Academia Sinica 小學堂), null when none passed the filter. */
    journey: JourneyView | null;
    alsoBuiltOn: AlsoBuiltOn[];
    soundFamily: SoundFamilyView | null;
    headedFamily: SoundFamilyView | null;
    sameOn: SameOnView[];
    lookAlikes: LookAlikeView[];
    zh: ZhFacts | null;
    meta: string;
    description: string;
    titleReadings: string[];
    learn: LearnData;
}

/** The page's data for `char` (memoised per request: metadata and page share it). */
export const getKanjiPageData = cache(buildKanjiPageData);

function buildKanjiPageData(char: string): KanjiPageData | null {
    const kanji = getKanji(char);
    if (!kanji) return null;

    const radical = kanji.radical ? getRadical(kanji.radical.key) : null;
    const meanings = displayMeanings(kanji.meanings);
    const headline = meaningHeadline(kanji.meanings);
    const themeColor = getThemeColor(kanji.category);
    const strokes = readStrokes(kanji.char);
    const parts = kanji.components.map((c) => toPart(c, strokes.length || kanji.strokeCount));
    const owners = strokeOwners(strokes.length, parts.map((p) => p.strokes));
    const paths = strokes.map((s) => s.d);

    const build: BuildView | null =
        parts.length >= 2 && paths.length
            ? {
                  char: kanji.char,
                  parts,
                  offsets: partOffsets(paths, parts.map((p) => p.strokes)),
                  owners,
                  paths,
                  caption: partsCaption(parts),
              }
            : null;

    const memory = memoryStory(kanji, radical);
    const etymology = etymologyView(getEtymology(kanji.char));
    const ancient = getAncientForms(kanji.char);
    const journey: JourneyView | null =
        ancient && ancient.stages.length
            ? {
                  stages: ancient.stages,
                  etymon: ancient.etymon,
                  captions: journeyCaptions(
                      kanji.char,
                      ancient.etymon,
                      ancient.stages,
                      ancient.files,
                      etymology?.text ?? null,
                      parts.length >= 2 ? partsCaption(uniqueParts(parts)) : null,
                  ),
              }
            : null;
    const layout = layoutReadings(kanji.wordsByReading);
    const { next } = getNeighbors(kanji.char);
    const kokujiOrZh = kanji.zh;
    const meta = metaLine(kanji);
    const k = encodeURIComponent(kanji.char);

    const learn: LearnData = {
        char: kanji.char,
        meaning: headline,
        themeColor,
        meta,
        readings: layout.main.slice(0, 4).map((b) => ({
            kind: b.kind,
            stem: b.stem,
            okurigana: b.okurigana,
            prefix: b.prefix,
            suffix: b.suffix,
            romaji: b.romaji,
        })),
        parts: uniqueParts(parts),
        memory: memory?.text ?? null,
        recall: recallOptions(kanji),
        strokes,
        owners: owners.map((o) => (o === null ? null : (parts[o]?.char ?? null))),
        words: [...layout.main.flatMap((b) => b.words), ...layout.special].slice(0, 3).map(({ word, reading, meaning }) => ({ word, reading, meaning })),
        next: next ? { char: next.char, meaning: displayMeanings(next.meanings)[0] ?? "" } : null,
        printHref: `/teach/print?k=${k}`,
        presentHref: `/teach/present?k=${k}`,
    };

    return {
        kanji,
        meanings,
        headline,
        themeColor,
        radical,
        parts,
        strokes: { strokes, owners },
        build,
        memory,
        etymology,
        journey,
        alsoBuiltOn: alsoBuiltOn(kanji, parts),
        soundFamily: soundFamily(kanji),
        headedFamily: headedFamily(kanji),
        sameOn: sameOn(kanji),
        lookAlikes: lookAlikes(kanji),
        zh: kokujiOrZh ? zhFacts(kanji.char, kokujiOrZh, getUnihan, (c) => (getKanji(c) ? meaningLabel(getKanji(c)!, 2) : null)) : null,
        meta,
        description: describe(kanji, parts),
        titleReadings: titleReadings(kanji),
        learn,
    };
}
