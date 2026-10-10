import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { pathEntryToKanjiData } from "./lesson-kanji.ts";

const require = createRequire(import.meta.url);
const pathData = require("./kanji-alive-categorized.json");
const kanjiDb = require("./kanji-db.json");

test("every learning path kanji has lesson data", () => {
    const dbChars = new Set(kanjiDb.map((k) => k.char));
    const missing = [];

    for (const radical of Object.values(pathData)) {
        for (const entry of radical.kanji) {
            if (dbChars.has(entry.char)) continue;
            const fallback = pathEntryToKanjiData(entry, "N1");
            if (!fallback || fallback.strokeCount <= 0) missing.push(entry.char);
        }
    }

    assert.deepEqual(missing, []);
});

test("pathEntryToKanjiData splits readings and drops placeholders", () => {
    const data = pathEntryToKanjiData(
        { char: "分", stroke: 4, meaning: " divide, part ", grade: 2, onyomi: "ブン、フン", kunyomi: "n/a" },
        "N4"
    );

    assert.deepEqual(data, {
        char: "分",
        meaning: "divide, part",
        onyomi: ["ブン", "フン"],
        kunyomi: [],
        jlpt: "N4",
        strokeCount: 4,
        frequency: 9999,
        grade: 2,
    });
});

test("pathEntryToKanjiData returns null without a meaning", () => {
    const data = pathEntryToKanjiData(
        { char: "可", stroke: 5, meaning: "", grade: 5, onyomi: "カ", kunyomi: "" },
        "N2"
    );

    assert.equal(data, null);
});
