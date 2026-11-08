import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createAtlas, decodeParam } from "./core.ts";

const readJson = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
const atlas = createAtlas(readJson("./kanji-atlas.json"), readJson("../compiled-stories.json"));

test("getAllKanji covers kanji-db plus every jōyō kanji, ordered by JLPT then frequency", () => {
    const all = atlas.getAllKanji();
    const chars = new Set(all.map((k) => k.char));
    assert.ok(readJson("../kanji-db.json").every((k) => chars.has(k.char)));
    const joyo = Object.entries(readJson("../core/unihan.json").chars).filter(([, e]) => e.joyo === 1).map(([c]) => c);
    assert.equal(joyo.length, 2136);
    assert.ok(joyo.every((c) => chars.has(c)));
    assert.equal(all.filter((k) => k.joyo).length, 2136);
    assert.equal(all.length, chars.size);
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
    assert.deepEqual(sea.meanings, ["sea", "ocean"]);
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

test("decodeParam tolerates malformed input", () => {
    assert.equal(decodeParam("%E6%B5%B7"), "海");
    assert.equal(decodeParam("%E6%"), "%E6%");
});

test("meanings follow KANJIDIC2 priority order", () => {
    assert.ok(["soil", "earth"].includes(atlas.getKanji("土").meanings[0]));
    assert.equal(atlas.getKanji("西").meanings[0], "west");
    assert.equal(atlas.getKanji("休").meanings[0], "rest");
    const db = new Map(readJson("../kanji-db.json").map((k) => [k.char, k]));
    assert.ok(db.get("土").meaning.startsWith("soil"), "classic practice gets the same order");
});

test("added jōyō kanji have meanings, readings, words and a radical", () => {
    for (const char of "鍋俺麺") {
        const k = atlas.getKanji(char);
        assert.ok(k, char);
        assert.ok(k.joyo, char);
        assert.ok(k.meanings.length > 0, char);
        assert.ok(k.onyomi.length + k.kunyomi.length > 0, char);
        assert.ok(k.examples.length >= 3, char);
        assert.ok(k.radical, char);
        assert.equal(k.jlpt, "N1");
        assert.equal(k.jlptEditorial, true);
    }
    assert.equal(atlas.getKanji("海").jlptEditorial, false);
    assert.equal(atlas.getKanji("誰").jlptEditorial, true, "0.2's editorial levels are flagged");
});

test("at least 95% of kanji have 3 or more example words", () => {
    const all = atlas.getAllKanji();
    const share = all.filter((k) => k.examples.length >= 3).length / all.length;
    assert.ok(share >= 0.95, share.toFixed(3));
});

test("wordsByReading groups examples by reading, irregular words last", () => {
    const sea = atlas.getKanji("海");
    const on = sea.wordsByReading.find((g) => g.kind === "on" && g.reading === "カイ");
    assert.ok(on.words.some((w) => w.word === "日本海"));
    const kun = sea.wordsByReading.find((g) => g.kind === "kun" && g.reading === "うみ");
    assert.ok(kun.words.some((w) => w.word === "海"));
    const special = sea.wordsByReading.at(-1);
    assert.equal(special.kind, "special");
    assert.ok(special.words.some((w) => w.word === "海老"));
    // Same objects as `examples`, every example in exactly one group.
    const grouped = sea.wordsByReading.flatMap((g) => g.words);
    assert.equal(grouped.length, sea.examples.length);
    assert.ok(grouped.every((w) => sea.examples.includes(w)));
    assert.ok(atlas.getKanji("鍋").examples.every((e) => e.source === "jmdict"));
});

test("components and the phonetic series of 海", () => {
    const sea = atlas.getKanji("海");
    assert.deepEqual(sea.components.map((c) => [c.char, c.role]), [["氵", "meaning"], ["毎", "sound"]]);
    assert.equal(sea.components[0].radicalKey, "sanzui");
    assert.deepEqual(sea.components[0].strokes, [[1, 3]]);
    const series = atlas.getPhoneticSeries("海");
    assert.equal(series.phonetic, "毎");
    const chars = series.kanji.map((k) => k.char);
    assert.ok(chars.includes("梅") && chars.includes("悔"), chars.join(""));
    assert.equal(chars[0], "毎");
    assert.equal(atlas.getSoundFamily("毎").kanji.length, chars.length);
    assert.equal(atlas.getPhoneticSeries("木"), null);
});

test("In Chinese data from Unihan", () => {
    const gaku = atlas.getKanji("学").zh;
    assert.equal(gaku.relation, "ja-simp");
    assert.equal(gaku.simplified, "学");
    assert.equal(gaku.traditional, "學");
    assert.deepEqual(gaku.pinyin, ["xué"]);
    assert.equal(atlas.getKanji("学").etymon, "學");
    assert.equal(atlas.getKanji("働").zh.relation, "kokuji");
    assert.equal(atlas.getKanji("働").zh.kokuji, true);
    assert.equal(atlas.getKanji("々").zh, null);
});

test("name kanji are flagged", () => {
    assert.equal(atlas.getKanji("彦").nameKanji, true);
    assert.equal(atlas.getKanji("彦").joyo, false);
    assert.equal(atlas.getKanji("海").nameKanji, false);
});

test("getSameOn lists other kanji with each on'yomi", () => {
    const groups = atlas.getSameOn("海");
    assert.equal(groups[0].reading, "カイ");
    assert.ok(groups[0].kanji.some((k) => k.char === "会"));
    assert.ok(groups[0].kanji.length <= 12);
    assert.ok(groups[0].total >= groups[0].kanji.length);
    assert.ok(!groups[0].kanji.some((k) => k.char === "海"));
    assert.deepEqual(atlas.getSameOn("x"), []);
});

test("getLookAlikes finds obvious pairs", () => {
    const has = (a, b) => atlas.getLookAlikes(a).some((k) => k.char === b);
    for (const [a, b] of [["未", "末"], ["土", "士"], ["待", "持"]]) {
        assert.ok(has(a, b), `${a} -> ${b}`);
        assert.ok(has(b, a), `${b} -> ${a}`);
    }
    assert.ok(atlas.getLookAlikes("日").length <= 6);
});

test("getKanjiWithComponent and getKanjiList", () => {
    const built = atlas.getKanjiWithComponent("毎", { exclude: "海" });
    assert.ok(built.some((k) => k.char === "梅"));
    assert.ok(!built.some((k) => k.char === "海"));
    assert.equal(atlas.getKanjiWithComponent("氵", { limit: 3 }).length, 3);
    assert.deepEqual(atlas.getKanjiList("海泳海x𠮟").map((k) => k.char), ["海", "泳", "𠮟"]);
});
