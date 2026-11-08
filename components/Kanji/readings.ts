// Pure helpers for the reading-first kanji page (client-safe, no data imports).
// Relative `.ts` imports so the Node test runner can load this file.

import type { AtlasKanji, KanjiExample, ReadingKind, ReadingWords } from "../../lib/atlas/types.ts";
import { plainReading, readingToRomaji, splitReading } from "../../lib/atlas/readings.ts";

/** KANJIDIC2 tags that are notes, not meanings (働: "work", "(kokuji)"). */
const NOTE_MEANINGS = new Set(["(kokuji)"]);

/** Meanings to show, without KANJIDIC2 notes. */
export function displayMeanings(meanings: readonly string[]): string[] {
    const shown = meanings.filter((m) => !NOTE_MEANINGS.has(m.trim()));
    return shown.length ? shown : [...meanings];
}

/** The meaning headline: the first two meanings ("sea, ocean"). */
export function meaningHeadline(meanings: readonly string[]): string {
    return displayMeanings(meanings).slice(0, 2).join(", ");
}

/**
 * A short label for a part: "Water (3 drops)" -> "water", "person (standing)"
 * -> "person", "sun, day" -> "sun". Proper nouns keep their capital.
 */
export function partGloss(text: string): string {
    const first = text.split(/[,;/]/)[0].replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    if (/^[A-Z][a-z]/.test(first) && !/^(Japan|China|Chinese|Korea|Buddha)/.test(first)) {
        return first[0].toLowerCase() + first.slice(1);
    }
    return first;
}

/** A word's gloss cut to its first senses: "people; men and women; …" -> "people; men and women". */
export function shortGloss(text: string, max = 44): string {
    const senses = text.split(/;\s*/).filter(Boolean);
    let out = senses[0] ?? "";
    for (const sense of senses.slice(1)) {
        if (out.length + sense.length + 2 > max) break;
        out = `${out}; ${sense}`;
    }
    if (out.length <= max) return out;
    const cut = out.slice(0, max - 1);
    const at = Math.max(cut.lastIndexOf(","), cut.lastIndexOf(" "));
    return `${(at > max * 0.5 ? cut.slice(0, at) : cut).replace(/[\s,;]+$/, "")}…`;
}

export interface WordView {
    word: string;
    reading: string;
    meaning: string;
    source?: KanjiExample["source"];
}

export interface ReadingBlock {
    /** The KANJIDIC reading (カイ, やす.む). */
    reading: string;
    kind: Exclude<ReadingKind, "special">;
    stem: string;
    okurigana: string;
    /** Used as a prefix (ふる-) or suffix (-か). */
    prefix: boolean;
    suffix: boolean;
    romaji: string;
    words: WordView[];
}

export interface ReadingLayout {
    /** Readings shown as blocks: those with words, or all of them when none has words. */
    main: ReadingBlock[];
    /** Readings with no words, collapsed behind "N more readings". */
    more: ReadingBlock[];
    /** Irregular words (jukujikun, ateji, 々 words), shown under "Special readings". */
    special: WordView[];
}

function toWords(words: readonly KanjiExample[]): WordView[] {
    const seen = new Set<string>();
    const out: WordView[] = [];
    for (const w of words) {
        if (!w) continue;
        // Kanji alive and JMdict can both list a word (人々); keep the first.
        if (seen.has(w.word)) continue;
        seen.add(w.word);
        out.push({ word: w.word, reading: w.reading, meaning: shortGloss(w.meaning), source: w.source });
    }
    return out;
}

function toBlock(group: ReadingWords): ReadingBlock {
    const { stem, okurigana, prefix, suffix } = splitReading(group.reading);
    return {
        reading: group.reading,
        kind: group.kind === "on" ? "on" : "kun",
        stem,
        okurigana,
        prefix,
        suffix,
        romaji: readingToRomaji(group.reading),
        words: toWords(group.words),
    };
}

/** Splits `wordsByReading` into shown blocks, collapsed readings and special words. */
export function layoutReadings(groups: readonly ReadingWords[]): ReadingLayout {
    const blocks = groups.filter((g) => g.kind !== "special" && g.reading).map(toBlock);
    const special = toWords(groups.filter((g) => g.kind === "special").flatMap((g) => g.words));
    const main = blocks.filter((b) => b.words.length > 0);
    const more = blocks.filter((b) => b.words.length === 0);
    if (main.length === 0) return { main: more, more: [], special };
    return { main, more, special };
}

