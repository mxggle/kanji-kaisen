// Pure helpers for the radical journey page (/radical/[key]) and /radicals.
// Client-safe and loadable by the Node test runner (relative `.ts` imports).
// Tests in radical.test.mjs.

import { defaultCaption, STAGE_META, type AncientJourneyStage, type JourneyStageId } from "../../lib/story/journey.ts";

// ------------------------------------------------------------- wording

/** Lower-cases a leading capital unless the word is an acronym ("Fire, flame" -> "fire, flame"). */
function lowerFirst(text: string): string {
    return /^[A-Z](?![A-Z])/.test(text) ? text[0].toLowerCase() + text.slice(1) : text;
}

/** "Ki · tree, wood" for the page's heading. */
export function radicalHeadline(name: string, meaning: string): string {
    const m = lowerFirst(meaning.trim());
    return m ? `${name} · ${m}` : name;
}

/** The first plain gloss of a radical's meaning: "Water (3 drops)" -> "water", "tree, wood" -> "tree". */
export function shortMeaning(meaning: string): string {
    return meaning.split(/[,;/(]/)[0].trim().toLowerCase();
}

/**
 * A story's `position` as a phrase for the counts line: first sentence only,
 * no trailing full stop, shouting words lowered ("Always appears on the LEFT
 * side of the kanji." -> "always appears on the left side of the kanji").
 */
export function positionPhrase(position: string): string {
    const first = position.trim().split(/(?<=[.!?])\s+(?=[A-Z])/)[0] ?? "";
    const calm = first.replace(/\b[A-Z]{2,}(?:-[A-Z]{2,})*\b/g, (w) => w.toLowerCase());
    return lowerFirst(calm.replace(/[\s.]+$/, ""));
}

/** A KANJIDIC reading without okurigana dots or affix dashes: "やす.む" -> "やすむ", "-どき" -> "どき". */
export function cleanReading(reading: string): string {
    return reading.replace(/\./g, "").replace(/^-+|-+$/g, "");
}

/** "やすむ · キュウ": the first kun'yomi, then the first on'yomi (either may be missing). */
export function readingLine(onyomi: readonly string[], kunyomi: readonly string[]): string {
    const kun = kunyomi[0] ? cleanReading(kunyomi[0]) : "";
    return [kun, onyomi[0] ?? ""].filter(Boolean).join(" · ");
}

// ------------------------------------------------------------- what it grows into

export interface StoryExample {
    char: string;
    meaning: string;
    explanation: string;
    /** True when the kanji has an atlas page. */
    exists?: boolean;
}

/** Story examples with a real character and meaning (the compiled stories hold a few placeholders). */
export function usableExamples<T extends StoryExample>(examples: readonly T[] = []): T[] {
    return examples.filter(
        (ex) =>
            ex.char &&
            ex.char !== "?" &&
            ex.char !== "undefined" &&
            ex.meaning &&
            ex.meaning !== "example" &&
            ex.meaning !== "undefined",
    );
}

export interface GrowsPick {
    char: string;
    /** The memory story's one-liner, for story examples. */
    explanation?: string;
}

/**
 * The kanji to show under "What X grows into": the story's examples that have
 * a page, then the radical's most common kanji, without repeats and without
 * the radical's own character. `common` must already be most common first.
 */
export function pickGrowsInto(
    radicalChar: string,
    examples: readonly StoryExample[],
    common: readonly { char: string }[],
    limit: number,
): GrowsPick[] {
    const out: GrowsPick[] = [];
    const seen = new Set([radicalChar]);
    for (const ex of usableExamples(examples)) {
        if (out.length >= limit) break;
        if (!ex.exists || seen.has(ex.char)) continue;
        seen.add(ex.char);
        out.push({ char: ex.char, explanation: ex.explanation });
    }
    for (const k of common) {
        if (out.length >= limit) break;
        if (seen.has(k.char)) continue;
        seen.add(k.char);
        out.push({ char: k.char });
    }
    return out;
}

export interface PartLike {
    char: string;
    role: "meaning" | "sound" | "both" | "form";
}

/**
 * "木 tree + 交 sound" from a kanji's KanjiVG components. Sound parts are
 * labelled as such; other parts get their own meaning from `glossOf`. Empty
 * for kanji with fewer than two parts, which a sum can't explain.
 */
export function partsLine(components: readonly PartLike[], glossOf: (part: PartLike) => string | null | undefined): string {
    if (components.length < 2) return "";
    return components
        .map((c) => {
            const label = c.role === "sound" ? "sound" : glossOf(c);
            return label ? `${c.char} ${label}` : c.char;
        })
        .join(" + ");
}

// ------------------------------------------------------------- the journey

export interface StageFile {
    /** The code point the file depicts (the etymon or a variant). */
    char: string;
    src?: string;
}

const shownBy = (stage: AncientJourneyStage, files: readonly StageFile[]) =>
    files.find((f) => f.src && f.src === stage.src)?.char;

/**
 * Captions for stages whose file depicts another character than the page's
 * (氵's forms are 水's, 冫's are 仌's): the stage's usual caption plus which
 * character is shown. Other stages keep JourneyPlayer's default caption.
 */
export function stageCaptions(
    char: string,
    stages: readonly AncientJourneyStage[],
    files: readonly StageFile[],
): Partial<Record<JourneyStageId, string>> {
    const captions: Partial<Record<JourneyStageId, string>> = {};
    for (const s of stages) {
        const shown = shownBy(s, files);
        if (shown && shown !== char) captions[s.stage] = `${defaultCaption(s.stage, char)} The character shown is ${shown}.`;
    }
    return captions;
}

const joinAnd = (items: string[]) =>
    items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * Which stages show another character than `char`, e.g. "The bronze and seal
 * stages show 仌, not 冫 itself." or "The oracle bone stage shows 网 and the
 * bronze stage shows 冈, not 罒 itself." Empty when every stage shows `char`.
 */
export function shownNote(char: string, stages: readonly AncientJourneyStage[], files: readonly StageFile[]): string {
    const groups: { shown: string; names: string[] }[] = [];
    for (const s of stages) {
        const shown = shownBy(s, files);
        if (!shown || shown === char) continue;
        const name = STAGE_META[s.stage].en.toLowerCase();
        const group = groups.find((g) => g.shown === shown);
        if (group) group.names.push(name);
        else groups.push({ shown, names: [name] });
    }
    if (groups.length === 0) return "";
    const clauses = groups.map(
        (g, i) => `${i === 0 ? "The" : "the"} ${joinAnd(g.names)} ${g.names.length > 1 ? "stages show" : "stage shows"} ${g.shown}`,
    );
    return `${joinAnd(clauses)}, not ${char} itself.`;
}

/** The note under a journey with no ancient stage. */
export function emptyJourneyNote(char: string): string {
    return `No ancient form of ${char} passed our licence check yet. We only show forms from public-domain or CC0 sources.`;
}

// ------------------------------------------------------------- origin (Wiktionary)

/** Permanent link to the Wiktionary revision an origin was read from. */
export function wiktionaryRevisionUrl(page: string, revid: number): string {
    return `https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(page)}&oldid=${revid}`;
}

// A colon followed straight by a conjunction, or a colon ending the sentence,
// means the source showed an image there that the text can't carry
// ("originally drawn as: and later as 丷"). Empty brackets or quotes likewise.
const ELIDED = /:\s*(?:$|(?:and|or|but|then|later)\b)|\(\s*\)|“\s*”/i;

/**
 * Sourced origin text without sentences that lost an inline image in the
 * Wiktionary extract. Never adds or rewrites words.
 */
export function originText(text: string | undefined): string {
    if (!text) return "";
    return text
        .trim()
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !ELIDED.test(sentence.replace(/[.!?]+$/, "")))
        .join(" ");
}
