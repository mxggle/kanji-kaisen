// Server-only entry point for the full atlas dataset (examples included).
// Client components get data via props, or use the slim
// public/data/search-index.json, loaded lazily.

import "server-only";

import atlasData from "./kanji-atlas.json";
import storiesData from "../compiled-stories.json";
import { createAtlas } from "./core";
import type { AtlasData, StoriesData } from "./types";

const atlas = createAtlas(atlasData as unknown as AtlasData, storiesData as unknown as StoriesData);

export const {
    getAllKanji,
    getKanji,
    getKanjiByJlpt,
    getKanjiByRadical,
    getKanjiByCategory,
    getNeighbors,
    getAllRadicals,
    getRadicalSummary,
    getRadical,
    getRadicalNeighbors,
    getCategories,
    getCategory,
    getKanjiOfTheDay,
} = atlas;

export { JLPT_LEVELS, decodeParam } from "./core";
export * from "./types";
