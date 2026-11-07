import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createAtlas } from "./atlas/core.ts";
import { kanjivgFileName } from "./atlas/kanjivg-svg.ts";
import {
    CARD_PALETTE,
    FALLBACK_ART,
    MAX_MEANING,
    VERMILION,
    buildCardModel,
    cardQuestion,
    cardReadings,
    cardUrl,
    cleanGloss,
    clip,
    fitBounds,
    fitLines,
    fitList,
    fitText,
    headlineMeaning,
    inkWash,
    posterize,
    parseStrokePaths,
    pathBounds,
    pickEquation,
    readingLine,
    shareCardInput,
    strokeColors,
    strokeStyles,
    strokeIndexes,
} from "./share-card.ts";

const readJson = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
const atlas = createAtlas(readJson("./atlas/kanji-atlas.json"), readJson("./compiled-stories.json"));
const lookup = { radical: atlas.getRadicalSummary, kanji: atlas.getKanji };
const card = (char, options) => buildCardModel(shareCardInput(atlas.getKanji(char), lookup), options);
const kanjivg = (char) => readFileSync(new URL(`../public/kanjivg/kanji/${kanjivgFileName(char)}`, import.meta.url), "utf8");

// A fake font: every character is half the font size wide.
const measure = (text, size) => [...text].length * size * 0.5;

test("休 asks why, with person (meaning) + tree as its equation", () => {
    const model = card("休");
    assert.equal(model.question.kind, "why");
    assert.equal(model.question.text, "Why does 休 mean rest?");
    assert.equal(model.question.before + model.char + model.question.after, model.question.text);
    assert.equal(model.meaning, "rest");
    assert.deepEqual(
        model.equation.map((p) => [p.char, p.gloss, p.roleLabel, p.color]),
        [
            ["亻", "person", "meaning", "#83B7E4"],
            ["木", "tree", "", "#83B7E4"],
        ],
    );
    assert.deepEqual(model.readings, ["やすむ", "キュウ"]);
    assert.equal(readingLine(model.readings), "やすむ · キュウ");
    assert.equal(model.urlLabel, "kanji-kaisen.harrysui.me/kanji/休");
    assert.equal(model.url, "https://kanji-kaisen.harrysui.me/kanji/%E4%BC%91");
    assert.equal(model.fileName, "kanji-休.png");
    assert.equal(model.art, "/images/categories/human-body-people.png");
    assert.match(model.alt, /亻 person \(meaning\) \+ 木 tree = rest\./);
    assert.match(model.alt, /Read やすむ, キュウ\./);
});

test("海's sound part shows the family reading, its meaning part the radical", () => {
    const model = card("海");
    assert.equal(model.question.text, "Why does 海 mean sea?");
    assert.deepEqual(
        model.equation.map((p) => [p.char, p.gloss, p.roleLabel]),
        [
            ["氵", "water", "meaning"],
            ["毎", "カイ", "sound"],
        ],
    );
    assert.equal(readingLine(model.readings), "うみ · カイ");
});

test("鍋's meaning part is metal, and every part takes the kanji's theme colour", () => {
    const model = card("鍋");
    assert.equal(model.question.text, "Why does 鍋 mean pot?");
    const [metal, other] = model.equation;
    assert.deepEqual([metal.char, metal.gloss, metal.roleLabel], ["金", "metal", "meaning"]);
    assert.deepEqual([other.char, other.gloss, other.roleLabel, other.color], ["咼", "", "", model.color]);
    assert.equal(readingLine(model.readings), "なべ · カ");
});

test("々 has no build, no readings and no theme", () => {
    const model = card("々");
    assert.equal(model.question.kind, "what");
    assert.equal(model.question.text, "What does 々 mean?");
    assert.equal(model.meaning, "iteration mark");
    assert.deepEqual(model.readings, []);
    assert.deepEqual(model.equation, []);
    assert.equal(model.hiddenParts, 0);
    assert.equal(model.art, FALLBACK_ART);
    assert.equal(model.color, "#B4AFA4");
    assert.equal(model.alt, "Share card for 々. What does 々 mean? 々 means iteration mark. kanji-kaisen.harrysui.me/kanji/々");
});

