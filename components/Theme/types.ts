// Props shapes the server passes to the theme islands. Kanji lists travel as
// one concatenated string (split with Array.from) to keep the payload small.

export interface ThemeMeta {
    name: string;
    slug: string;
    /** One-word name for gates ("Nature"). */
    short: string;
    /** Japanese title ("自然と元素"). */
    jp: string;
    lore: string;
    /** Large faint glyph behind the art. */
    mark: string;
    /** 夜 accent colour, set as --tc. */
    color: string;
    image: string;
    radicalCount: number;
    kanjiCount: number;
}

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
