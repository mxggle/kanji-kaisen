// Server-side view models for the home deck, the theme page and /categories.

import "server-only";

import { getCategories, getCategory, getRadical } from "@/lib/atlas";
import type { AtlasCategorySummary, AtlasKanji, AtlasRadicalSummary } from "@/lib/atlas/types";
import {
    getThemeColor,
    isCategoryName,
    THEME_JP,
    THEME_LORE,
    THEME_MARK,
    THEME_SHORT,
} from "@/lib/atlas/categories";
import { storyExcerpt, suggestedOrder, type RadicalGroup } from "./order";
import { radicalGloss } from "./view";
import { PANEL_CELLS, PREVIEW_TILES, type DeckTheme, type PanelRadical, type ThemeMeta, type ThemeRadical } from "./types";

export function themeMeta(summary: AtlasCategorySummary): ThemeMeta {
    const known = isCategoryName(summary.name) ? summary.name : null;
    return {
        name: summary.name,
        slug: summary.slug,
        short: known ? THEME_SHORT[known] : summary.name,
        jp: known ? THEME_JP[known] : "",
        lore: known ? THEME_LORE[known] : summary.title,
        mark: known ? THEME_MARK[known] : "",
        color: getThemeColor(summary.name),
        image: summary.image,
        radicalCount: summary.radicalCount,
        kanjiCount: summary.kanjiCount,
    };
}

export type ThemeGroup = RadicalGroup<AtlasRadicalSummary, AtlasKanji>;

export interface ThemeOrder {
    meta: ThemeMeta;
    /** Radicals with kanji, in the suggested order. */
    groups: ThemeGroup[];
    /** Story-only side forms (e.g. 木 kihen) by the key of the radical whose kanji they share. */
    sideForms: Map<string, AtlasRadicalSummary[]>;
    /** Side forms whose base radical isn't in this theme. */
    otherSideForms: AtlasRadicalSummary[];
}

/** A theme's radicals and kanji in the suggested order. Null for an unknown slug. */
export function getThemeOrder(slug: string): ThemeOrder | null {
    const category = getCategory(slug);
    if (!category) return null;
    const groups = suggestedOrder(category.radicals, category.kanji);
    const withKanji = new Map(groups.map((g) => [g.radical.char, g.radical.key]));
    const sideForms = new Map<string, AtlasRadicalSummary[]>();
    const otherSideForms: AtlasRadicalSummary[] = [];
    for (const r of category.radicals) {
        if (r.kanjiCount > 0) continue;
        const base = withKanji.get(r.char);
        if (base) sideForms.set(base, [...(sideForms.get(base) ?? []), r]);
        else otherSideForms.push(r);
    }
    return { meta: themeMeta(category), groups, sideForms, otherSideForms };
}

const joinChars = (kanji: AtlasKanji[]) => kanji.map((k) => k.char).join("");

/** All ten themes for the home deck. */
export function getDeckThemes(): DeckTheme[] {
    return getCategories().flatMap((summary) => {
        const order = getThemeOrder(summary.slug);
        if (!order) return [];
        return [{
            ...order.meta,
            radicals: order.groups.map((g) => ({
                key: g.radical.key,
                char: g.radical.char,
                name: g.radical.name,
                count: g.kanji.length,
            })),
            order: order.groups.map((g) => joinChars(g.kanji)).join(""),
        }];
    });
}

/** Seal and preview data for each radical of a theme, in the suggested order. */
export function themeRadicals(groups: ThemeGroup[]): ThemeRadical[] {
    return groups.map(({ radical, kanji }) => ({
        key: radical.key,
        char: radical.char,
        name: radical.name,
        gloss: radicalGloss(radical.meaning) || radical.name,
        chars: joinChars(kanji),
        tiles: kanji.slice(0, PREVIEW_TILES).map((k) => ({
            char: k.char,
            meanings: k.meanings.slice(0, 1),
            onyomi: k.onyomi.slice(0, 1),
            kunyomi: k.kunyomi.slice(0, 1),
        })),
    }));
}

/**
 * Seal and panel data for each radical of a theme, in the suggested order.
 * @deprecated One Atlas: themeRadicals.
 */
export function panelRadicals(groups: ThemeGroup[]): PanelRadical[] {
    return groups.map(({ radical, kanji }) => ({
        key: radical.key,
        char: radical.char,
        name: radical.name,
        meaning: radical.meaning,
        story: storyExcerpt(getRadical(radical.key)?.story ?? ""),
        chars: joinChars(kanji),
        meanings: kanji.slice(0, PANEL_CELLS).map((k) => k.meanings[0] ?? ""),
    }));
}

/** Each theme's kanji, concatenated, for progress bars. */
export function themeChars(): Record<string, string> {
    return Object.fromEntries(
        getCategories().map((summary) => [summary.slug, joinChars(getCategory(summary.slug)?.kanji ?? [])]),
    );
}