test("a kanji with one component (or none) asks what it means and shows no equation", () => {
    const one = buildCardModel({
        char: "木",
        meanings: ["tree", "wood"],
        onyomi: ["ボク", "モク"],
        kunyomi: ["き", "こ-"],
        components: [{ char: "木", role: "meaning", radicalKey: "ki", strokes: [[1, 4]] }],
        category: "Nature & Elements",
    });
    assert.equal(one.question.text, "What does 木 mean?");
    assert.deepEqual(one.equation, []);
    assert.equal(one.hiddenParts, 0);
    assert.equal(one.components.length, 1);
    assert.deepEqual(card("木").equation, []);
    assert.equal(card("木").question.kind, "what");
});

test("two parts whose roles no source states still show the equation but ask what", () => {
    const parts = [
        { char: "口", role: "form", strokes: [[1, 3]] },
        { char: "口", role: "form", strokes: [[4, 6]] },
    ];
    assert.equal(cardQuestion("吅", "clamour", parts).kind, "what");
    const model = buildCardModel({ char: "吅", meanings: ["clamour"], onyomi: [], kunyomi: [], components: parts, category: null });
    assert.equal(model.equation.length, 2);
});

test("long meanings give way to a shorter one, else are clipped, and the question falls back to how", () => {
    const model = card("張");
    assert.equal(atlas.getKanji("張").meanings[0], "counter for bows & stringed instruments");
    assert.ok(model.meaning.length <= MAX_MEANING);
    // Too long: the next meaning that fits stands in.
    assert.equal(model.meaning, "stretch");
    assert.equal(model.question.text, "Why does 張 mean stretch?");
    assert.equal(headlineMeaning(["counter for bows & stringed instruments"]), "counter for bows & stringed…");
    assert.equal(cardQuestion("張", "counter for bows & stringed…", model.components).text, "How is 張 built?");

    assert.equal(headlineMeaning(["pongee (a knotted silk cloth)"]), "pongee");
    assert.equal(headlineMeaning(["conjunction (astronomy)"]), "conjunction (astronomy)");
    assert.equal(headlineMeaning(["work", "(kokuji)"]), "work");
    assert.equal(headlineMeaning(["(kokuji)", "work"]), "work");
    assert.equal(headlineMeaning([]), "");
    assert.equal(headlineMeaning(["supercalifragilisticexpialidocious"], 10), "supercali…");
});

test("clip never ends on a stop word or dangling punctuation", () => {
    assert.equal(clip("short", 10), "short");
    assert.equal(clip("counter for bows & stringed instruments", 20), "counter for bows…");
    assert.equal(clip("sign of the snake or serpent", 12), "sign…");
    assert.equal(clip("one, two, three", 9), "one…");
    assert.ok(clip("a b c d e f g h", 5).length <= 5);
});

test("glosses are short and lower-case", () => {
    assert.equal(cleanGloss("Water (3 drops)"), "water");
    assert.equal(cleanGloss("metal, gold, money"), "metal");
    assert.equal(cleanGloss("inch, (2.25 cm)"), "inch");
    assert.equal(cleanGloss("DNA"), "DNA");
    assert.equal(cleanGloss("(kokuji)"), "");
    assert.equal(cleanGloss(undefined), "");
    assert.ok(cleanGloss("earthen jar, pottery vessel").length <= 14);
});

test("big kanji keep three parts, stated roles first, in order", () => {
    const model = card("鬱");
    assert.equal(model.components.length, 6);
    assert.deepEqual(model.equation.map((p) => p.char), ["缶", "木", "鬯"]);
    assert.equal(model.hiddenParts, 3);
    assert.deepEqual(card("品").equation.map((p) => p.char), ["口", "口", "口"]);
    assert.deepEqual(
        pickEquation([{ role: "form" }, { role: "form" }, { role: "sound" }, { role: "form" }]).map((p) => p.role),
        ["form", "form", "sound"],
    );
});

