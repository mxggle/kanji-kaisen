import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { kanjivgUrl, parseKanjiVg, radicalStrokes } from "./strokes.ts";

const svg = (char) => readFileSync(new URL(`../../public${kanjivgUrl(char)}`, import.meta.url), "utf8");

test("builds same-origin KanjiVG URLs", () => {
    assert.equal(kanjivgUrl("海"), "/kanjivg/kanji/06d77.svg");
    assert.equal(kanjivgUrl("𠮟"), "/kanjivg/kanji/20b9f.svg");
});

test("parses 海 into nine ordered strokes with 氵 as the radical", () => {
    const sea = parseKanjiVg(svg("海"));
    assert.equal(sea.strokes.length, 9);
    assert.ok(sea.strokes[0].startsWith("M20.38,14.75"));
    assert.ok(sea.strokes[8].startsWith("M30.63,58.98"));
    assert.deepEqual(sea.radicals, [{ element: "氵", original: "水", kind: "general", strokes: [0, 1, 2] }]);
    assert.deepEqual(radicalStrokes(sea, "氵"), [0, 1, 2]);
    assert.deepEqual(radicalStrokes(sea, "水"), [0, 1, 2], "matches the original form");
    assert.deepEqual(radicalStrokes(sea), [0, 1, 2]);
});

test("merges split radicals and prefers the atlas radical", () => {
    const country = parseKanjiVg(svg("国"));
    const enclosure = country.radicals.find((r) => r.element === "囗");
    assert.equal(country.strokes.length, 8);
    assert.deepEqual(enclosure.strokes, [0, 1, 7], "囗 is written in two parts around the inside");

    const ask = parseKanjiVg(svg("問"));
    assert.deepEqual(ask.radicals.map((r) => `${r.element}:${r.kind}`), ["門:nelson", "口:tradit"]);
    assert.deepEqual(radicalStrokes(ask, "口"), [8, 9, 10]);
    assert.deepEqual(radicalStrokes(ask, null).length, 3, "falls back to the traditional radical");
    assert.deepEqual(radicalStrokes(ask, "門"), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("rejects files without stroke paths", () => {
    assert.equal(parseKanjiVg("<svg></svg>"), null);
    assert.deepEqual(radicalStrokes(null, "氵"), []);
});
