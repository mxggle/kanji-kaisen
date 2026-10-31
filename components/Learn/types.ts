// Props of the #learn layer, built on the server (app/kanji/[char]/data.ts).
// Everything is plain data: the layer never imports the atlas.

import type { PartView, Stroke } from "@/components/Kanji/types";

export type LearnStep = "meet" | "recall" | "trace" | "write";

export const LEARN_STEPS: { id: LearnStep; jp: string; en: string }[] = [
    { id: "meet", jp: "会", en: "Meet" },
    { id: "recall", jp: "想", en: "Recall" },
    { id: "trace", jp: "描", en: "Trace" },
    { id: "write", jp: "書", en: "Write" },
];

export interface LearnReading {
    kind: "on" | "kun";
    stem: string;
    okurigana: string;
    prefix: boolean;
    suffix: boolean;
    romaji: string;
}

export interface LearnOption {
    text: string;
    /** The kanji this meaning belongs to, for gentle feedback ("that's 洋"). */
    from: string | null;
}

export interface LearnData {
    char: string;
    /** "sea, ocean". */
    meaning: string;
    /** The theme's 夜 colour (sets --tc). */
    themeColor: string;
    /** "JLPT N4 · grade 2 · 9 strokes". */
    meta: string;
    readings: LearnReading[];
    parts: PartView[];
    memory: string | null;
    recall: { options: LearnOption[]; answer: string };
    strokes: Stroke[];
    /** The part (by character, one of `parts`) that owns each stroke; null for loose strokes. */
    owners: (string | null)[];
    words: { word: string; reading: string; meaning: string }[];
    next: { char: string; meaning: string } | null;
    printHref: string;
    presentHref: string;
}
