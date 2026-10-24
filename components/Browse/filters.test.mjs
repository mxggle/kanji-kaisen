import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { applyBrowseFilters, DEFAULT_FILTERS, parseBrowseParams, toBrowseKanji, toBrowseQuery } from "./filters.ts";

const atlas = JSON.parse(readFileSync(new URL("../../lib/atlas/kanji-atlas.json", import.meta.url), "utf8"));
const items = atlas.kanji.map(toBrowseKanji);

test("no params gives the defaults and an empty query", () => {
    assert.deepEqual(parseBrowseParams({}), DEFAULT_FILTERS);
    assert.equal(toBrowseQuery(DEFAULT_FILTERS), "");
});

test("params round-trip through the query string", () => {
    const filters = parseBrowseParams({ jlpt: "n4,N5", sort: "strokes", min: "1", max: "10", theme: "nature-elements" });
    assert.deepEqual(filters.jlpt, ["N5", "N4"]);
    assert.equal(toBrowseQuery(filters), "?jlpt=N5,N4&max=10&sort=strokes&theme=nature-elements");
    assert.deepEqual(parseBrowseParams(Object.fromEntries(new URLSearchParams(toBrowseQuery(filters))) ), filters);
});

test("invalid params fall back to defaults", () => {
    const f = parseBrowseParams({ jlpt: "N9", sort: "random", min: "abc", max: "99", theme: "<script>" });
    assert.deepEqual(f, { ...DEFAULT_FILTERS, maxStrokes: 30 });
    assert.deepEqual(parseBrowseParams({ min: "12", max: "3" }).minStrokes, 3);
    assert.deepEqual(parseBrowseParams({ jlpt: "N1,N2,N3,N4,N5" }).jlpt, []);
    assert.deepEqual(parseBrowseParams({ jlpt: ["N3", "N2"] }).jlpt, ["N3"]);
});

test("JLPT filter keeps only the chosen levels", () => {
    const n5 = applyBrowseFilters(items, parseBrowseParams({ jlpt: "N5" }));
    assert.ok(n5.length > 50);
    assert.ok(n5.every((k) => k.jlpt === "N5"));
    assert.ok(n5.some((k) => k.char === "日"));
});

test("stroke range, theme and radical filters combine", () => {
    const f = parseBrowseParams({ min: "3", max: "5", theme: "nature-elements" });
    const out = applyBrowseFilters(items, f);
    assert.ok(out.length > 0);
    assert.ok(out.every((k) => k.strokeCount >= 3 && k.strokeCount <= 5 && k.theme === "nature-elements"));
    const sanzui = applyBrowseFilters(items, parseBrowseParams({ radical: "sanzui" }));
    assert.ok(sanzui.some((k) => k.char === "海"));
    assert.ok(sanzui.every((k) => k.radical === "sanzui"));
});

test("sorts by strokes and by frequency", () => {
    const byStrokes = applyBrowseFilters(items, parseBrowseParams({ sort: "strokes" }));
    for (let i = 1; i < byStrokes.length; i++) assert.ok(byStrokes[i - 1].strokeCount <= byStrokes[i].strokeCount);
    const byFreq = applyBrowseFilters(items, parseBrowseParams({ sort: "frequency" }));
    assert.equal(byFreq[0].char, "日");
    assert.equal(byFreq.at(-1).frequency, null);
});

test("default sort is N5 first", () => {
    const all = applyBrowseFilters(items, DEFAULT_FILTERS);
    assert.equal(all.length, items.length);
    assert.equal(all[0].jlpt, "N5");
    assert.equal(all.at(-1).jlpt, "N1");
});

test("slim records carry no examples and at most two meanings", () => {
    const sea = items.find((k) => k.char === "海");
    assert.deepEqual(Object.keys(sea).sort(), ["char", "frequency", "jlpt", "kunyomi", "meanings", "onyomi", "radical", "strokeCount", "theme"]);
    assert.ok(sea.meanings.length <= 2);
});

test("radical keys with underscores survive a round trip", () => {
    const filters = parseBrowseParams({ radical: "hi_fire" });
    assert.equal(filters.radical, "hi_fire");
    assert.equal(toBrowseQuery(filters), "?radical=hi_fire");
});
