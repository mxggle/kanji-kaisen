import test from "node:test";
import assert from "node:assert/strict";

import { SEAL_KANJI, paintCaption, paintedShare, sealShade } from "./ink-paint.ts";
import { themeProgress } from "./ink.ts";

const ink = (shades) => Object.fromEntries(Object.entries(shades).map(([char, shade]) => [char, { shade, updatedAt: "2026-10-31T00:00:00.000Z" }]));

test("a seal with no kanji is not met", () => {
    assert.equal(sealShade([]), 0);
});

test("a seal takes the rounded mean of its kanji", () => {
    assert.equal(sealShade([0, 0, 0, 1]), 0);
    assert.equal(sealShade([2, 2, 3]), 2);
    assert.equal(sealShade([1, 2]), 2); // 1.5 rounds up
    assert.equal(sealShade([4, 3, 4, 3]), 4); // 3.5 rounds up
    assert.equal(sealShade([4]), 4);
});

test("fewer than eight kanji average over the ones there are", () => {
    assert.equal(sealShade([4, 4, 4]), 4);
    assert.equal(sealShade([0, 4]), 2);
});

test("only the first eight (most common) kanji count", () => {
    assert.equal(SEAL_KANJI, 8);
    assert.equal(sealShade([0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4]), 0);
    assert.equal(sealShade([4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0]), 4);
});

test("all 印 seals the radical as mastered", () => {
    assert.equal(sealShade(Array(8).fill(4)), 4);
    assert.equal(sealShade(Array(20).fill(4)), 4);
});

test("painted share is Σshade / 4N over distinct kanji, like themeProgress", () => {
    const entries = ink({ 木: 4, 林: 2, 森: 0 });
    assert.equal(paintedShare(entries, "木林森"), 6 / 12);
    assert.equal(paintedShare(entries, ["木", "木", "林"]), 6 / 8);
    assert.equal(paintedShare(entries, "木林森"), themeProgress(entries, "木林森").painted);
});

test("painted share of no kanji is 0", () => {
    assert.equal(paintedShare(ink({ 木: 4 }), []), 0);
    assert.equal(paintedShare({}, "木林森"), 0);
});

test("all 印 paints the whole bar", () => {
    assert.equal(paintedShare(ink({ 木: 4, 林: 4 }), "木林"), 1);
});

test("the caption reads percent, familiar and total", () => {
    assert.equal(paintCaption({ painted: 0, known: 0, total: 619 }), "0% painted · 0 of 619 familiar");
    assert.equal(paintCaption({ painted: 0.18, known: 9, total: 112 }), "18% painted · 9 of 112 familiar");
    assert.equal(paintCaption({ painted: 0.001, known: 0, total: 2384 }), "1% painted · 0 of 2,384 familiar");
    assert.equal(paintCaption(themeProgress(ink({ 木: 4, 林: 3 }), "木林")), "88% painted · 2 of 2 familiar");
});
