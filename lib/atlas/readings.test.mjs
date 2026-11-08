import test from "node:test";
import assert from "node:assert/strict";

import { formatReading, normalizeKana, plainReading, readingToRomaji, splitReading } from "./readings.ts";

test("formatReading wraps okurigana in parentheses", () => {
    assert.equal(formatReading("ふる.い"), "ふる(い)");
    assert.equal(formatReading("わ.かる"), "わ(かる)");
    assert.equal(formatReading("うみ"), "うみ");
});

test("formatReading keeps prefix and suffix dashes", () => {
    assert.equal(formatReading("-か"), "-か");
    assert.equal(formatReading("ふる-"), "ふる-");
    assert.equal(formatReading("-べ.き"), "-べ(き)");
});

test("splitReading separates stem, okurigana and affix markers", () => {
    assert.deepEqual(splitReading("-べ.き"), { prefix: false, suffix: true, stem: "べ", okurigana: "き" });
    assert.deepEqual(splitReading("ふる-"), { prefix: true, suffix: false, stem: "ふる", okurigana: "" });
});

test("readingToRomaji converts kana and keeps dashes", () => {
    assert.equal(readingToRomaji("カイ"), "kai");
    assert.equal(readingToRomaji("ふる.い"), "furui");
    assert.equal(readingToRomaji("-か"), "-ka");
    assert.equal(readingToRomaji("ふる-"), "furu-");
});

test("plainReading and normalizeKana strip notation and unify kana", () => {
    assert.equal(plainReading("-べ.き"), "べき");
    assert.equal(normalizeKana("カイ"), "かい");
    assert.equal(normalizeKana("ふる.い"), "ふるい");
});
