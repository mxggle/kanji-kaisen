// View models the kanji page builds on the server (app/kanji/[char]/data.ts)
// and passes to its components as props. Type-only; client-safe.

import type { ComponentRole } from "@/lib/atlas/types";
import type { Point, Stroke } from "./strokes";
import type { PartDiff } from "./compare";
import type { AncientJourneyStage, JourneyStageId } from "@/lib/story/journey";

export type { Stroke } from "./strokes";
export type { EtymologyView, EtymologyPart } from "./story";

export interface PartView {
    char: string;
    role: ComponentRole;
    /** "meaning", "sound", "meaning and sound", "part". */
    roleLabel: string;
    /** "water" for 氵; null when no gloss is known (咼). */
    gloss: string | null;
    /** The theme's 夜 colour (sets --tc). */
    themeColor: string;
    /** Drawn in ink rather than the accent in 墨 (sound and form parts). */
    alt: boolean;
    /** Radical page, or the part's own kanji page; null when neither exists. */
    href: string | null;
    /** 0-based KanjiVG stroke indexes. */
    strokes: number[];
}

export interface BuildView {
    char: string;
    /** Every part, in KanjiVG order (repeats kept: 三 has 一 three times). */
    parts: PartView[];
    /** Where each part sits in the "parts" stage, in 109-unit coordinates. */
    offsets: Point[];
    /** Owner part of each stroke (index into `parts`), null for loose strokes. */
    owners: (number | null)[];
    paths: string[];
    /** "氵 water (meaning) + 毎 (sound)". */
    caption: string;
}

export interface KanjiLite {
    char: string;
    meaning: string;
    /** A plain reading to show under the glyph (first on'yomi, else kun'yomi). */
    reading: string;
}

export interface AlsoBuiltOn {
    part: PartView;
    kanji: KanjiLite[];
    total: number;
    /** "All N kanji with 氵" link target, when one exists. */
    moreHref: string | null;
}

export interface FamilyMember extends KanjiLite {
    /** Reads with the family reading. */
    matches: boolean;
    self: boolean;
}

export interface SoundFamilyView {
    /** The sound part (毎). */
    phonetic: string;
    phoneticHref: string | null;
    /** Shared on'yomi (カイ) and its romaji; null when the family shares none. */
    reading: string | null;
    romaji: string | null;
    /** This kanji reads like the family. */
    regular: boolean;
    /** This kanji's on'yomi (for the irregular note). */
    ownReadings: string[];
    members: FamilyMember[];
}

export interface SameOnView {
    reading: string;
    romaji: string;
    kanji: KanjiLite[];
    total: number;
    href: string;
}

export interface LookAlikeView extends KanjiLite {
    strokeCount: number;
    paths: string[];
    diff: PartDiff;
}

export interface MemoryStoryView {
    text: string;
    /** The kanji-specific line came from the radical's example list. */
    specific: boolean;
    radical: { key: string; char: string; name: string; href: string };
}

export interface StrokeData {
    strokes: Stroke[];
    /** Owner part of each stroke, null for loose strokes or no parts. */
    owners: (number | null)[];
}

/** Sourced ancient forms for the journey (JourneyPlayer props). */
export interface JourneyView {
    stages: AncientJourneyStage[];
    captions: Partial<Record<JourneyStageId, string>>;
    /** The code point the forms hang on (學 for 学). */
    etymon: string;
}
