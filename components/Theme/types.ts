// Props shapes the server passes to the theme islands. Kanji lists travel as
// one concatenated string (split with Array.from) to keep the payload small.

export interface ThemeMeta {
    name: string;
    slug: string;
    /** One-word name for gates ("Nature"). */
    short: string;
    /** Japanese title ("自然と元素"). */
    jp: string;
    /** Italic subtitle ("The world around us"). */
    sub: string;
    lore: string;
    /** Large faint glyph behind the art. */
    mark: string;
    /** 夜 accent colour, set as --tc. */
    color: string;
    image: string;
    radicalCount: number;
    kanjiCount: number;
}

export interface DeckRadical {
    key: string;
    char: string;
    name: string;
    /** Kanji of this radical in the theme; its slice of `order`. */
    count: number;
}

/** A theme for the home deck (featured card and gates). */
export interface DeckTheme extends ThemeMeta {
    /** Radicals in the suggested order. */
    radicals: DeckRadical[];
    /** Every kanji of the theme in the suggested order, concatenated. */
    order: string;
}

/** A radical for the theme page's seals and selection panel. */
export interface PanelRadical {
    key: string;
    char: string;
    name: string;
    meaning: string;
    /** Opening of the radical's memory story ("" when it has none). */
    story: string;
    /** Its kanji in the theme, by frequency, concatenated. */
    chars: string;
    /** Meanings of the first PANEL_CELLS kanji, for their accessible names. */
    meanings: string[];
}

/** Kanji cells shown in the selection panel (three rows of eight). */
export const PANEL_CELLS = 24;
