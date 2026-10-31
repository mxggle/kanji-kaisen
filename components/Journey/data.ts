// Server-side view models for /radical/[key] and /radicals: the atlas radical,
// its sourced journey (Commons ancient forms, KanjiVG strokes), its sourced
// origin (Wiktionary) and its memory story, kept apart.

import "server-only";

import { getAllRadicals, getCategory, getKanji, getRadical, getRadicalNeighbors, getRadicalSummary } from "@/lib/atlas";
import type { AtlasKanji, AtlasRadical, AtlasRadicalSummary, Neighbors } from "@/lib/atlas/types";
import { getCategorySlug } from "@/lib/atlas/categories";
import {
    FORMATION_LABELS,
    getEtymology,
    getRadicalAncientForms,
    getRadicalEtymology,
    getTodayStrokes,
    type AncientJourneyStage,
    type EtymologyComponent,
    type JourneyStageId,
} from "@/lib/story";
import { compareByFrequency } from "@/components/Theme/order";
import {
    originText,
    partsLine,
    pickGrowsInto,
    readingLine,
    shortMeaning,
    shownNote,
    stageCaptions,
    usableExamples,
    wiktionaryRevisionUrl,
    type PartLike,
} from "./radical";

/** Kanji shown under "What X grows into". */
export const GROWS_LIMIT = 4;

export interface GrowsItem {
    char: string;
    /** First two KANJIDIC meanings. */
    meaning: string;
    /** "やすむ · キュウ". */
    reading: string;
    /** The memory story's one-liner, else its KanjiVG parts ("木 tree + 交 sound"), else "". */
    note: string;
    /** Whether `note` comes from the memory story (a mnemonic) or the parts. */
    noteKind: "story" | "parts" | null;
    /** The kanji page has something to build: two or more parts, or a sourced origin. */
    hasBuild: boolean;
}

export interface OriginView {
    /** "Pictogram", with the Chinese term ("象形"). */
    formation: { en: string; zh: string } | null;
    /** At most two sentences, from Wiktionary. */
    text: string;
    components: EtymologyComponent[];
    /** The Wiktionary page it comes from (水 for 氵). */
    page: string;
    /** Permanent link to the revision read. */
    revisionUrl: string;
}

export interface RadicalJourneyView {
    radical: AtlasRadical;
    stages: AncientJourneyStage[];
    captions: Partial<Record<JourneyStageId, string>>;
    /** Which stages show another character than the radical's own ("The bronze and seal stages show 仌, not 冫 itself."), else "". */
    shownNote: string;
    strokes: string[];
    origin: OriginView | null;
    grows: GrowsItem[];
    /** The radical's kanji, most common first. */
    kanji: AtlasKanji[];
    /** Story-only side forms sharing this radical's kanji (木 -> kihen). */
    sideForms: AtlasRadicalSummary[];
    theme: { name: string; chars: string[] } | null;
    neighbors: Neighbors<AtlasRadicalSummary>;
}

function originView(key: string, char: string): OriginView | null {
    const entry = getRadicalEtymology(key, char);
    if (!entry) return null;
    const text = originText(entry.text);
    const formation = entry.formation ? FORMATION_LABELS[entry.formation] : null;
    if (!text && !formation && entry.components.length === 0) return null;
    return {
        formation,
        text,
        components: entry.components,
        page: entry.page,
        revisionUrl: wiktionaryRevisionUrl(entry.page, entry.revid),
    };
}

/** A component's own meaning: its atlas radical's, else the kanji's. */
function glossOf(part: PartLike & { radicalKey?: string }): string | null {
    const radical = part.radicalKey ? getRadicalSummary(part.radicalKey) : null;
    if (radical) return shortMeaning(radical.meaning) || null;
    return getKanji(part.char)?.meanings[0] ?? null;
}

function growsItems(radical: AtlasRadical, common: AtlasKanji[]): GrowsItem[] {
    const picks = pickGrowsInto(radical.char, usableExamples(radical.exampleKanji), common, GROWS_LIMIT);
    return picks.flatMap((pick) => {
        const k = getKanji(pick.char);
        if (!k) return [];
        const parts = partsLine(k.components, glossOf);
        const note = pick.explanation || parts;
        return [{
            char: k.char,
            meaning: k.meanings.slice(0, 2).join(", "),
            reading: readingLine(k.onyomi, k.kunyomi),
            note,
            noteKind: pick.explanation ? "story" : parts ? "parts" : null,
            hasBuild: k.components.length >= 2 || getEtymology(k.char) !== null,
        }];
    });
}

/** Everything the radical page shows, or null for an unknown key. */
export function getRadicalJourney(key: string): RadicalJourneyView | null {
    const radical = getRadical(key);
    if (!radical) return null;

    const forms = getRadicalAncientForms(radical.key, radical.char);
    const stages = forms?.stages ?? [];
    const files = forms?.files ?? [];
    const kanji = [...radical.kanji].sort(compareByFrequency);
    const themeKanji = radical.category ? themeChars(radical.category) : null;

    return {
        radical,
        stages,
        captions: stageCaptions(radical.char, stages, files),
        shownNote: shownNote(radical.char, stages, files),
        strokes: getTodayStrokes(radical.char),
        origin: originView(radical.key, radical.char),
        grows: growsItems(radical, kanji),
        kanji,
        sideForms:
            radical.kanjiCount > 0
                ? getAllRadicals().filter((r) => r.kanjiCount === 0 && r.char === radical.char && r.key !== radical.key)
                : [],
        theme: radical.category && themeKanji ? { name: radical.category, chars: themeKanji } : null,
        neighbors: getRadicalNeighbors(radical.key),
    };
}

// Every kanji of a theme, for ThemeScroll; built once per theme per build.
const themeCache = new Map<string, string[]>();

function themeChars(category: string): string[] | null {
    const cached = themeCache.get(category);
    if (cached) return cached;
    const theme = getCategory(getCategorySlug(category));
    if (!theme) return null;
    const chars = theme.kanji.map((k) => k.char);
    themeCache.set(category, chars);
    return chars;
}

/** Number of sourced ancient stages for a radical (0–3). */
export function ancientStageCount(radical: Pick<AtlasRadicalSummary, "key" | "char">): number {
    return getRadicalAncientForms(radical.key, radical.char)?.stages.length ?? 0;
}
