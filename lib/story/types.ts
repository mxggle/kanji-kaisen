// Shapes of the sourced story data: lib/core/ancient-forms.json (Wikimedia
// Commons, PD/CC0, and Academia Sinica 小學堂, CC0) and
// lib/core/etymology.wiktionary.json (CC BY-SA 4.0).

import type { AccLicense, AccPeriod } from "./acc-license.ts";
import type { AncientStage } from "./journey.ts";
import type { EtymologyComponent, Formation, GlyphOrigin } from "./wiktionary.ts";

export type { AccLicense, AccPeriod, AncientStage, EtymologyComponent, Formation };

export type RecordedStage = AncientStage | "bigseal" | "slip" | "silk";

// Where a file comes from: a Wikimedia Commons file page, or a glyph image
// taken directly from Academia Sinica 小學堂's query interface.
export type AncientProvider = "commons" | "xiaoxue";

export interface AncientFormFile {
    stage: RecordedStage;
    // The code point the file depicts (the etymon): 學 for 学.
    char: string;
    // Commons file page, or the 小學堂 字形演變 page for the char.
    url: string;
    // 小學堂 only: the glyph image URL as requested from the site.
    imageUrl?: string;
    // Commons: uploaders of the file's versions, oldest first.
    // 小學堂: "Academia Sinica 小學堂".
    author: string;
    license: AccLicense;
    // "Academia Sinica 小學堂 31.F2AE": the Sinica glyph code (Commons files
    // traced from Sinica, and every 小學堂 file).
    source?: string;
    // Catalogue reference, e.g. "甲2940 合18901" (Commons) or "甲600 (商)" (小學堂).
    ref?: string;
    period?: AccPeriod;
    // Redirect the file was reached through, e.g. "冫-oracle.svg".
    via?: string;
    provider: AncientProvider;
    // Commons revision of the file page.
    revid?: number;
    // SHA-1 of the file as served (Commons file, or 小學堂 image before processing).
    sha1: string;
    // Date (YYYY-MM-DD) the current revision or image was fetched.
    fetched: string;
    // Self-hosted copy, for shown stages only: "/ancient/05b78-bronze.svg"
    // (sanitised Commons SVG) or "/ancient/06728-oracle.png" (小學堂 glyph).
    src?: string;
}

export interface AncientFormsEntry {
    etymon: string;
    // File names (keys of `files`) per shown stage.
    oracle?: string;
    bronze?: string;
    seal?: string;
    // Commons big seal, slip and silk files that pass the filter (recorded only).
    other?: string[];
    // Reserved for commissioned art; never filled from Commons or 小學堂.
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
