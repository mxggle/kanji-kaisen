import test from "node:test";
import assert from "node:assert/strict";

import { currentLevel, filterByShade, firstToLearn, recentTheme, revisitChars, shadeCounts } from "./my-list.ts";

const at = (day) => `2026-10-${String(day).padStart(2, "0")}T00:00:00.000Z`;
const ink = {
    海: { shade: 1, updatedAt: at(20) },
    木: { shade: 2, updatedAt: at(25) },
    日: { shade: 4, updatedAt: at(30) },
    池: { shade: 1, updatedAt: at(10) },
    山: { shade: 3, updatedAt: at(28) },
};

test("shadeCounts counts every kanji once, unmet ones as 白", () => {
    assert.deepEqual(shadeCounts(ink, "海木日池山川川"), [1, 2, 1, 1, 1]);
    assert.deepEqual(shadeCounts({}, ""), [0, 0, 0, 0, 0]);
});

test("revisitChars suggests 淡 and 中 only, oldest first, capped", () => {
    assert.deepEqual(revisitChars(ink), ["池", "海", "木"]);
    assert.deepEqual(revisitChars(ink, 2), ["池", "海"]);
    assert.deepEqual(revisitChars(ink, 8, (c) => c !== "池"), ["海", "木"]);
    assert.deepEqual(revisitChars({}), []);
});

test("firstToLearn skips familiar kanji and falls back to the first", () => {
    assert.equal(firstToLearn(ink, ["日", "山", "海"]), "海");
    assert.equal(firstToLearn(ink, ["日", "山"]), "日");
    assert.equal(firstToLearn(ink, []), null);
});

test("currentLevel is the first level with a kanji below 濃", () => {
    const levels = [
        { level: "N5", chars: "日山" },
        { level: "N4", chars: "海" },
        { level: "N3", chars: "池" },
    ];
    assert.equal(currentLevel(ink, levels), "N4");
    assert.equal(currentLevel({ ...ink, 海: { shade: 3, updatedAt: at(1) }, 池: { shade: 4, updatedAt: at(1) } }, levels), "N3");
    assert.equal(currentLevel({}, levels), "N5");
});

test("recentTheme follows the latest ink change", () => {
    const themes = [
        { name: "Nature & Elements", chars: "海木山池" },
        { name: "Time & Sequence", chars: "日" },
    ];
    assert.equal(recentTheme(ink, themes), "Time & Sequence");
    assert.equal(recentTheme({}, themes), "Nature & Elements");
    assert.equal(recentTheme({ 犬: { shade: 1, updatedAt: at(31) } }, themes), "Nature & Elements");
});

test("filterByShade keeps the list order", () => {
    assert.deepEqual(filterByShade(ink, ["海", "川", "池", "日"], 1), ["海", "池"]);
    assert.deepEqual(filterByShade(ink, ["海", "川"], 0), ["川"]);
    assert.deepEqual(filterByShade(ink, ["海", "川"], "all"), ["海", "川"]);
});
