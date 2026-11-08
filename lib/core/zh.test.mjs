import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { classifyZh, etymonOf, isCompatibilityIdeograph, simplifiedOf, traditionalOf } from "./zh.ts";

// Small fixture in the lib/core/unihan.json shape.
const FIXTURE = {
    山: { m: ["shān"], tgh: 1, tw: 1 },
    語: { m: ["yǔ"], s: ["语"], tw: 1 },
    语: { m: ["yǔ"], tgh: 1 },
    学: { m: ["xué"], t: ["學"], jo: ["學"], tgh: 1 },
    學: { m: ["xué"], s: ["学"], tw: 1 },
    歩: { m: ["bù"], jo: ["步"] },
    步: { m: ["bù"], tgh: 1, tw: 1 },
    広: { m: ["guǎng"], jo: ["廣"] },
    廣: { m: ["guǎng"], s: ["广"], tw: 1 },
    广: { m: ["guǎng"], tgh: 1 },
    戸: { m: ["hù"], z: ["戶", "户"] },
    戶: { m: ["hù"], s: ["户"], tw: 1 },
    户: { m: ["hù"], tgh: 1 },
    浄: { m: ["jìng"], jo: ["淨"] },
    淨: { m: ["jìng"], sv: ["凈"], tw: 1 },
    凈: { s: ["净"] },
    净: { m: ["jìng"], tgh: 1 },
    働: { m: ["dòng"], s: ["𫠦"] },
    姫: { m: ["jī"] },
};
const get = (c) => FIXTURE[c];

test("relations follow the J/S/T comparison", () => {
    assert.equal(classifyZh("山", get).relation, "same");
    assert.deepEqual(classifyZh("語", get), { relation: "ja-trad", simplified: "语", traditional: "語", pinyin: ["yǔ"], kokuji: false });
    assert.deepEqual(classifyZh("学", get), { relation: "ja-simp", simplified: "学", traditional: "學", pinyin: ["xué"], kokuji: false });
    assert.equal(classifyZh("歩", get).relation, "ja-only");
    assert.deepEqual(classifyZh("広", get), { relation: "all-differ", simplified: "广", traditional: "廣", pinyin: ["guǎng"], kokuji: false });
});

test("glyph and semantic variants resolve forms Unihan leaves indirect", () => {
    assert.equal(traditionalOf("戸", get), "戶");
    assert.equal(classifyZh("戸", get).relation, "all-differ");
    assert.equal(simplifiedOf("浄", "淨", get), "净");
    assert.equal(classifyZh("浄", get).relation, "all-differ");
});

test("kokuji and unresolved characters", () => {
    assert.deepEqual(classifyZh("働", get), { relation: "kokuji", simplified: null, traditional: null, pinyin: ["dòng"], kokuji: true });
    assert.equal(classifyZh("姫", get).relation, "unknown");
    assert.equal(etymonOf("学", get), "學");
    assert.equal(etymonOf("働", get), "働");
    assert.equal(etymonOf("山", get), "山");
});

test("compatibility ideographs are not kyūjitai", () => {
    assert.equal(isCompatibilityIdeograph("海"), true);
    assert.equal(isCompatibilityIdeograph("海"), false);
});

test("the committed Unihan layer classifies the plan's examples", () => {
    const chars = JSON.parse(readFileSync(new URL("./unihan.json", import.meta.url), "utf8")).chars;
    const real = (c) => chars[c];
    const gaku = classifyZh("学", real);
    assert.equal(gaku.relation, "ja-simp");
    assert.equal(gaku.traditional, "學");
    assert.deepEqual(gaku.pinyin, ["xué"]);
    assert.equal(classifyZh("働", real).relation, "kokuji");
    assert.equal(classifyZh("語", real).relation, "ja-trad");
    assert.equal(classifyZh("広", real).relation, "all-differ");
    assert.deepEqual(classifyZh("弁", real).alsoTraditional?.length, 2);
});
