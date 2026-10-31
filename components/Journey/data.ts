// Server-side view models for /radical/[key] and /radicals: the atlas radical,
// its sourced journey (Commons and 小學堂 ancient forms, KanjiVG strokes), its
// sourced origin (Wiktionary) and its memory story, kept apart.

import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getAllRadicals, getKanjiByRadical, getKanjiWithComponent, getRadical } from "@/lib/atlas";
import type { AtlasKanji, AtlasRadical, AtlasRadicalSummary, Neighbors } from "@/lib/atlas/types";
import { kanjivgFileName } from "@/lib/atlas/kanjivg-svg";
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
import { extractStrokePaths } from "@/lib/story/core";
import { compareByFrequency } from "@/components/Theme/order";
import {
    buildsOn,
    growthFormula,
    originText,
    pickPlacements,
    placementIn,
    rankGrowth,
    shownNote,
    wiktionaryRevisionUrl,
    type FormulaPart,
    type Placement,
} from "./radical";

/** Sourced examples shown under "What it grows into". */
export const GROWTH_LIMIT = 3;

export interface OriginView {
    /** "Pictogram", with the Chinese term ("象形"). */
    formation: { en: string; zh: string } | null;
    /** At most two sentences, from Wiktionary. */
    text: string;
    components: EtymologyComponent[];
    /** The Wiktionary page it comes from (水 for 氵). */
    page: string;
    revid: number;
    /** Permanent link to the revision read. */
    revisionUrl: string;
}

/** A kanji of the radical whose sourced origin builds on it. */
export interface GrowthView {
    kanji: AtlasKanji;
    /** Empty for a picture or an indicative (本): the text then names the radical. */
    formula: FormulaPart[];
    formation: { en: string; zh: string } | null;
    text: string;
    page: string;
    revisionUrl: string;
}

/** One kanji showing where the radical sits, drawn from KanjiVG with the radical's strokes marked. */
export interface PlacementView {
    char: string;
    meaning: string;
    placement: Placement;
    /** Every stroke of the kanji, in order. */
    strokes: string[];
    /** 0-based indexes of the radical's strokes. */
    radical: number[];
}

export interface NeighbourRadical {
    key: string;
    char: string;
    name: string;
    meaning: string;
    category: string | null;
    /** Its kanji, most common first, for the seal's ink. */
    chars: string;
}

export interface RadicalJourneyView {
    radical: AtlasRadical;
    stages: AncientJourneyStage[];
    /** Catalogue reference per stage, from the file ("甲600 (商)"). */
    refs: Partial<Record<JourneyStageId, string>>;
    /** Which stages show another character than the radical's own ("The bronze and seal stages show 仌, not 冫 itself."), else "". */
    shownNote: string;
    strokes: string[];
    origin: OriginView | null;
    growth: GrowthView[];
    placements: PlacementView[];
    /** The radical's kanji, most common first (a side form shows its base's). */
    kanji: AtlasKanji[];
    /** Atlas kanji with the radical among their parts, whatever their radical. */
    insideCount: number;
    /** Story-only side forms sharing this radical's kanji (木 -> kihen). */
    sideForms: AtlasRadicalSummary[];
    /** Previous and next radical with kanji in the same theme. */
    neighbors: Neighbors<NeighbourRadical>;
}

// Pages are fully prerendered, so the KanjiVG files needn't be traced into
// the server bundle; the ignore comments keep Turbopack from globbing them.
const KANJIVG_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "kanjivg", "kanji");

function readKanjiVg(char: string): string | null {
    try {
        return fs.readFileSync(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ KANJIVG_DIR, kanjivgFileName(char)), "utf8");
    } catch {
        return null;
    }
}

const unique = (list: (string | null | undefined)[]) => [...new Set(list.filter((s): s is string => !!s))];

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
        revid: entry.revid,
        revisionUrl: wiktionaryRevisionUrl(entry.page, entry.revid),
    };
}

/** The radical's shapes as KanjiVG names them in its kanji (亻, 忄 for ⺖ …), the display char first. */
function kanjivgForms(char: string, kanjiKey: string, kanji: readonly AtlasKanji[]): string[] {
    return unique([char, ...kanji.flatMap((k) => k.components.filter((c) => c.radicalKey === kanjiKey).map((c) => c.char))]);
}

