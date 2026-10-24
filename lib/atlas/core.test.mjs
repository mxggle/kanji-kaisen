import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createAtlas, decodeParam } from "./core.ts";

const readJson = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
const atlas = createAtlas(readJson("./kanji-atlas.json"), readJson("../compiled-stories.json"));

test("getAllKanji covers kanji-db and is ordered by JLPT then frequency", () => {
    const all = atlas.getAllKanji();
    assert.equal(all.length, readJson("../kanji-db.json").length);
    assert.equal(all[0].jlpt, "N5");
    assert.equal(all.at(-1).jlpt, "N1");
    const n5 = atlas.getKanjiByJlpt("N5");
    for (let i = 1; i < n5.length; i++) {
        assert.ok((n5[i - 1].frequency ?? Infinity) <= (n5[i].frequency ?? Infinity));
    }
});

test("getKanji resolves raw and percent-encoded characters", () => {
    const sea = atlas.getKanji("海");
    assert.equal(sea.char, "海");
    assert.deepEqual(sea.meanings, ["ocean", "sea"]);
    assert.equal(sea.radical.key, "sanzui");
    assert.equal(sea.category, "Nature & Elements");
    assert.ok(sea.examples.some((e) => e.word === "海老" && e.special === true));
    assert.equal(atlas.getKanji(encodeURIComponent("海")), sea);
    assert.equal(atlas.getKanji("x"), null);
});

test("previously missing checkpoint kanji are in the atlas", () => {
    for (const char of "誰的分孝可身々頃無里畑坊") {
        assert.ok(atlas.getKanji(char), char);
    }
    assert.equal(atlas.getKanji("分").jlpt, "N5");
});

test("getNeighbors stays within the JLPT level", () => {
    const n5 = atlas.getKanjiByJlpt("N5");
    assert.deepEqual(atlas.getNeighbors(n5[0].char), { prev: null, next: n5[1] });
    const { prev, next } = atlas.getNeighbors(n5[1].char);
    assert.equal(prev, n5[0]);
    assert.equal(next, n5[2]);
    assert.equal(atlas.getNeighbors(n5.at(-1).char).next, null);
});

test("getRadical merges the story with its kanji", () => {
    const sanzui = atlas.getRadical("sanzui");
    assert.equal(sanzui.char, "氵");
    assert.ok(sanzui.story.length > 0);
    assert.ok(sanzui.kanji.some((k) => k.char === "海"));
    assert.equal(sanzui.kanjiCount, sanzui.kanji.length);
    assert.ok(atlas.getKanjiByRadical("sanzui").every((k) => k.radical.key === "sanzui"));
    assert.equal(atlas.getRadical("nope"), null);
});

test("story-only *hen radicals borrow their base radical's kanji", () => {
    const kihen = atlas.getRadical("kihen");
    assert.equal(kihen.kanjiCount, 0);
    assert.equal(kihen.variantOf.key, "ki");
    assert.ok(kihen.kanji.length > 0);
});

test("getRadicalNeighbors walks the radical index", () => {
    const radicals = atlas.getAllRadicals();
    assert.equal(atlas.getRadicalNeighbors(radicals[0].key).prev, null);
    assert.equal(atlas.getRadicalNeighbors(radicals[0].key).next, radicals[1]);
});

test("categories have stories, radicals and kanji", () => {
    const categories = atlas.getCategories();
    assert.equal(categories.length, 10);
    const textiles = atlas.getCategory("textiles-plants-food");
    assert.equal(textiles.name, "Textiles, Plants & Food");
    assert.ok(textiles.story, "Textiles story compiled");
    for (const c of categories) {
        const category = atlas.getCategory(c.slug);
        assert.ok(category.story, c.name);
        assert.ok(category.radicals.length > 0, c.name);
        assert.equal(category.kanji.length, c.kanjiCount);
        assert.ok(category.kanji.every((k) => k.category === c.name));
    }
    assert.equal(atlas.getCategory("nope"), null);
});

test("getKanjiOfTheDay is deterministic and drawn from N5-N3", () => {
    const day = new Date("2026-10-24T12:00:00Z");
    assert.equal(atlas.getKanjiOfTheDay(day), atlas.getKanjiOfTheDay(new Date("2026-10-24T01:00:00Z")));
    assert.notEqual(atlas.getKanjiOfTheDay(day), atlas.getKanjiOfTheDay(new Date("2026-10-25T12:00:00Z")));
    assert.ok(["N5", "N4", "N3"].includes(atlas.getKanjiOfTheDay(day).jlpt));
});

test("decodeParam tolerates malformed input", () => {
    assert.equal(decodeParam("%E6%B5%B7"), "海");
    assert.equal(decodeParam("%E6%"), "%E6%");
});