export interface WordSegment {
    text: string;
    /** This segment is the kanji itself. */
    hit: boolean;
}

/** Splits a word around the kanji so pages can highlight it (日本海 -> 日本 + 海). */
export function wordSegments(word: string, char: string): WordSegment[] {
    if (!char || !word.includes(char)) return [{ text: word, hit: false }];
    const out: WordSegment[] = [];
    for (const [i, part] of word.split(char).entries()) {
        if (i > 0) out.push({ text: char, hit: true });
        if (part) out.push({ text: part, hit: false });
    }
    return out;
}

type ReadingSource = Pick<AtlasKanji, "onyomi" | "kunyomi" | "wordsByReading">;

/**
 * Up to three plain readings for titles, kun first: the first kun reading that
 * has words, then up to two on readings that have words. A rare kun reading
 * without words is left out (芸 -> ゲイ, not うえる); on readings fall back to
 * the first one (鍋 -> なべ, カ), and kun too when no reading has words.
 */
export function titleReadings(kanji: ReadingSource): string[] {
    const withWords = new Set(kanji.wordsByReading.filter((g) => g.words.length > 0).map((g) => g.reading));
    const anyWords = kanji.onyomi.some((r) => withWords.has(r)) || kanji.kunyomi.some((r) => withWords.has(r));
    const pick = (list: readonly string[], count: number, fallback: boolean) => {
        const preferred = list.filter((r) => withWords.has(r));
        return (preferred.length ? preferred : fallback ? list : []).slice(0, count);
    };
    const out = [...pick(kanji.kunyomi, 1, !anyWords), ...pick(kanji.onyomi, 2, true)].map(plainReading).filter(Boolean);
    return [...new Set(out)].slice(0, 3);
}

/** "海 (うみ, カイ) – sea, ocean: readings, words, stroke order". */
export function kanjiTitle(kanji: ReadingSource & Pick<AtlasKanji, "char" | "meanings">): string {
    const readings = titleReadings(kanji);
    const head = readings.length ? `${kanji.char} (${readings.join(", ")})` : kanji.char;
    const tail = readings.length ? "readings, words, stroke order" : "words, stroke order";
    return `${head} – ${meaningHeadline(kanji.meanings)}: ${tail}`;
}

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];

/** "Three readings, and the words that use each"; "々 has no reading of its own". */
export function readingsHeading(char: string, layout: ReadingLayout): string {
    const count = (n: number) => COUNT_WORDS[n] ?? String(n);
    if (layout.main.length === 0) return `${char} has no reading of its own`;
    const withWords = layout.main.filter((b) => b.words.length > 0).length;
    if (withWords === 0) return `${count(layout.main.length)} reading${layout.main.length === 1 ? "" : "s"}`;
    return withWords === 1 ? "One reading, and the words that use it" : `${count(withWords)} readings, and the words that use each`;
}

/** Credit for the words shown: "Words: Kanji alive, CC BY 4.0 · JMdict, EDRDG, CC BY-SA 4.0". */
export function wordsCredit(words: readonly Pick<WordView, "source">[]): string | null {
    const sources = new Set(words.map((w) => w.source));
    const credits = [];
    if (sources.has("kanjialive")) credits.push("Kanji alive, CC BY 4.0");
    if (sources.has("jmdict")) credits.push("JMdict, EDRDG, CC BY-SA 4.0");
    return credits.length ? `Words: ${credits.join(" · ")}` : null;
}

/** A grade as a tag: "Grade 1", "Secondary school", "Name kanji". */
export function gradeTag(grade: number | null): string | null {
    const label = gradeLabel(grade);
    return label ? label[0].toUpperCase() + label.slice(1) : null;
}

/** KANJIDIC2 grade as words: 1–6 school grades, 8 secondary school, 9–10 name kanji. */
export function gradeLabel(grade: number | null): string | null {
    if (grade === null) return null;
    if (grade >= 1 && grade <= 6) return `grade ${grade}`;
    if (grade === 8) return "secondary school";
    if (grade === 9 || grade === 10) return "name kanji";
    return null;
}
