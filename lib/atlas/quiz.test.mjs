import test from "node:test";
import assert from "node:assert/strict";

import { buildMeaningOptions, scoreDistractor, tokenizeMeaning } from "./quiz.ts";

const k = (char, meaning, jlpt, strokeCount, category) => ({ char, meaning, jlpt, strokeCount, category });

const sea = k("海", "ocean, sea", "N4", 9, "Nature & Elements");
const pool = [
    sea,
    k("洋", "ocean, western style", "N3", 9, "Nature & Elements"),
    k("池", "pond, cistern", "N3", 6, "Nature & Elements"),
    k("湖", "lake", "N3", 12, "Nature & Elements"),
    k("犬", "dog", "N5", 4, "Animals & Wildlife"),
    k("車", "car", "N5", 7, "Tools & Weapons"),
    k("灘", "ocean, sea", "N1", 22, "Nature & Elements"),
];

test("tokenizeMeaning lowercases and drops short tokens", () => {
    assert.deepEqual([...tokenizeMeaning("Ocean, a sea/Western-style")], ["ocean", "sea", "western", "style"]);
});

test("scoreDistractor rewards theme, level, strokes and shared words", () => {
    assert.ok(scoreDistractor(sea, pool[1]) > scoreDistractor(sea, pool[4]));
    // same theme (5) + strokes within 2 (2) + shared "ocean" (4)
    assert.equal(scoreDistractor(sea, pool[1]), 11);
});

test("buildMeaningOptions returns the answer plus unique distractors", () => {
    const options = buildMeaningOptions(sea, pool);
    assert.equal(options.length, 4);
    assert.ok(options.includes("ocean, sea"));
    assert.equal(new Set(options).size, 4);
    // A different kanji with the identical meaning is never a distractor.
    assert.equal(options.filter((o) => o === "ocean, sea").length, 1);
    assert.ok(options.includes("ocean, western style"));
});

test("buildMeaningOptions is deterministic and copes with small pools", () => {
    assert.deepEqual(buildMeaningOptions(sea, pool), buildMeaningOptions(sea, [...pool].reverse()));
    assert.deepEqual(buildMeaningOptions(sea, [sea, pool[4]]).sort(), ["dog", "ocean, sea"]);
});
