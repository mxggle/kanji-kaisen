// Pure lookups over the sourced story data (no fs, no server-only), so tests
// can load them. `lib/story/index.ts` binds them to the JSON files.

import { creditText, stageWhen, ANCIENT_STAGES, type AncientJourneyStage } from "./journey.ts";
import type {
    AncientFormFile,
    AncientFormsEntry,
    AncientFormsManifest,
    EtymologyData,
    EtymologyEntry,
} from "./types.ts";

export interface AncientForms {
    // The display char asked for, and the code point whose forms these are.
    char: string;
    etymon: string;
    // Shown stages with a self-hosted file, in historical order (may be empty
    // when only big seal/slip/silk files exist).
    stages: AncientJourneyStage[];
    // Every kept file for the char (shown and recorded), for credits.
    files: (AncientFormFile & { name: string })[];
    picture?: AncientFormsEntry["picture"];
}

export function createStory(ancient: AncientFormsManifest, etymology: EtymologyData) {
    const fileEntry = (name: string) => ({ name, ...ancient.files[name] });

    function toForms(char: string, entry: AncientFormsEntry | undefined): AncientForms | null {
        if (!entry) return null;
        const stages: AncientJourneyStage[] = [];
        for (const stage of ANCIENT_STAGES) {
            const name = entry[stage];
            const file = name ? ancient.files[name] : undefined;
            if (!file?.src) continue;
            stages.push({
                stage,
                src: file.src,
                credit: { text: creditText(stage, file.license, !!file.source), href: file.url },
                when: stageWhen(stage, file.period),
            });
        }
        const names = [...ANCIENT_STAGES.map((s) => entry[s]), ...(entry.other ?? [])].filter(
            (n): n is string => !!n && !!ancient.files[n],
        );
        const out: AncientForms = { char, etymon: entry.etymon, stages, files: names.map(fileEntry) };
        if (entry.picture) out.picture = entry.picture;
        return out;
    }

    /** Ancient forms for a display char (学 gets 學's), or null when none passed the filter. */
    function getAncientForms(char: string): AncientForms | null {
        return toForms(char, ancient.chars[char]);
    }

    /**
     * Ancient forms for a radical page: the radical key's own entry when its
     * kanji belong to another Kangxi radical (月 nikuzuki -> 肉), else the
     * display char's.
     */
    function getRadicalAncientForms(key: string, char: string): AncientForms | null {
        return toForms(char, ancient.radicals[key] ?? ancient.chars[char]);
    }

    /** Sourced glyph origin (Wiktionary) for a display char, or null. */
    function getEtymology(char: string): EtymologyEntry | null {
        return etymology.entries[char] ?? null;
    }

    function getRadicalEtymology(key: string, char: string): EtymologyEntry | null {
        return etymology.radicals[key] ?? etymology.entries[char] ?? null;
    }

    /** Every kept Commons file, sorted by name, for an attribution list. */
    function getAncientFormCredits(): (AncientFormFile & { name: string })[] {
        return Object.keys(ancient.files)
            .sort()
            .map(fileEntry);
    }

    return { getAncientForms, getRadicalAncientForms, getEtymology, getRadicalEtymology, getAncientFormCredits };
}

/**
 * Stroke paths (`d` attributes, in stroke order) from a raw KanjiVG file, for
 * the journey's "today" stage. Empty when the file has no stroke group.
 */
export function extractStrokePaths(raw: string): string[] {
    const start = raw.search(/<g[^>]*id="kvg:StrokePaths_/);
    if (start === -1) return [];
    const end = raw.search(/<g[^>]*id="kvg:StrokeNumbers_/);
    const group = raw.slice(start, end === -1 ? undefined : end);
    return [...group.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
}
