import test from "node:test";
import assert from "node:assert/strict";

import { buildPhoneticSeries, isRegular, onKey, sharedOnReading } from "./phonetic.ts";

const ON = {
    毎: ["マイ"],
    海: ["カイ"],
    悔: ["カイ"],
    梅: ["バイ"],
    敏: ["ビン"],
    反: ["ハン", "ホン", "タン", "ホ"],
    板: ["ハン", "バン"],
    飯: ["ハン"],
    坂: ["ハン"],
    寺: ["ジ"],
    持: ["ジ"],
    待: ["タイ"],
};
const onOf = (c) => ON[c] ?? [];

test("onKey ignores the first mora's voicing", () => {
    assert.equal(onKey("バン"), onKey("ハン"));
    assert.equal(onKey("パン"), onKey("ハン"));
    assert.notEqual(onKey("カイ"), onKey("マイ"));
});

test("sharedOnReading finds the family's common reading", () => {
    assert.equal(sharedOnReading(["毎", "海", "悔", "梅", "敏"], onOf, "毎"), "カイ");
    assert.equal(sharedOnReading(["反", "板", "飯", "坂"], onOf, "反"), "ハン");
    assert.equal(sharedOnReading(["寺", "待"], onOf, "寺"), null);
});

test("isRegular compares voicing-insensitively", () => {
    assert.equal(isRegular(["カイ"], "カイ"), true);
    assert.equal(isRegular(["バイ"], "カイ"), false);
    assert.equal(isRegular(["バン"], "ハン"), true);
    assert.equal(isRegular(["カイ"], null), false);
});

test("buildPhoneticSeries groups by phonetic and heads with the phonetic when it is a kanji", () => {
    const series = buildPhoneticSeries(
        [
            { char: "毎", phon: null },
            { char: "海", phon: "毎" },
            { char: "梅", phon: "毎" },
            { char: "悔", phon: "毎" },
            { char: "持", phon: "寺" },
            { char: "待", phon: "寺" },
        ],
        (c) => c === "毎",
        onOf,
    );
    assert.deepEqual(series.get("毎"), { char: "毎", members: ["毎", "海", "梅", "悔"], reading: "カイ" });
    // 寺 is not an atlas kanji here, but its reading still counts.
    assert.deepEqual(series.get("寺"), { char: "寺", members: ["持", "待"], reading: "ジ" });
});
