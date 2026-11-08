// Stage metadata and ordering for the journey player (pure; safe to import
// from client components). Captions here are generic facts about each
// script, not claims about a character: pages pass sourced captions.

import type { AccLicense, AccPeriod } from "./acc-license.ts";

export type AncientStage = "oracle" | "bronze" | "seal";
export type JourneyStageId = AncientStage | "today";

export interface JourneyCredit {
    text: string;
    href?: string;
}

export interface AncientJourneyStage {
    stage: AncientStage;
    // Monochrome SVG or transparent PNG, drawn in the accent colour (used as a CSS mask).
    src: string;
    credit: JourneyCredit;
    // Overrides the stage's default date line ("Warring States · 475–221 BCE").
    when?: string;
}

export const ANCIENT_STAGES: AncientStage[] = ["oracle", "bronze", "seal"];

export const STAGE_META: Record<JourneyStageId, { jp: string; en: string; name: string; when: string }> = {
    oracle: { jp: "甲骨", en: "Oracle bone", name: "Oracle bone form", when: "Shang · c. 1200 BCE" },
    bronze: { jp: "金文", en: "Bronze", name: "Bronze form", when: "Zhou · c. 1000 BCE" },
    seal: { jp: "篆", en: "Seal", name: "Seal form", when: "Qin · 221 BCE" },
    today: { jp: "楷", en: "Today", name: "Today’s form", when: "brush and print" },
};

const PERIOD_WHEN: Record<AccPeriod, string> = {
    shang: "Shang · c. 1200 BCE",
    "western-zhou": "Western Zhou · c. 1000 BCE",
    "spring-autumn": "Spring and Autumn · 770–476 BCE",
    "warring-states": "Warring States · 475–221 BCE",
};

/** Date line for a stage, from the file's period when Commons gives one. */
export function stageWhen(stage: AncientStage, period?: AccPeriod): string {
    if (stage === "seal" || !period) return STAGE_META[stage].when;
    return PERIOD_WHEN[period];
}

export function defaultCaption(stage: JourneyStageId, char: string): string {
    switch (stage) {
        case "oracle":
            return "Scratched into bone and shell for divination.";
        case "bronze":
            return "Cast into ritual bronze vessels.";
        case "seal":
            return "Standardised as small seal script.";
        default:
            return `The ${char} you write today, stroke by stroke.`;
    }
}

/**
 * "Oracle bone form: Wikimedia Commons, public domain", or for a glyph taken
 * directly from 小學堂 "Oracle bone form: Academia Sinica 小學堂, CC0".
 */
export function creditText(
    stage: AncientStage,
    license: AccLicense,
    sinica: boolean,
    provider: "commons" | "xiaoxue" = "commons",
): string {
    const from =
        provider === "xiaoxue"
            ? "Academia Sinica 小學堂"
            : sinica
              ? "Wikimedia Commons, traced from Academia Sinica"
              : "Wikimedia Commons";
    return `${STAGE_META[stage].name}: ${from}, ${license === "CC0" ? "CC0" : "public domain"}`;
}

export const TODAY_CREDIT: JourneyCredit = {
    text: "Strokes: KanjiVG, CC BY-SA 3.0",
    href: "https://kanjivg.tagaini.net/",
};

export interface JourneyTab {
    id: JourneyStageId;
    jp: string;
    en: string;
    when: string;
    caption: string;
    credit: JourneyCredit;
    src?: string;
}

/**
 * The tabs to show: each ancient stage with data, once, in historical order,
 * then today. With no ancient stages there is only today.
 */
export function journeyTabs(
    char: string,
    stages: AncientJourneyStage[],
    captions: Partial<Record<JourneyStageId, string>> = {},
): JourneyTab[] {
    const tabs: JourneyTab[] = [];
    for (const id of ANCIENT_STAGES) {
        const s = stages.find((x) => x.stage === id && x.src);
        if (!s) continue;
        const meta = STAGE_META[id];
        tabs.push({
            id,
            jp: meta.jp,
            en: meta.en,
            when: s.when ?? meta.when,
            caption: captions[id] ?? defaultCaption(id, char),
            credit: s.credit,
            src: s.src,
        });
    }
    tabs.push({
        id: "today",
        jp: STAGE_META.today.jp,
        en: STAGE_META.today.en,
        when: STAGE_META.today.when,
        caption: captions.today ?? defaultCaption("today", char),
        credit: TODAY_CREDIT,
    });
    return tabs;
}
