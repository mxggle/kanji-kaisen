import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { buildQuizOptions, meaningWords } from "./quizDistractors.ts";
import { pathEntryToKanjiData } from "../../lib/lesson-kanji.ts";

const require = createRequire(import.meta.url);
const pathData = require("../../lib/kanji-alive-categorized.json");
const kanjiDb = require("../../lib/kanji-db.json");
const categoryMap = require("../../lib/radical-category-map.json");

const dbByChar = new Map(kanjiDb.map((k) => [k.char, k]));
const charToCategory = {};
const targets = [];
for (const [radicalKey, radical] of Object.entries(pathData)) {
    for (const entry of radical.kanji) {
        charToCategory[entry.char] ??= categoryMap[radicalKey] || "Others";
        const data = dbByChar.get(entry.char) ?? pathEntryToKanjiData(entry, "N1");
        if (data) targets.push(data);
    }
}

test("meaningWords ignores filler words and simple plurals", () => {
    assert.deepEqual([...meaningWords("counter for days, Japan")], ["counter", "day", "japan"]);
    assert.deepEqual([...meaningWords("trees, boxes, glasses, glass")], ["tree", "box", "glass"]);
});

test("quiz options never include a second correct answer", () => {
    const problems = [];

    for (const target of targets) {
        const options = buildQuizOptions(target, charToCategory[target.char], kanjiDb, charToCategory);
        const answerWords = meaningWords(target.meaning);
        const distractors = options.filter((option) => option !== target.meaning);

        if (options.length !== 4 || new Set(options).size !== 4 || !options.includes(target.meaning)) {
            problems.push(`${target.char}: bad options ${JSON.stringify(options)}`);
            continue;
        }

        for (const distractor of distractors) {
            const shared = [...meaningWords(distractor)].filter((word) => answerWords.has(word));
            if (shared.length > 0) problems.push(`${target.char} "${target.meaning}" vs "${distractor}" share ${shared}`);
        }
    }

    assert.deepEqual(problems.slice(0, 10), []);
});

test("the reported synonym distractors are gone", () => {
    for (const [char, synonym] of [["大", "巨"], ["助", "救"], ["央", "中"], ["木", "材"]]) {
        const target = dbByChar.get(char);
        const options = buildQuizOptions(target, charToCategory[char], kanjiDb, charToCategory);
        assert.ok(!options.includes(dbByChar.get(synonym).meaning), `${char} offered ${synonym}`);
    }
});

test("quiz options are stable for the same kanji", () => {
    const target = dbByChar.get("木");
    const first = buildQuizOptions(target, "Nature & Elements", kanjiDb, charToCategory);
    const second = buildQuizOptions(target, "Nature & Elements", kanjiDb, charToCategory);
    assert.deepEqual(first, second);
});
