// Props shapes the server passes to the theme islands. Kanji lists travel as
// one concatenated string (split with Array.from) to keep the payload small.

export interface ThemeMeta {
    name: string;
    slug: string;
    /** One-word name for gates ("Nature"). */
    short: string;
    /** Japanese title ("自然と元素"). */
    jp: string;
    /**
     * Italic subtitle ("The world around us").
     * @deprecated One Atlas: the theme page has no subtitle (only memory stories are italic).
     */
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

/**
 * A radical for the theme page's seals and selection panel.
 * @deprecated One Atlas: ThemeRadical (themeRadicals in data.ts).
 */
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

/**
 * Kanji cells shown in the selection panel (three rows of eight).
 * @deprecated One Atlas: PREVIEW_TILES.
 */
export const PANEL_CELLS = 24;

/** A kanji tile in the theme page's radical preview: first meaning and first readings only. */
export interface PreviewKanji {
    char: string;
    meanings: string[];
    onyomi: string[];
    kunyomi: string[];
}

/** A radical of a theme, for the theme page's seals and radical preview. */
export interface ThemeRadical {
    key: string;
    char: string;
    /** Romanised name ("Sanzui"). */
    name: string;
    /** First plain gloss of its meaning ("water"). */
    gloss: string;
    /** Its kanji in the theme, most common first, concatenated. */
    chars: string;
    /** The first PREVIEW_TILES of them, for tiles. */
    tiles: PreviewKanji[];
}

/** Kanji tiles shown in the theme page's radical preview. */
export const PREVIEW_TILES = 10;
