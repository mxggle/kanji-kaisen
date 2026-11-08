import test from "node:test";
import assert from "node:assert/strict";

import {
    alignByEdge,
    alignKanji,
    formatFurigana,
    kataToHira,
    matchReading,
    parseFurigana,
    readingForms,
    readingOkurigana,
    readingStem,
    segmentReading,
} from "./align.ts";

const READINGS = {
    海: { on: ["カイ"], kun: ["うみ"] },
    日: { on: ["ニチ", "ジツ"], kun: ["ひ", "-び", "-か"] },
    本: { on: ["ホン"], kun: ["もと"] },
    学: { on: ["ガク"], kun: ["まな.ぶ"] },
    校: { on: ["コウ", "キョウ"], kun: [] },
    生: { on: ["セイ", "ショウ"], kun: ["い.きる", "い.かす", "う.まれる", "う.まれ", "うまれ", "う.む", "なま"] },
    人: { on: ["ジン", "ニン"], kun: ["ひと", "-り", "-と"] },
    今: { on: ["コン", "キン"], kun: ["いま"] },
    食: { on: ["ショク", "ジキ"], kun: ["く.う", "た.べる"] },
    立: { on: ["リツ"], kun: ["た.つ", "た.てる"] },
    場: { on: ["ジョウ"], kun: ["ば"] },
    建: { on: ["ケン"], kun: ["た.てる", "た.つ"] },
    物: { on: ["ブツ", "モツ"], kun: ["もの"] },
    代: { on: ["ダイ", "タイ"], kun: ["か.わる", "よ", "しろ"] },
    一: { on: ["イチ", "イツ"], kun: ["ひと-", "ひと.つ"] },
};
const readingsOf = (c) => READINGS[c];

test("kataToHira converts katakana only", () => {
    assert.equal(kataToHira("カイ"), "かい");
    assert.equal(kataToHira("ビール"), "びーる");
    assert.equal(kataToHira("うみ"), "うみ");
});

test("readingStem and readingOkurigana read KANJIDIC notation", () => {
    assert.equal(readingStem("う.まれる"), "う");
    assert.equal(readingOkurigana("う.まれる"), "まれる");
    assert.equal(readingStem("-び"), "び");
    assert.equal(readingStem("ひと-"), "ひと");
    assert.equal(readingStem("ガク"), "がく");
});

test("readingForms covers rendaku and gemination", () => {
    const forms = readingForms("ガク").map((f) => f.form);
    assert.deepEqual(forms, ["がく", "がっ"]);
    assert.ok(readingForms("ひと").some((f) => f.form === "びと" && f.cost === 1));
    assert.ok(readingForms("ハツ").some((f) => f.form === "ぱっ" && f.cost === 2));
});

test("matchReading picks on/kun and uses okurigana to break ties", () => {
    assert.deepEqual(matchReading("かい", READINGS.海), { reading: "カイ", kind: "on" });
    assert.deepEqual(matchReading("うみ", READINGS.海), { reading: "うみ", kind: "kun" });
    assert.deepEqual(matchReading("い", READINGS.生, "きる"), { reading: "い.きる", kind: "kun" });
    assert.deepEqual(matchReading("い", READINGS.生, "かして"), { reading: "い.かす", kind: "kun" });
    assert.deepEqual(matchReading("う", READINGS.生, "まれ"), { reading: "う.まれ", kind: "kun" });
    assert.equal(matchReading("きょう", READINGS.今), null);
});

test("alignKanji follows furigana segments", () => {
    const furigana = parseFurigana(["日:に", "本:ほん", "海:かい"]);
    assert.deepEqual(alignKanji("日本海", "にほんかい", "海", readingsOf, furigana), { reading: "カイ", kind: "on" });
    // に is not a listed reading of 日 (it is にち shortened): irregular.
    assert.equal(alignKanji("日本海", "にほんかい", "日", readingsOf, furigana), null);
    assert.deepEqual(alignKanji("学校", "がっこう", "学", readingsOf, parseFurigana(["学:がっ", "校:こう"])), {
        reading: "ガク",
        kind: "on",
    });
});

test("a furigana segment spanning several kanji is irregular (jukujikun)", () => {
    assert.equal(alignKanji("今日", "きょう", "日", readingsOf, parseFurigana(["今日:きょう"])), null);
});

test("without furigana the heuristic segments the reading", () => {
    assert.deepEqual(segmentReading("食べる", "たべる", readingsOf), ["た", "べ", "る"]);
    assert.deepEqual(alignKanji("食べる", "たべる", "食", readingsOf), { reading: "た.べる", kind: "kun" });
    assert.deepEqual(alignKanji("人々", "ひとびと", "人", readingsOf), { reading: "ひと", kind: "kun" });
    assert.deepEqual(alignKanji("一日", "いちにち", "日", readingsOf), { reading: "ニチ", kind: "on" });
    assert.deepEqual(alignKanji("生ビール", "なまビール", "生", readingsOf), { reading: "なま", kind: "kun" });
    assert.equal(alignKanji("今日", "きょう", "今", readingsOf), null);
    assert.equal(alignKanji("大人", "おとな", "人", readingsOf), null);
});

test("furigana round-trips through the compact form", () => {
    const compact = ["お", "茶:ちゃ"];
    assert.deepEqual(parseFurigana(compact), [{ ruby: "お" }, { ruby: "茶", rt: "ちゃ" }]);
    assert.deepEqual(formatFurigana(parseFurigana(compact)), compact);
});

test("verb stems count as the kun reading in compounds", () => {
    assert.ok(readingForms("た.つ").some((f) => f.form === "たち"));
    assert.ok(readingForms("た.てる").some((f) => f.form === "たて"));
    assert.deepEqual(alignKanji("立場", "たちば", "立", readingsOf), { reading: "た.つ", kind: "kun" });
    assert.deepEqual(alignKanji("建物", "たてもの", "建", readingsOf), { reading: "た.てる", kind: "kun" });
});

test("alignByEdge handles digits only, at the word's edges", () => {
    assert.deepEqual(alignByEdge("10代", "じゅうだい", "代", READINGS.代), { reading: "ダイ", kind: "on" });
    assert.equal(alignByEdge("今年", "ことし", "年", { on: ["ネン"], kun: ["とし"] }), null);
});
