import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { matchRadicals, radicalLabel, shortMeaning } from "./radicals.ts";

const atlas = JSON.parse(readFileSync(new URL("../../lib/atlas/kanji-atlas.json", import.meta.url), "utf8"));
const options = atlas.radicals
    .filter((r) => r.kanjiCount > 0)
    .map((r) => ({ key: r.key, char: r.char, name: r.name, meaning: r.meaning, count: r.kanjiCount, category: r.category }));

test("labels use the first sense of the meaning", () => {
    assert.equal(shortMeaning("Water (3 drops)"), "water");
    assert.equal(shortMeaning("tree, wood"), "tree");
    assert.equal(radicalLabel({ char: "氵", meaning: "Water (3 drops)" }), "氵 water");
});

test("an empty query gives the most used radicals", () => {
    assert.deepEqual(matchRadicals(options, "", 5).map((r) => r.char), ["氵", "木", "亻", "扌", "口"]);
});

test("finds radicals by character, romaji name and meaning", () => {
    assert.equal(matchRadicals(options, "木", 3)[0].key, "ki");
    assert.equal(matchRadicals(options, "ki", 3)[0].key, "ki");
    assert.equal(matchRadicals(options, "Sanzui", 3)[0].key, "sanzui");
    assert.equal(matchRadicals(options, "tree", 3)[0].char, "木");
    assert.equal(matchRadicals(options, "zzz", 3).length, 0);
});

test("the selected radical stays first", () => {
    const shown = matchRadicals(options, "", 5, "gonben");
    assert.equal(shown.length, 5);
    assert.equal(shown[0].key, "gonben");
    assert.equal(matchRadicals(options, "tree", 5, "sanzui")[0].key, "sanzui");
});
