import { test } from "node:test";
import assert from "node:assert/strict";
import {
    compareByFrequency,
    flattenOrder,
    groupOf,
    nextKanji,
    nextLabel,
    nextVerb,
    suggestedOrder,
} from "./order.ts";

const k = (char, frequency, radicalKey, strokeCount = 5) => ({
    char,
    frequency,
    strokeCount,
    radical: radicalKey ? { key: radicalKey } : null,
});

const shades = (map) => (char) => map[char] ?? 0;

test("compareByFrequency puts common kanji first and unranked ones last", () => {
    const list = [k("C", null, "x", 3), k("B", 200, "x"), k("A", 10, "x"), k("D", null, "x", 2)];
    assert.deepEqual(list.sort(compareByFrequency).map((x) => x.char), ["A", "B", "D", "C"]);
});

test("compareByFrequency breaks frequency ties by strokes, then code point", () => {
    const list = [k("乙", 5, "x", 4), k("甲", 5, "x", 4), k("丙", 5, "x", 3)];
    assert.deepEqual(list.sort(compareByFrequency).map((x) => x.char), ["丙", "乙", "甲"]);
});

test("suggestedOrder sorts radicals by kanji count and kanji by frequency", () => {
    const radicals = [{ key: "ki" }, { key: "sanzui" }, { key: "ishi" }, { key: "empty" }, { key: "gyouninben" }];
    const kanji = [
        k("木", 300, "ki"),
        k("本", 10, "ki"),
        k("海", 200, "sanzui"),
        k("決", 71, "sanzui"),
        k("法", 100, "sanzui"),
        k("石", 400, "ishi"),
        k("後", 26, "gyouninben"),
        k("?", 1, null),
    ];
    const groups = suggestedOrder(radicals, kanji);
    // 3 kanji, then 2, then the two 1-kanji radicals by key; "empty" is dropped.
    assert.deepEqual(groups.map((g) => g.radical.key), ["sanzui", "ki", "gyouninben", "ishi"]);
    assert.deepEqual(groups[0].kanji.map((x) => x.char), ["決", "法", "海"]);
    assert.deepEqual(groups[1].kanji.map((x) => x.char), ["本", "木"]);
    assert.deepEqual(flattenOrder(groups), ["決", "法", "海", "本", "木", "後", "石"]);
});

test("suggestedOrder does not mutate its inputs", () => {
    const radicals = [{ key: "b" }, { key: "a" }];
    const kanji = [k("2", 2, "a"), k("1", 1, "a"), k("3", 3, "b")];
    suggestedOrder(radicals, kanji);
    assert.deepEqual(radicals.map((r) => r.key), ["b", "a"]);
    assert.deepEqual(kanji.map((x) => x.char), ["2", "1", "3"]);
});

test("nextKanji starts at the first kanji when nothing has ink", () => {
    assert.deepEqual(nextKanji(["決", "法", "海"], shades({})), { char: "決", mode: "start" });
    assert.equal(nextKanji([], shades({})), null);
});

test("nextKanji continues at the first kanji below Learning", () => {
    assert.deepEqual(nextKanji(["決", "法", "海"], shades({ 決: 2, 法: 1 })), { char: "法", mode: "continue" });
    assert.deepEqual(nextKanji(["決", "法", "海"], shades({ 決: 4, 法: 3 })), { char: "海", mode: "continue" });
    // Ink elsewhere in the list still counts as started.
    assert.deepEqual(nextKanji(["決", "法", "海"], shades({ 海: 1 })), { char: "決", mode: "continue" });
});

test("nextKanji falls back to the first kanji below Mastered, then revisits", () => {
    assert.deepEqual(nextKanji(["決", "法"], shades({ 決: 4, 法: 2 })), { char: "法", mode: "continue" });
    assert.deepEqual(nextKanji(["決", "法"], shades({ 決: 4, 法: 4 })), { char: "決", mode: "revisit" });
});

test("nextLabel words each mode", () => {
    assert.equal(nextLabel({ char: "決", mode: "start" }), "Start with 決");
    assert.equal(nextLabel({ char: "海", mode: "continue" }), "Continue with 海");
    assert.equal(nextLabel({ char: "木", mode: "revisit" }), "Revisit 木");
});

test("nextVerb words each mode without the kanji", () => {
    assert.equal(nextVerb("start"), "Start with");
    assert.equal(nextVerb("continue"), "Continue with");
    assert.equal(nextVerb("revisit"), "Revisit");
});

test("groupOf finds the group holding a kanji, else the first", () => {
    const groups = [["決", "法"], ["本", "東"], ["日"]];
    assert.equal(groupOf(groups, "東"), 1);
    assert.equal(groupOf(groups, "日"), 2);
    assert.equal(groupOf(groups, "海"), 0);
    assert.equal(groupOf(groups, null), 0);
    assert.equal(groupOf([], "海"), 0);
});
