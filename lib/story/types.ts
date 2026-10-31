// Shapes of the sourced story data: lib/core/ancient-forms.json (Wikimedia
// Commons, PD/CC0) and lib/core/etymology.wiktionary.json (CC BY-SA 4.0).

import type { AccLicense, AccPeriod } from "./acc-license.ts";
import type { AncientStage } from "./journey.ts";
import type { EtymologyComponent, Formation, GlyphOrigin } from "./wiktionary.ts";

export type { AccLicense, AccPeriod, AncientStage, EtymologyComponent, Formation };

export type RecordedStage = AncientStage | "bigseal" | "slip" | "silk";

export interface AncientFormFile {
    stage: RecordedStage;
    // The code point the file depicts (the etymon): 學 for 学.
    char: string;
    // Commons file page.
    url: string;
    // Uploaders of the file's versions, oldest first.
    author: string;
    license: AccLicense;
    // "Academia Sinica 小學堂 31.F2AE" when traced from Sinica.
    source?: string;
    // Catalogue reference given on Commons, e.g. "甲2940 合18901".
    ref?: string;
    period?: AccPeriod;
    // Redirect the file was reached through, e.g. "冫-oracle.svg".
    via?: string;
    revid: number;
    sha1: string;
    // Date (YYYY-MM-DD) the current revision was fetched.
    fetched: string;
    // Self-hosted sanitised copy, for shown stages only: "/ancient/05b78-bronze.svg".
    src?: string;
}

export interface AncientFormsEntry {
    etymon: string;
    // File names (keys of `files`) per shown stage.
    oracle?: string;
    bronze?: string;
    seal?: string;
    // Big seal, slip and silk files that pass the filter (recorded only).
    other?: string[];
    // Reserved for commissioned art; never filled from Commons.
    picture?: { src: string; credit: string };
}

export interface AncientFormsManifest {
    about: Record<string, string>;
    files: Record<string, AncientFormFile>;
    // Keyed by display char (jōyō form).
    chars: Record<string, AncientFormsEntry>;
    // Keyed by radical key where the radical's forms differ from its display
    // char's (月 nikuzuki -> 肉).
    radicals: Record<string, AncientFormsEntry>;
}

export interface EtymologyEntry extends GlyphOrigin {
    // Wiktionary page the origin comes from (學 for 学, 水 for 氵).
    page: string;
    url: string;
    revid: number;
}

export interface EtymologyData {
    about: Record<string, string>;
    entries: Record<string, EtymologyEntry>;
    radicals: Record<string, EtymologyEntry>;
}
