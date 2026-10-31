import { test } from "node:test";
import assert from "node:assert/strict";
import {
    cleanReading,
    emptyJourneyNote,
    originText,
    partsLine,
    pickGrowsInto,
    positionPhrase,
    radicalHeadline,
    readingLine,
    shortMeaning,
    shownNote,
    stageCaptions,
    usableExamples,
    wiktionaryRevisionUrl,
} from "./radical.ts";

test("radicalHeadline joins the name and the meaning, lower-casing a leading capital", () => {
    assert.equal(radicalHeadline("Ki", "tree, wood"), "Ki · tree, wood");
    assert.equal(radicalHeadline("Hi", "Fire, flame"), "Hi · fire, flame");
    assert.equal(radicalHeadline("X", "JLPT word"), "X · JLPT word");
    assert.equal(radicalHeadline("Ki", ""), "Ki");
});

test("shortMeaning keeps the first plain gloss", () => {
    assert.equal(shortMeaning("tree, wood"), "tree");
    assert.equal(shortMeaning("Water (3 drops)"), "water");
    assert.equal(shortMeaning("speech/words"), "speech");
    assert.equal(shortMeaning("sun; day"), "sun");
});

test("positionPhrase takes the first sentence, calms capitals and drops the full stop", () => {
    assert.equal(positionPhrase("Always appears on the LEFT side of the kanji."), "always appears on the left side of the kanji");
    assert.equal(
        positionPhrase("Always at the BOTTOM-LEFT, wrapping under the rest of the character"),
        "always at the bottom-left, wrapping under the rest of the character",
    );
    assert.equal(
        positionPhrase("Standalone kanji, or at the bottom (as in 警 and 誓). On the left side it is written as gonben (訁)."),
        "standalone kanji, or at the bottom (as in 警 and 誓)",
    );
    assert.equal(positionPhrase("Standalone kanji, on the left side (kihen), or occasionally at the bottom"), "standalone kanji, on the left side (kihen), or occasionally at the bottom");
    assert.equal(positionPhrase(""), "");
});

test("readings drop okurigana dots and affix dashes; kun first, then on", () => {
    assert.equal(cleanReading("やす.む"), "やすむ");
    assert.equal(cleanReading("-どき"), "どき");
    assert.equal(cleanReading("こ-"), "こ");
    assert.equal(readingLine(["キュウ"], ["やす.む", "やす.まる"]), "やすむ · キュウ");
    assert.equal(readingLine(["コウ", "キョウ"], []), "コウ");
    assert.equal(readingLine([], ["はやし"]), "はやし");
    assert.equal(readingLine([], []), "");
});

test("usableExamples drops placeholder examples", () => {
    const list = [
        { char: "林", meaning: "grove", explanation: "" },
        { char: "?", meaning: "x", explanation: "" },
        { char: "森", meaning: "example", explanation: "" },
        { char: "undefined", meaning: "y", explanation: "" },
        { char: "本", meaning: "", explanation: "" },
    ];
    assert.deepEqual(usableExamples(list).map((e) => e.char), ["林"]);
    assert.deepEqual(usableExamples(), []);
});

test("pickGrowsInto puts story examples with a page first, then the most common kanji", () => {
    const examples = [
        { char: "林", meaning: "grove", explanation: "Two trees.", exists: true },
        { char: "𣏟", meaning: "rare", explanation: "Not in the atlas.", exists: false },
        { char: "木", meaning: "tree", explanation: "The radical itself.", exists: true },
        { char: "本", meaning: "book", explanation: "A mark at the roots.", exists: true },
    ];
    const common = [{ char: "本" }, { char: "東" }, { char: "木" }, { char: "来" }, { char: "校" }];
    assert.deepEqual(pickGrowsInto("木", examples, common, 4), [
        { char: "林", explanation: "Two trees." },
        { char: "本", explanation: "A mark at the roots." },
        { char: "東" },
        { char: "来" },
    ]);
});

test("pickGrowsInto respects the limit and works without a story", () => {
    const common = [{ char: "A" }, { char: "B" }, { char: "C" }];
    assert.deepEqual(pickGrowsInto("R", [], common, 2), [{ char: "A" }, { char: "B" }]);
    const many = ["a", "b", "c", "d", "e"].map((char) => ({ char, meaning: char, explanation: char, exists: true }));
    assert.equal(pickGrowsInto("R", many, common, 3).length, 3);
    assert.deepEqual(pickGrowsInto("R", [], [], 4), []);
});

