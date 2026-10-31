// Pure glue between the sourced story layer (lib/story) and the kanji page:
// the etymology block's view and the journey's captions (client-safe).

import type { EtymologyEntry } from "../../lib/story/types.ts";
import { FORMATION_LABELS } from "../../lib/story/wiktionary.ts";
import { defaultCaption, STAGE_META, type AncientJourneyStage, type AncientStage, type JourneyStageId } from "../../lib/story/journey.ts";

export interface EtymologyPart {
    char: string;
    /** The shape inside the kanji when it differs (水 is shown as 氵). */
    form?: string;
    role?: "semantic" | "phonetic";
    gloss?: string;
}

export interface EtymologyView {
    /** "Phono-semantic compound (形聲)"; null when Wiktionary gives none. */
    formation: string | null;
    parts: EtymologyPart[];
    /** At most two plain sentences; null when only the structure is known. */
    text: string | null;
    /** Language of the Wiktionary section the entry comes from, for lang tags. */
    lang: "zh-Hant" | "ja";
    url: string;
    page: string;
    revid: number;
}

/** The etymology block's data, or null when the entry says nothing showable. */
export function etymologyView(entry: EtymologyEntry | null): EtymologyView | null {
    if (!entry) return null;
    const formation = entry.formation ? FORMATION_LABELS[entry.formation] : null;
    const text = entry.text?.trim() || null;
    const parts = entry.components.map((c) => ({ ...c }));
    if (!text && !parts.length && !formation) return null;
    return {
        formation: formation ? (formation.zh ? `${formation.en} (${formation.zh})` : formation.en) : null,
        parts,
        text,
        lang: entry.section === "Japanese" ? "ja" : "zh-Hant",
        url: entry.url,
        page: entry.page,
        revid: entry.revid,
    };
}

export interface AncientFile {
    /** Self-hosted path of the shown file. */
    src?: string;
    /** The code point the file depicts (學 for 学, 斆 for a redirected seal). */
    char: string;
}

/**
 * Journey captions for a kanji: every ancient stage names the character its
 * file depicts when that isn't the kanji itself (学's oracle form is 學's); the
 * oldest stage carries the sourced etymology sentence when there is one; today
 * gets the parts caption.
 */
export function journeyCaptions(
    char: string,
    etymon: string,
    stages: readonly AncientJourneyStage[],
    files: readonly AncientFile[],
    etymologyText: string | null,
    partsCaption: string | null,
): Partial<Record<JourneyStageId, string>> {
    const captions: Partial<Record<JourneyStageId, string>> = {};
    stages.forEach((stage, i) => {
        const depicted = files.find((f) => f.src === stage.src)?.char ?? etymon;
        const name = STAGE_META[stage.stage as AncientStage].name;
        let prefix = "";
        if (depicted !== char) {
            prefix =
                depicted === etymon
                    ? `${name} of ${depicted}, the older form of ${char}. `
                    : `${name} filed under ${depicted} on Wikimedia Commons. `;
        }
        const body = i === 0 && etymologyText ? etymologyText : defaultCaption(stage.stage, char);
        captions[stage.stage] = `${prefix}${body}`;
    });
    if (partsCaption) captions.today = `Today: ${partsCaption}.`;
    return captions;
}
