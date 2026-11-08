// Builds the slim lists for /teach and /teach/present from the atlas (server only).

import "server-only";

import { getAllRadicals, getCategories, getKanjiByCategory, getKanjiByJlpt, getKanjiByRadical, JLPT_LEVELS } from "@/lib/atlas";
import { CATEGORIES, getThemeColor, isCategoryName, THEME_JP, THEME_SHORT } from "@/lib/atlas/categories";
import type { TeachLists, TeachRadical, TeachTheme } from "./types";

const join = (list: { char: string }[]) => list.map((k) => k.char).join("");

/** Radicals that have kanji, in index order (theme, then size). */
export function getTeachRadicals(): TeachRadical[] {
    return getAllRadicals()
        .filter((r) => r.kanjiCount > 0)
        .map((r) => ({
            key: r.key,
            char: r.char,
            name: r.name,
            meaning: r.meaning,
            theme: CATEGORIES.findIndex((c) => c === r.category),
            chars: join(getKanjiByRadical(r.key)),
        }))
        .filter((r) => r.chars.length > 0);
}

export function getTeachLists(): TeachLists {
    const themes: TeachTheme[] = getCategories().map((c) => ({
        slug: c.slug,
        name: c.name,
        short: isCategoryName(c.name) ? THEME_SHORT[c.name] : c.name,
        jp: isCategoryName(c.name) ? THEME_JP[c.name] : "",
        color: getThemeColor(c.name),
        chars: join(getKanjiByCategory(c.name)),
    }));
    return {
        themes,
        radicals: getTeachRadicals(),
        jlpt: JLPT_LEVELS.map((level) => ({ level, chars: join(getKanjiByJlpt(level)) })),
    };
}
