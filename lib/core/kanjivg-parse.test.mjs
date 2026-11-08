import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    allElements,
    expandStrokeRanges,
    formatStrokeRanges,
    parseKanjiVG,
    parseStrokeRanges,
    phoneticOf,
    pathEnds,
    phonKey,
    topLevelParts,
} from "./kanjivg-parse.ts";

const svg = (char) =>
    readFileSync(
        new URL(`../../public/kanjivg/kanji/${char.codePointAt(0).toString(16).padStart(5, "0")}.svg`, import.meta.url),
        "utf8",
    );

test("parseKanjiVG reads strokes, types and the group tree of 海", () => {
    const kanji = parseKanjiVG(svg("海"));
    assert.equal(kanji.strokeCount, 9);
    assert.equal([...kanji.types].length, 9);
    assert.equal(kanji.root.element, "海");
    assert.deepEqual(kanji.root.strokes, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("海 splits into 氵 (radical) and 毎 (phonetic)", () => {
    const parts = topLevelParts(parseKanjiVG(svg("海")));
    assert.deepEqual(parts.map((p) => p.char), ["氵", "毎"]);
    assert.equal(parts[0].radical, "general");
    assert.equal(parts[0].original, "水");
    assert.deepEqual(parts[0].strokes, [1, 2, 3]);
    assert.equal(parts[1].phon, "毎");
    assert.deepEqual(parts[1].strokes, [4, 5, 6, 7, 8, 9]);
    assert.equal(phoneticOf(parseKanjiVG(svg("海"))), "毎");
});

test("the DTD's kvg:phon declaration is not a phonetic mark", () => {
    const tree = parseKanjiVG(svg("木"));
    assert.ok(svg("木").includes("kvg:phon"), "DTD declares the attribute");
    assert.equal(phoneticOf(tree), null);
    assert.deepEqual(topLevelParts(tree), []);
});

test("a phonetic group without an element keeps its phonetic as the part (学)", () => {
    const parts = topLevelParts(parseKanjiVG(svg("学")));
    assert.equal(parts[0].phon, "𦥯");
    assert.equal(parts[1].char, "子");
});

test("split parts are merged (衛: 行 around 韋)", () => {
    const parts = topLevelParts(parseKanjiVG(svg("衛")));
    const gyou = parts.filter((p) => p.char === "行");
    assert.equal(gyou.length, 1);
    assert.ok(gyou[0].strokes.length >= 6);
    assert.equal(formatStrokeRanges(gyou[0].strokes).includes(","), true);
});

test("allElements lists nested elements", () => {
    const chars = allElements(parseKanjiVG(svg("待"))).map((e) => e.char);
    assert.deepEqual(chars, ["彳", "亻", "寺", "土", "寸"]);
});

test("phonKey normalises KanjiVG phon values", () => {
    assert.equal(phonKey("毎"), "毎");
    assert.equal(phonKey("叚V/反", "反"), "叚");
    assert.equal(phonKey("攸1", "攸"), "攸");
    assert.equal(phonKey("庶1T", "广"), "庶");
    assert.equal(phonKey("⽛V"), "牙");
    assert.equal(phonKey("立口/否V", "咅"), "咅");
    assert.equal(phonKey("厂+万"), null);
    assert.equal(phonKey("3+6+1"), null);
});

test("stroke ranges round-trip", () => {
    assert.equal(formatStrokeRanges([1, 2, 3, 7, 8, 10]), "1-3,7-8,10");
    assert.deepEqual(parseStrokeRanges("1-3,7-8,10"), [[1, 3], [7, 8], [10, 10]]);
    assert.deepEqual(expandStrokeRanges("1-3,10"), [1, 2, 3, 10]);
    assert.deepEqual(parseStrokeRanges(""), []);
});

test("pathEnds follows relative and absolute curve commands", () => {
    assert.deepEqual(pathEnds("M20.38,14.75c3.31,1.47,8.54,6.05,9.37,8.34"), [20.38, 14.75, 29.75, 23.09]);
    const [x0, y0, x1, y1] = pathEnds("M13.75,89.21C16,90,17.06,89.57,18,87.95c2.75-4.7,5.5-10.45,8-16.45");
    assert.deepEqual([x0, y0, x1, Math.round(y1 * 100) / 100], [13.75, 89.21, 26, 71.5]);
    assert.equal(pathEnds(""), null);
    const kanji = parseKanjiVG(svg("一"));
    assert.equal(kanji.ends.length, 1);
    assert.ok(kanji.ends[0][2] > kanji.ends[0][0], "一 is drawn left to right");
});
