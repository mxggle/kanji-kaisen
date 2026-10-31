import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { expandStrokeRanges } from "./kanjivg-parse.ts";
import { componentOverlap, findLookAlikes, lookAlikeScore, strokeTypeSimilarity } from "./look-alikes.ts";

const layer = JSON.parse(readFileSync(new URL("./components.kanjivg.json", import.meta.url), "utf8")).kanji;
const shape = (char) => {
    const e = layer[char];
    return { char, strokeCount: e.n, types: e.t, ends: e.g, elements: e.el.map(([c, s]) => ({ char: c, strokes: expandStrokeRanges(s) })) };
};
const pool = Object.keys(layer).map(shape);

test("obvious pairs are look-alikes in both directions", () => {
    for (const [a, b] of [["未", "末"], ["土", "士"], ["待", "持"], ["人", "入"], ["右", "石"], ["問", "間"], ["晴", "情"]]) {
        assert.ok(findLookAlikes(shape(a), pool).includes(b), `${a} -> ${b}`);
        assert.ok(findLookAlikes(shape(b), pool).includes(a), `${b} -> ${a}`);
    }
});

test("a building block is not a look-alike of a kanji two strokes bigger (木/休)", () => {
    assert.equal(lookAlikeScore(shape("木"), shape("休")), 0);
});

test("stroke counts may differ by at most 2", () => {
    assert.equal(lookAlikeScore(shape("寺"), shape("待")), 0);
    for (const char of findLookAlikes(shape("待"), pool)) {
        assert.ok(Math.abs(layer[char].n - layer["待"].n) <= 2, char);
    }
});

test("at most 6 look-alikes, never the kanji itself", () => {
    for (const char of "日目木大口") {
        const list = findLookAlikes(shape(char), pool);
        assert.ok(list.length <= 6);
        assert.ok(!list.includes(char));
    }
});

test("component overlap and stroke-type similarity", () => {
    assert.ok(Math.abs(componentOverlap(shape("待"), shape("持")) - 6 / 9) < 1e-9);
    assert.equal(strokeTypeSimilarity(shape("土"), shape("士")), 1);
    assert.equal(lookAlikeScore(shape("海"), shape("海")), 0);
});

test("small kanji with matching strokes but a different layout are not look-alikes (日/五)", () => {
    assert.equal(lookAlikeScore(shape("日"), shape("五")), 0);
});
