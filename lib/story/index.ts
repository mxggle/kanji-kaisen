// Server-only entry point for the sourced story layer: ancient forms from
// Wikimedia Commons and Academia Sinica 小學堂 (lib/core/ancient-forms.json,
// public/ancient/*.svg and *.png) and
// glyph origins from Wiktionary (lib/core/etymology.wiktionary.json).
// Client components get this data via props.

import "server-only";

import fs from "node:fs";
import path from "node:path";
import ancientData from "../core/ancient-forms.json";
import etymologyData from "../core/etymology.wiktionary.json";
import { kanjivgFileName } from "../atlas/kanjivg-svg.ts";
import { createStory, extractStrokePaths } from "./core.ts";
import type { AncientFormsManifest, EtymologyData } from "./types.ts";

const story = createStory(ancientData as unknown as AncientFormsManifest, etymologyData as unknown as EtymologyData);

export const { getAncientForms, getRadicalAncientForms, getEtymology, getRadicalEtymology, getAncientFormCredits } =
    story;

// Pages are fully prerendered, so the KanjiVG files needn't be traced into
// the server bundle; the ignore comments keep Turbopack from globbing them.
const KANJIVG_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "kanjivg", "kanji");

// CJK Radicals Supplement chars the atlas shows, mapped to the unified
// ideographs KanjiVG files them under (Unicode EquivalentUnifiedIdeograph.txt).
const UNIFIED_EQUIVALENT: Record<string, string> = { "⺖": "忄", "⺮": "𥫗" };

/** KanjiVG stroke paths of `char` in order, for JourneyPlayer's `todayStrokes`; [] if none. */
export function getTodayStrokes(char: string): string[] {
    for (const c of [char, UNIFIED_EQUIVALENT[char]]) {
        if (!c) continue;
        try {
            const raw = fs.readFileSync(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ KANJIVG_DIR, kanjivgFileName(c)), "utf8");
            const strokes = extractStrokePaths(raw);
            if (strokes.length) return strokes;
        } catch {
            // no file for this code point
        }
    }
    return [];
}

export type { AncientForms } from "./core.ts";
export * from "./types.ts";
export {
    ANCIENT_STAGES,
    STAGE_META,
    journeyTabs,
    type AncientJourneyStage,
    type JourneyCredit,
    type JourneyStageId,
} from "./journey.ts";
export { FORMATION_LABELS } from "./wiktionary.ts";
