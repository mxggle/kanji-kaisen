// License filter for Wikimedia Commons "Ancient Chinese characters project"
// (ACC) files. Pure: takes a file page's wikitext and says whether we may use
// the file. See research_notes/中文汉字学习者市场调研/data_feasibility.md §2.
//
// {{ACClicense|char|script|period|SEARS|refs|…|fontcode=…}} expands to
// {{PD-ancient-script}}. Its 4th positional parameter names the Richard Sears
// (hanziyuan.net) image the drawing came from; when it is set, the permission
// line becomes "Courtesy, permission and copyright from Richard Sears website".
// `fontcode=` names the Academia Sinica 小學堂 glyph it was traced from, which
// adds a CC0 dedication. Rules (product decision 4 in the story-atlas plan):
//   - ACClicense without the Sears parameter → keep (PD, or CC0 with fontcode)
//   - no ACClicense, but CC0 and a Sinica glyph code → keep (CC0)
//   - the Sears parameter, any mention of Sears / his sites, a deletion or
//     missing-permission tag, or anything else → drop

import { findTemplates, isTemplate, stripComments, type WikiTemplate } from "./wikitext.ts";

export type AccLicense = "PD" | "CC0";

export type AccPeriod = "shang" | "western-zhou" | "spring-autumn" | "warring-states";

export type AccReason =
    | "acc-pd" // ACClicense, no Sears parameter, no Sinica code
    | "acc-sinica" // ACClicense, no Sears parameter, Sinica code (PD + CC0)
    | "sinica-cc0" // no ACClicense, but CC0 with a Sinica glyph code
    | "sears" // Sears parameter or a mention of Sears / hanziyuan
    | "problem" // deletion request, missing source/permission/license
    | "unclear"; // no recognised license

export interface AccVerdict {
    keep: boolean;
    reason: AccReason;
    license?: AccLicense;
    // Academia Sinica 小學堂 glyph code, e.g. "42.F47D".
    sinicaCode?: string;
    // Catalogue reference given by the uploader, e.g. "甲2940 合18901".
    ref?: string;
    period?: AccPeriod;
    // The Sears image id when that is why the file was dropped.
    searsRef?: string;
}

const PROBLEM_TEMPLATES = [
    "delete",
    "speedydelete",
    "speedy delete",
    "SD",
    "copyvio",
    "no source",
    "no source since",
    "no permission",
    "no permission since",
    "no license",
    "no license since",
    "npd",
    "nsd",
    "nld",
    "dw no source since",
    "deletion request",
    "fair use",
];

const CC0_TEMPLATES = ["cc-zero", "cc0", "CC-zero", "CC0-1.0"];

const SEARS_TEXT = /sears|hanziyuan|chineseetymology\.org/i;

// The `hanziyuan=` parameter of ACClicense only overrides the char in a
// reference link the template always prints; it is not a source statement.
const textWithoutAccHanziyuanParam = (wikitext: string) =>
    stripComments(wikitext).replace(/\|\s*hanziyuan\s*=[^|}]*/gi, "");

const SINICA_CODE = /^\d{1,3}\.[0-9A-F]{2,6}$/i;

export function normalizePeriod(value: string | undefined): AccPeriod | undefined {
    const v = (value ?? "").trim().toLowerCase();
    if (/^sha/.test(v)) return "shang";
    if (/^wes/.test(v)) return "western-zhou";
    if (/^spr/.test(v)) return "spring-autumn";
    if (/^war/.test(v)) return "warring-states";
    return undefined;
}

const isProblem = (t: WikiTemplate) => PROBLEM_TEMPLATES.some((name) => isTemplate(t, name));

/** Decides whether a Commons ACC file may be used, from its page wikitext. */
export function classifyAccWikitext(wikitext: string): AccVerdict {
    const templates = findTemplates(wikitext, { nested: true });

    if (templates.some(isProblem)) return { keep: false, reason: "problem" };

    const acc = templates.filter((t) => isTemplate(t, "ACClicense"));
    const sears = acc.map((t) => t.params["4"] ?? "").find((v) => v !== "");
    if (sears !== undefined) return { keep: false, reason: "sears", searsRef: sears };
    if (SEARS_TEXT.test(textWithoutAccHanziyuanParam(wikitext))) return { keep: false, reason: "sears" };

    if (acc.length > 0) {
        const first = acc[0];
        const codes = [...new Set(acc.map((t) => t.params.fontcode ?? "").filter((v) => v !== ""))];
        if (codes.length > 1 || (codes.length === 1 && !SINICA_CODE.test(codes[0]))) {
            return { keep: false, reason: "unclear" };
        }
        const verdict: AccVerdict = {
            keep: true,
            reason: codes.length ? "acc-sinica" : "acc-pd",
            license: codes.length ? "CC0" : "PD",
        };
        if (codes.length) verdict.sinicaCode = codes[0].toUpperCase();
        const ref = first.params["5"];
        if (ref) verdict.ref = ref;
        const period = normalizePeriod(first.params["3"]);
        if (period) verdict.period = period;
        return verdict;
    }

    // Not an ACC page: accept only an explicit CC0 dedication for a glyph
    // traced from Academia Sinica, identified by its glyph code.
    const cc0 = templates.some((t) => CC0_TEMPLATES.some((name) => isTemplate(t, name)));
    const code = /xiaoxue\.iis\.sinica\.edu\.tw\/[^\s\]|]*fontcode=(\d{1,3}\.[0-9A-F]{2,6})/i.exec(wikitext);
    if (cc0 && code) return { keep: true, reason: "sinica-cc0", license: "CC0", sinicaCode: code[1].toUpperCase() };

    return { keep: false, reason: "unclear" };
}
