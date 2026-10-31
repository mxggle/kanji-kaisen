import { test } from "node:test";
import assert from "node:assert/strict";
import {
    compareByFrequency,
    flattenOrder,
    mostPainted,
    nextKanji,
    nextLabel,
    sealState,
    SEAL_COMMON,
    sliceGroups,
    storyExcerpt,
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

test("sliceGroups splits a flat order by group sizes", () => {
    assert.deepEqual(sliceGroups(["a", "b", "c", "d", "e"], [3, 1, 1]), [["a", "b", "c"], ["d"], ["e"]]);
    assert.deepEqual(sliceGroups([], []), []);
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

test("sealState is blank without ink and met with any", () => {
    assert.equal(sealState(["a", "b", "c"], shades({})), "blank");
    assert.equal(sealState(["a", "b", "c"], shades({ c: 1 })), "met");
    assert.equal(sealState(["a", "b", "c"], shades({ a: 2, b: 2 })), "met");
});

test("sealState marks the radical holding the next kanji as now", () => {
    assert.equal(sealState(["a", "b"], shades({}), true), "now");
    // now wins over familiar, so the learner sees where they are.
    assert.equal(sealState(["a", "b", "c", "d"], shades({ a: 3, b: 3 }), true), "now");
});

test("sealState is familiar when half the common kanji are known", () => {
    assert.equal(sealState(["a", "b", "c", "d"], shades({ a: 3, b: 4 })), "familiar");
    assert.equal(sealState(["a", "b", "c", "d"], shades({ a: 3 })), "met");
});

test("sealState seals a radical when all its common kanji are known", () => {
    const chars = Array.from({ length: SEAL_COMMON + 4 }, (_, i) => `k${i}`);
    const map = Object.fromEntries(chars.slice(0, SEAL_COMMON).map((c) => [c, 3]));
    // Rarer kanji past the common ones don't block the seal, even when it holds the next kanji.
    assert.equal(sealState(chars, shades(map), true), "sealed");
    assert.equal(sealState(["a"], shades({ a: 4 })), "sealed");
    assert.equal(sealState([], shades({})), "blank");
});

test("mostPainted picks the highest share and keeps the first on ties", () => {
    const themes = [{ name: "A", painted: 0.1 }, { name: "B", painted: 0.3 }, { name: "C", painted: 0.3 }];
    assert.equal(mostPainted(themes)?.name, "B");
    assert.equal(mostPainted([{ name: "A", painted: 0 }]), null);
    assert.equal(mostPainted([]), null);
});

test("storyExcerpt keeps whole sentences that fit", () => {
    const story = "Imagine three raindrops falling—that's sanzui! Whenever you see these three dots on the left side of a kanji, think of water. A third sentence that will not fit.";
    assert.equal(
        storyExcerpt(story, 140),
        "Imagine three raindrops falling—that's sanzui! Whenever you see these three dots on the left side of a kanji, think of water.",
    );
    assert.equal(storyExcerpt(story, 60), "Imagine three raindrops falling—that's sanzui!");
    assert.equal(storyExcerpt("  ", 60), "");
});

test("storyExcerpt cuts a long first sentence at a word", () => {
    const out = storyExcerpt("one two three four five six seven eight nine ten.", 20);
    assert.ok(out.length <= 20);
    assert.ok(out.endsWith("…"));
    assert.equal(out, "one two three four…");
});