test("readings: kun first, one per word family, short", () => {
    assert.deepEqual(cardReadings(["やす.む", "やす.まる", "やす.める"], ["キュウ"]), ["やすむ", "キュウ"]);
    const bright = atlas.getKanji("明");
    const readings = cardReadings(bright.kunyomi, bright.onyomi);
    assert.deepEqual(readings, ["あかり", "メイ", "あかるい"]);
    assert.equal(readingLine(readings), "あかり · あかるい · メイ");
    // Affixes only when nothing else exists.
    assert.deepEqual(cardReadings(["き", "こ-"], ["ボク", "モク"]), ["き", "ボク", "モク"]);
    assert.deepEqual(cardReadings(["-か"], []), ["-か".replace("-", "")]);
    assert.deepEqual(cardReadings([], ["カ"]), ["カ"]);
    assert.deepEqual(cardReadings([], []), []);
    // The first kun and on always come; more only within 10 kana.
    assert.deepEqual(cardReadings(["うけたまわ.る"], ["ショウ", "ジョウ"]), ["うけたまわる", "ショウ"]);
    assert.deepEqual(cardReadings(["うけたまわ.る"], ["ショウ"], { maxChars: 4 }), ["うけたまわる", "ショウ"]);
});

test("cardUrl takes the origin as a parameter", () => {
    assert.deepEqual(cardUrl("海", "http://localhost:3000/"), {
        url: "http://localhost:3000/kanji/%E6%B5%B7",
        label: "localhost:3000/kanji/海",
    });
    assert.equal(card("海", { origin: "https://example.test" }).urlLabel, "example.test/kanji/海");
});

test("stroke colours follow the part's role, in the kanji's own theme colour (rules 1 and 2)", () => {
    const model = card("休");
    const grey = CARD_PALETTE.night.ink2;
    assert.deepEqual(strokeColors(model, "night", 6), ["#83B7E4", "#83B7E4", grey, grey, grey, grey]);
    const ink2 = CARD_PALETTE.ink.ink2;
    assert.deepEqual(strokeColors(model, "ink", 6), [VERMILION, VERMILION, ink2, ink2, ink2, ink2]);
    // 海: 氵 carries the meaning (solid), 毎 the sound (dashed), both in the accent.
    const sea = card("海");
    const styles = strokeStyles(sea, "night", 9);
    assert.deepEqual([...new Set(styles.map((s) => s.color))], [sea.color]);
    assert.deepEqual(styles.map((s) => s.dashed), [false, false, false, true, true, true, true, true, true]);
    // A kanji without components is one colour; extra strokes in the file are ignored safely.
    assert.deepEqual(strokeColors(card("々"), "night", 3), ["#B4AFA4", "#B4AFA4", "#B4AFA4"]);
    assert.deepEqual(strokeColors(card("々"), "ink", 3), [VERMILION, VERMILION, VERMILION]);
    assert.deepEqual(strokeColors(model, "night", 2), ["#83B7E4", "#83B7E4"]);
    assert.deepEqual(strokeIndexes([[1, 2], [5, 5]]), [0, 1, 4]);
});

test("parseStrokePaths reads every stroke of a KanjiVG file in order", () => {
    const paths = parseStrokePaths(kanjivg("休"));
    assert.equal(paths.length, 6);
    assert.ok(paths[0].startsWith("M35,16.5c0.25,1.75"));
    assert.equal(parseStrokePaths(kanjivg("々")).length, 3);
    assert.equal(parseStrokePaths(kanjivg("鍋")).length, atlas.getKanji("鍋").strokeCount);
});

test("pathBounds follows relative and absolute commands", () => {
    assert.deepEqual(pathBounds(["M10,10 L20,30", "m5,5 h10 v-20 z"]), { minX: 5, minY: -15, maxX: 20, maxY: 30 });
    assert.deepEqual(pathBounds(["M0,0c1,2,3,4,5,6s1-1,2,2"]), { minX: 0, minY: 0, maxX: 7, maxY: 8 });
    assert.equal(pathBounds([]), null);
    // 亻 in 休 sits in the left third of the 109 box.
    const person = pathBounds(parseStrokePaths(kanjivg("休")).slice(0, 2));
    assert.ok(person.minX > 9 && person.maxX < 36);
    assert.ok(person.minY >= 16 && person.maxY <= 95);
});

