// URL helpers for atlas pages. Client-safe.

import type { JlptLevel } from "./types.ts";
import { getCategorySlug } from "./categories.ts";

export const kanjiPath = (char: string) => `/kanji/${encodeURIComponent(char)}`;
export const radicalPath = (key: string) => `/radical/${encodeURIComponent(key)}`;
export const categoryPath = (category: string) => `/category/${getCategorySlug(category)}`;
export const practiceCategoryPath = (category: string) => `/practice/${getCategorySlug(category)}`;
export const browsePath = (params: { jlpt?: JlptLevel } = {}) =>
    params.jlpt ? `/browse?jlpt=${params.jlpt}` : "/browse";
export const searchPath = (query: string) => `/search?q=${encodeURIComponent(query)}`;
