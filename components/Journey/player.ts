// Pure helpers for JourneyPlayer (components/Story/JourneyPlayer.tsx): stage
// names, the lede over the plate, era lines and the credit line. Client-safe
// and loadable by the Node test runner; tests in player.test.mjs.

import type { AncientStage, JourneyStageId, JourneyTab } from "../../lib/story/journey.ts";

/** Stage names: `full` on wider screens and in credits, `short` under phone thumbnails. */
export const STAGE_LABELS: Record<JourneyStageId, { full: string; short: string }> = {
    oracle: { full: "Oracle bone", short: "Oracle" },
    bronze: { full: "Bronze", short: "Bronze" },
    seal: { full: "Small seal", short: "Seal" },
    today: { full: "Today", short: "Today" },
};

/** The date line of the today stage. */
export const TODAY_WHEN = "standard form";

/** Where today's form comes from, for the stage caption. */
export const TODAY_REF = "KanjiVG";

const NUMBER_WORDS = ["no", "one", "two", "three", "four"];

// Rounded age of the oldest stage: oracle bone and bronze ~1200–1000 BCE, small seal 221 BCE.
const AGE: Record<AncientStage, string> = {
    oracle: "3,000 years",
    bronze: "3,000 years",
    seal: "2,200 years",
};

/**
 * The line over the journey: "3,000 years in four forms", "2,200 years in
 * two forms", or "As written today" when only today's form is there.
 */
export function journeyLede(ids: readonly JourneyStageId[]): string {
    const oldest = ids.find((id): id is AncientStage => id !== "today");
    if (!oldest) return "As written today";
    const count = NUMBER_WORDS[ids.length] ?? String(ids.length);
    return `${AGE[oldest]} in ${count} forms`;
}

/** The era alone, for small captions: "Shang · c. 1200 BCE" -> "Shang". */
export function stageEra(when: string): string {
    return when.split(" · ")[0]?.trim() ?? "";
}

/** "", ", " or " and " before item `i` of `n` in an English list. */
export function listSeparator(i: number, n: number): string {
    if (i === 0) return "";
    return i === n - 1 ? " and " : ", ";
}

export interface CreditStage {
    id: JourneyStageId;
    /** "Oracle bone" first in its group, then lower case ("bronze", "small seal"). */
    label: string;
    href?: string;
}

export interface CreditGroup {
    /** "Academia Sinica 小學堂, CC0". */
    source: string;
    stages: CreditStage[];
}

const CREDIT_LABEL: Record<JourneyStageId, string> = {
    oracle: "Oracle bone",
    bronze: "Bronze",
    seal: "Small seal",
    today: "Today’s form",
};

/** The source part of a stage credit: "Oracle bone form: Wikimedia Commons, public domain" -> "Wikimedia Commons, public domain". */
export function creditSource(text: string): string {
    const at = text.indexOf(": ");
    return at === -1 ? text : text.slice(at + 2);
}

/**
 * The stages grouped by where their file comes from, in stage order, so the
 * credit reads "Oracle bone, bronze and small seal: Academia Sinica 小學堂,
 * CC0. Today’s form: KanjiVG, CC BY-SA 3.0." Each stage keeps its own link.
 */
export function creditGroups(tabs: readonly Pick<JourneyTab, "id" | "credit">[]): CreditGroup[] {
    const groups: CreditGroup[] = [];
    for (const tab of tabs) {
        const source = creditSource(tab.credit.text);
        let group = groups.find((g) => g.source === source);
        if (!group) {
            group = { source, stages: [] };
            groups.push(group);
        }
        const label = CREDIT_LABEL[tab.id];
        group.stages.push({
            id: tab.id,
            label: group.stages.length === 0 ? label : label.toLowerCase(),
            href: tab.credit.href,
        });
    }
    return groups;
}