test("fitBounds centres a part and caps the zoom", () => {
    const tall = fitBounds({ minX: 10, minY: 10, maxX: 30, maxY: 90 }, 120, { padding: 4, minExtent: 72 });
    assert.ok(Math.abs(tall.scale - 112 / 80) < 1e-9);
    assert.ok(Math.abs(tall.x + 20 * tall.scale - (120 - 0) / 2) < 1e-9); // centre x maps to the box centre
    const small = fitBounds({ minX: 40, minY: 50, maxX: 60, maxY: 60 }, 120, { padding: 4, minExtent: 72 });
    assert.ok(Math.abs(small.scale - 120 / 72) < 1e-9);
});

test("fitText shrinks, then clips at the minimum size", () => {
    assert.deepEqual(fitText("rest", 200, measure, { max: 92, min: 48 }), { text: "rest", size: 92 });
    assert.equal(fitText("ocean", 200, measure, { max: 92, min: 48 }).size, 80);
    const clipped = fitText("counter for bows & stringed", 200, measure, { max: 40, min: 30 });
    assert.equal(clipped.size, 30);
    assert.ok(measure(clipped.text, 30) <= 200);
    assert.ok(clipped.text.endsWith("…"));
});

test("fitLines prefers one line, then wraps to two, then clips", () => {
    assert.deepEqual(fitLines("rest", 300, measure, { max: 92, min: 48 }), { lines: ["rest"], size: 92 });
    const one = fitLines("kettle", 300, measure, { max: 120, min: 48 });
    assert.equal(one.lines.length, 1);
    const two = fitLines("iteration mark", 300, measure, { max: 92, min: 48 });
    assert.deepEqual(two.lines, ["iteration", "mark"]);
    assert.ok(two.size >= 48 && two.size <= 69);
    const long = fitLines("one two three four five six seven", 160, measure, { max: 60, min: 40 });
    assert.equal(long.size, 40);
    assert.equal(long.lines.length, 2);
    assert.ok(long.lines.every((l) => measure(l, 40) <= 160));
    assert.ok(long.lines[1].endsWith("…"));
});

test("fitList drops the lowest-priority reading before shrinking too far", () => {
    const fit = fitList(["あかり", "メイ", "あかるい"], 200, measure, { max: 36, min: 28 });
    assert.deepEqual(fit.items, ["あかり", "メイ"]);
    assert.equal(fit.text, "あかり · メイ");
    assert.equal(fit.size, 36);
    assert.equal(fitList(["あかり", "メイ", "あかるい"], 220, measure, { max: 36, min: 28 }).text, "あかり · あかるい · メイ");
    assert.deepEqual(fitList(["うけたまわる"], 10, measure, { max: 36, min: 28 }).items, ["うけたまわる"]);
});

test("inkWash matches grayscale(1) contrast(1.45) brightness(1.18)", () => {
    const pixels = [255, 255, 255, 255, 0, 0, 0, 128, 128, 128, 128, 255, 255, 0, 0, 255];
    inkWash(pixels);
    assert.deepEqual(pixels.slice(0, 4), [255, 255, 255, 255]);
    assert.deepEqual(pixels.slice(4, 8), [0, 0, 0, 128]);
    assert.deepEqual(pixels.slice(8, 12), [151, 151, 151, 255]);
    // Pure red: luminance 54, contrast pulls it down to 21, brightness to 25.
    assert.deepEqual(pixels.slice(12, 16), [25, 25, 25, 255]);
});

test("posterize rounds colour channels and leaves alpha", () => {
    const pixels = [0, 1, 2, 7, 6, 7, 254, 255, 9, 10, 11, 128];
    posterize(pixels, 4);
    assert.deepEqual(pixels, [0, 0, 4, 7, 8, 8, 255, 255, 8, 12, 12, 128]);
    const same = [3, 5, 7, 9];
    posterize(same, 1);
    assert.deepEqual(same, [3, 5, 7, 9]);
    // Counted from the paper colour, so flat paper stays exact.
    const paper = [238, 233, 223, 255, 241, 236, 226, 255];
    posterize(paper, 4, [238, 233, 223]);
    assert.deepEqual(paper, [238, 233, 223, 255, 242, 237, 227, 255]);
});
