// Slim lists the server passes to the teacher pages (client-safe types).

import type { JlptLevel } from "@/lib/atlas/types";

export interface TeachTheme {
    slug: string;
    name: string;
    short: string;
    jp: string;
    /** The theme's 夜 accent (--tc). */
    color: string;
    /** Kanji concatenated, in atlas order (JLPT, then frequency). */
    chars: string;
}

export interface TeachRadical {
    key: string;
    char: string;
    name: string;
    meaning: string;
    /** Index into CATEGORIES, or -1. */
    theme: number;
    chars: string;
}

export interface TeachLevel {
    level: JlptLevel;
    chars: string;
}

export interface TeachLists {
    themes: TeachTheme[];
    radicals: TeachRadical[];
    jlpt: TeachLevel[];
}