test("partsLine labels sound parts and glosses the rest; one part is not a sum", () => {
    const gloss = ({ char }) => ({ 木: "tree", 亻: "person" })[char] ?? null;
    assert.equal(
        partsLine([{ char: "木", role: "meaning" }, { char: "交", role: "sound" }], gloss),
        "木 tree + 交 sound",
    );
    assert.equal(partsLine([{ char: "亻", role: "meaning" }, { char: "木", role: "form" }], gloss), "亻 person + 木 tree");
    assert.equal(partsLine([{ char: "木", role: "meaning" }, { char: "？", role: "form" }], gloss), "木 tree + ？");
    assert.equal(partsLine([{ char: "木", role: "meaning" }], gloss), "");
    assert.equal(partsLine([], gloss), "");
});

const stage = (id, src) => ({ stage: id, src, credit: { text: "c" } });

test("stageCaptions names the character a stage shows when it differs from the page's", () => {
    const stages = [stage("bronze", "/ancient/b.svg"), stage("seal", "/ancient/s.svg")];
    const files = [
        { char: "仌", src: "/ancient/b.svg" },
        { char: "仌", src: "/ancient/s.svg" },
        { char: "仌" },
    ];
    const captions = stageCaptions("冫", stages, files);
    assert.deepEqual(Object.keys(captions), ["bronze", "seal"]);
    assert.match(captions.bronze, /^Cast into ritual bronze vessels\. The character shown is 仌\.$/);
    assert.equal(shownNote("冫", stages, files), "The bronze and seal stages show 仌, not 冫 itself.");
});

test("stageCaptions leaves stages of the page's own character alone", () => {
    const stages = [stage("oracle", "/ancient/o.svg"), stage("bronze", "/ancient/b.svg")];
    const files = [
        { char: "木", src: "/ancient/o.svg" },
        { char: "朩", src: "/ancient/b.svg" },
    ];
    assert.deepEqual(Object.keys(stageCaptions("木", stages, files)), ["bronze"]);
    assert.deepEqual(stageCaptions("木", [], []), {});
    assert.equal(shownNote("木", stages, files), "The bronze stage shows 朩, not 木 itself.");
    assert.equal(shownNote("木", [], []), "");
});

test("shownNote names each differing character with its stages", () => {
    const stages = [stage("oracle", "/o.svg"), stage("bronze", "/b.svg"), stage("seal", "/s.svg")];
    const files = [
        { char: "网", src: "/o.svg" },
        { char: "冈", src: "/b.svg" },
        { char: "罒", src: "/s.svg" },
    ];
    assert.equal(shownNote("罒", stages, files), "The oracle bone stage shows 网 and the bronze stage shows 冈, not 罒 itself.");
});

test("emptyJourneyNote names the character and the licence rule", () => {
    assert.equal(
        emptyJourneyNote("木"),
        "No ancient form of 木 passed our licence check yet. We only show forms from public-domain or CC0 sources.",
    );
});

test("wiktionaryRevisionUrl links the exact revision", () => {
    assert.equal(
        wiktionaryRevisionUrl("水", 94507192),
        "https://en.wiktionary.org/w/index.php?title=%E6%B0%B4&oldid=94507192",
    );
});

test("originText keeps sourced sentences and drops ones that lost an inline image", () => {
    assert.equal(
        originText("Semantic 士 or 王, + semantic 呂 (“two blocks of metal”) + phonetic 亼 (今). The blocks of metal were originally drawn as: and later as 丷."),
        "Semantic 士 or 王, + semantic 呂 (“two blocks of metal”) + phonetic 亼 (今).",
    );
    assert.equal(
        originText("The sun. A dot or line was added in the centre to distinguish it from visually similar characters, e.g. 口."),
        "The sun. A dot or line was added in the centre to distinguish it from visually similar characters, e.g. 口.",
    );
    assert.equal(originText("A tree: branches on top, roots on the bottom."), "A tree: branches on top, roots on the bottom.");
    assert.equal(originText("Drawn as ( ) in bronze."), "");
    assert.equal(originText(undefined), "");
});