function placements(char: string, kanjiKey: string, kanji: readonly AtlasKanji[]): PlacementView[] {
    const others = kanji.filter((k) => k.char !== char);
    const picked = pickPlacements(others, (k) => {
        const raw = readKanjiVg(k.char);
        if (!raw) return null;
        const forms = unique([char, ...k.components.filter((c) => c.radicalKey === kanjiKey).map((c) => c.char)]);
        return placementIn(raw, forms);
    });
    return picked.flatMap((p) => {
        const strokes = extractStrokePaths(readKanjiVg(p.kanji.char) ?? "");
        if (strokes.length === 0) return [];
        return [{
            char: p.kanji.char,
            meaning: p.kanji.meanings[0] ?? "",
            placement: p.placement,
            strokes,
            radical: p.strokes.map((n) => n - 1).filter((i) => i < strokes.length),
        }];
    });
}

/** The radical's kanji whose Wiktionary origin builds on it, best examples first. */
function growth(char: string, forms: readonly string[], kanji: readonly AtlasKanji[]): GrowthView[] {
    const sourced = kanji.flatMap((k) => {
        const entry = k.char === char ? null : getEtymology(k.char);
        if (!entry || !buildsOn(entry, forms)) return [];
        const text = originText(entry.text);
        const formula = growthFormula(entry.components, char, forms);
        if (!text && formula.length === 0) return [];
        return [{ k, entry, text, formula, formation: entry.formation }];
    });
    return rankGrowth(sourced, GROWTH_LIMIT).map(({ k, entry, text, formula }) => ({
        kanji: k,
        formula,
        formation: entry.formation ? FORMATION_LABELS[entry.formation] : null,
        text,
        page: entry.page,
        revisionUrl: wiktionaryRevisionUrl(entry.page, entry.revid),
    }));
}

const kanjiChars = (key: string) => [...getKanjiByRadical(key)].sort(compareByFrequency).map((k) => k.char).join("");

function neighbourOf(r: AtlasRadicalSummary | null | undefined): NeighbourRadical | null {
    if (!r) return null;
    return { key: r.key, char: r.char, name: r.name, meaning: r.meaning, category: r.category, chars: kanjiChars(r.key) };
}

/**
 * Previous and next radical with kanji in the same theme, in index order
 * (most kanji first). A story-only side form sits right after its base.
 */
function themeNeighbours(radical: AtlasRadical): Neighbors<NeighbourRadical> {
    const list = getAllRadicals().filter((r) => r.category === radical.category && r.kanjiCount > 0);
    const anchor = radical.kanjiCount > 0 ? radical.key : radical.variantOf?.key;
    const i = list.findIndex((r) => r.key === anchor);
    if (i === -1) return { prev: null, next: null };
    if (anchor !== radical.key) return { prev: neighbourOf(list[i]), next: neighbourOf(list[i + 1]) };
    return { prev: neighbourOf(list[i - 1]), next: neighbourOf(list[i + 1]) };
}

/** Everything the radical page shows, or null for an unknown key. */
export function getRadicalJourney(key: string): RadicalJourneyView | null {
    const radical = getRadical(key);
    if (!radical) return null;

    const ancient = getRadicalAncientForms(radical.key, radical.char);
    const stages = ancient?.stages ?? [];
    const files = ancient?.files ?? [];
    const refs: Partial<Record<JourneyStageId, string>> = {};
    for (const s of stages) {
        const ref = files.find((f) => f.src === s.src)?.ref;
        if (ref) refs[s.stage] = ref;
    }

    const kanji = [...radical.kanji].sort(compareByFrequency);
    const kanjiKey = radical.variantOf?.key ?? radical.key;
    const forms = kanjivgForms(radical.char, kanjiKey, kanji);
    const origin = originView(radical.key, radical.char);
    const inside = new Set(forms.flatMap((f) => getKanjiWithComponent(f).map((k) => k.char)));

    return {
        radical,
        stages,
        refs,
        shownNote: shownNote(radical.char, stages, files),
        strokes: getTodayStrokes(radical.char),
        origin,
        growth: growth(radical.char, unique([...forms, radical.variantOf?.char, origin?.page]), kanji),
        placements: placements(radical.char, kanjiKey, kanji),
        kanji,
        insideCount: inside.size,
        sideForms:
            radical.kanjiCount > 0
                ? getAllRadicals().filter((r) => r.kanjiCount === 0 && r.char === radical.char && r.key !== radical.key)
                : [],
        neighbors: themeNeighbours(radical),
    };
}

/** Number of sourced ancient stages for a radical (0–3). */
export function ancientStageCount(radical: Pick<AtlasRadicalSummary, "key" | "char">): number {
    return getRadicalAncientForms(radical.key, radical.char)?.stages.length ?? 0;
}
