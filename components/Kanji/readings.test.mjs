import { test } from "node:test";
import assert from "node:assert/strict";
import {
    displayMeanings,
    gradeLabel,
    kanjiTitle,
    layoutReadings,
    meaningHeadline,
    partGloss,
    shortGloss,
    titleReadings,
    wordSegments,
} from "./readings.ts";

const w = (word, reading, meaning = "m", extra = {}) => ({ word, reading, meaning, ...extra });

test("displayMeanings drops KANJIDIC notes", () => {
    assert.deepEqual(displayMeanings(["work", "(kokuji)"]), ["work"]);
    assert.deepEqual(displayMeanings(["(kokuji)"]), ["(kokuji)"]);
    assert.equal(meaningHeadline(["sea", "ocean", "extra"]), "sea, ocean");
});

test("partGloss shortens radical meanings", () => {
    assert.equal(partGloss("Water (3 drops)"), "water");
    assert.equal(partGloss("person (standing)"), "person");
    assert.equal(partGloss("sun, day"), "sun");
    assert.equal(partGloss("to lack, yawn"), "to lack");
    assert.equal(partGloss("Korea"), "Korea");
});

test("shortGloss keeps the first senses", () => {
    assert.equal(shortGloss("people; men and women"), "people; men and women");
    assert.equal(shortGloss("as soon as ...; just after ...; immediately after ..."), "as soon as ...; just after ...");
    const long = shortGloss("a very long single sense that goes on and on, and on beyond the limit");
    assert.ok(long.length <= 44);
    assert.ok(long.endsWith("…"));
});

test("layoutReadings shows readings with words and collapses the rest", () => {
    const layout = layoutReadings([
        { reading: "セイ", kind: "on", words: [w("学生", "がくせい")] },
        { reading: "い.きる", kind: "kun", words: [w("生きる", "いきる")] },
        { reading: "い.かす", kind: "kun", words: [] },
        { reading: "", kind: "special", words: [w("芝生", "しばふ", "lawn", { special: true })] },
    ]);
    assert.deepEqual(layout.main.map((b) => b.reading), ["セイ", "い.きる"]);
    assert.deepEqual(layout.more.map((b) => b.reading), ["い.かす"]);
    assert.equal(layout.main[1].stem, "い");
    assert.equal(layout.main[1].okurigana, "きる");
    assert.equal(layout.main[1].romaji, "ikiru");
    assert.equal(layout.main[0].kind, "on");
    assert.deepEqual(layout.special.map((s) => s.word), ["芝生"]);
});

test("layoutReadings shows every reading when none has words", () => {
    const layout = layoutReadings([
        { reading: "カ", kind: "on", words: [] },
        { reading: "なべ", kind: "kun", words: [] },
    ]);
    assert.equal(layout.main.length, 2);
    assert.equal(layout.more.length, 0);
});

test("layoutReadings handles 々 (special words only) and dedupes words", () => {
    const layout = layoutReadings([
        { reading: "", kind: "special", words: [w("人々", "ひとびと", "people"), w("人々", "ひとびと", "people; men and women"), w("山々", "やまやま")] },
    ]);
    assert.deepEqual(layout.main, []);
    assert.deepEqual(layout.special.map((s) => s.word), ["人々", "山々"]);
});

test("wordSegments marks the kanji inside a word", () => {
    assert.deepEqual(wordSegments("日本海", "海"), [
        { text: "日本", hit: false },
        { text: "海", hit: true },
    ]);
    assert.deepEqual(wordSegments("海外", "海"), [
        { text: "海", hit: true },
        { text: "外", hit: false },
    ]);
    assert.deepEqual(wordSegments("人々", "海"), [{ text: "人々", hit: false }]);
});

const umi = {
    char: "海",
    meanings: ["sea", "ocean"],
    onyomi: ["カイ"],
    kunyomi: ["うみ"],
    wordsByReading: [
        { reading: "カイ", kind: "on", words: [w("海外", "かいがい")] },
        { reading: "うみ", kind: "kun", words: [w("海", "うみ")] },
    ],
};

test("titleReadings lead with a kun reading that has words", () => {
    assert.deepEqual(titleReadings(umi), ["うみ", "カイ"]);
    const sei = {
        onyomi: ["セイ", "ショウ"],
        kunyomi: ["い.きる", "い.かす"],
        wordsByReading: [
            { reading: "セイ", kind: "on", words: [w("a", "a")] },
            { reading: "ショウ", kind: "on", words: [w("b", "b")] },
            { reading: "い.きる", kind: "kun", words: [] },
            { reading: "い.かす", kind: "kun", words: [w("c", "c")] },
        ],
    };
    assert.deepEqual(titleReadings(sei), ["いかす", "セイ", "ショウ"]);
});

test("kanjiTitle leads with readings", () => {
    assert.equal(kanjiTitle(umi), "海 (うみ, カイ) – sea, ocean: readings, words, stroke order");
    assert.equal(
        kanjiTitle({ char: "々", meanings: ["iteration mark"], onyomi: [], kunyomi: [], wordsByReading: [] }),
        "々 – iteration mark: words, stroke order",
    );
});

test("gradeLabel names KANJIDIC grades", () => {
    assert.equal(gradeLabel(2), "grade 2");
    assert.equal(gradeLabel(8), "secondary school");
    assert.equal(gradeLabel(9), "name kanji");
    assert.equal(gradeLabel(null), null);
});
