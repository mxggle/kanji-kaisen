import { test } from "node:test";
import assert from "node:assert/strict";
import { familyRows, gloss } from "./family.ts";

const k = (char, onyomi, components, meaning = char) => ({ char, meanings: [meaning], onyomi, category: "Nature & Elements", components });
const mean = (char, radicalKey) => ({ char, role: "meaning", radicalKey });
const snd = (char) => ({ char, role: "sound", radicalKey: "ao" });

const series = [
    k("青", ["セイ"], [{ char: "龶", role: "form" }, { char: "月", role: "form" }]),
    k("情", ["ジョウ", "セイ"], [mean("忄", "risshinben"), snd("青")]),
    k("精", ["セイ"], [mean("米", "kome"), snd("青")], "refined"),
    k("静", ["セイ"], [{ char: "青", role: "both", radicalKey: "ao" }, { char: "争", role: "meaning" }]),
    k("晴", ["セイ"], [mean("日", "hi"), snd("青")], "clear up"),
    k("清", ["セイ"], [mean("氵", "sanzui"), snd("青")], "pure"),
    k("請", ["セイ"], [mean("言", "gonben"), snd("青")]),
];

test("familyRows keeps clean meaning + sound kanji read with the family reading", () => {
    const rows = familyRows(series, "青", "セイ");
    assert.deepEqual(rows.map((r) => r.char), ["精", "晴", "清"]);
    assert.deepEqual(rows[2], { char: "清", meaning: "pure", category: "Nature & Elements", part: { char: "氵", radicalKey: "sanzui" } });
});

test("familyRows honours the limit and skips parts that are not radicals", () => {
    assert.deepEqual(familyRows(series, "青", "セイ", 1).map((r) => r.char), ["精"]);
    const loose = [k("晴", ["セイ"], [{ char: "日", role: "meaning" }, snd("青")])];
    assert.deepEqual(familyRows(loose, "青", "セイ"), []);
});

test("gloss keeps the first plain word", () => {
    assert.equal(gloss("Water (3 drops)"), "water");
    assert.equal(gloss("sun, day"), "sun");
    assert.equal(gloss("rice, grain"), "rice");
    assert.equal(gloss("rain (top radical)"), "rain · top");
});
