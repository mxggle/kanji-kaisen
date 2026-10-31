import test from "node:test";
import assert from "node:assert/strict";

import {
    MAX_SAVED_SETS,
    MAX_SET_KANJI,
    MAX_TITLE_LENGTH,
    TEACH_WORDS_SHARDS,
    cleanTitle,
    decodeSet,
    encodeSet,
    extractKanji,
    isKanji,
    moveItem,
    parsePaper,
    pickTeachWords,
    removeSavedSet,
    sanitizeSavedSets,
    setPath,
    sharedRadical,
    shortGloss,
    upsertSavedSet,
    wordsShardOf,
} from "./teach-set.ts";

const KNOWN = new Set(["海", "泳", "流", "港", "湖", "波", "洗", "深", "休", "々", "𠮟"]);

test("encodes kanji and title into k and t", () => {
    assert.equal(encodeSet({ chars: ["海", "泳"], title: "Lesson 7" }), "k=%E6%B5%B7%E6%B3%B3&t=Lesson%207");
    assert.equal(encodeSet({ chars: "海泳" }), "k=%E6%B5%B7%E6%B3%B3");
    assert.equal(encodeSet({ chars: [], title: "Empty" }), "", "an empty set has no query");
    assert.equal(encodeSet({ chars: "a&b", title: "x" }), "", "non-kanji are dropped");
    assert.equal(encodeSet({ chars: "海", title: "Water & waves?" }), "k=%E6%B5%B7&t=Water%20%26%20waves%3F");
});

test("decodes from query strings, URLSearchParams and Next searchParams", () => {
    const expected = { chars: ["海", "泳"], title: "Lesson 7" };
    assert.deepEqual(decodeSet("?k=%E6%B5%B7%E6%B3%B3&t=Lesson%207"), expected);
    assert.deepEqual(decodeSet("k=海泳&t=Lesson+7"), expected);
    assert.deepEqual(decodeSet(new URLSearchParams("k=海泳&t=Lesson 7")), expected);
    assert.deepEqual(decodeSet({ k: "海泳", t: ["Lesson 7", "ignored"] }), expected);
    assert.deepEqual(decodeSet({}), { chars: [], title: "" });
    assert.deepEqual(decodeSet("k=%E0%A4%A"), { chars: [], title: "" }, "malformed escapes don't throw");
});

test("round-trips through encode and decode", () => {
    const set = { chars: ["海", "泳", "𠮟", "々"], title: "Lesson 7 · Water words" };
    assert.deepEqual(decodeSet(encodeSet(set)), set);
    assert.deepEqual(decodeSet(encodeSet(set, KNOWN), KNOWN), set);
});

test("drops duplicates, non-kanji and unknown characters, keeping order", () => {
    assert.deepEqual(extractKanji("海と海、泳ぐ! sea 港"), ["海", "泳", "港"]);
    assert.deepEqual(extractKanji("海鍋泳", KNOWN), ["海", "泳"], "unknown kanji are dropped");
    assert.deepEqual(extractKanji("海鍋泳", (c) => c !== "海"), ["鍋", "泳"], "accepts a predicate");
    assert.deepEqual(extractKanji("海鍋泳", ["鍋"]), ["鍋"], "accepts any iterable");
    assert.deepEqual(decodeSet("k=海鍋海泳x", KNOWN).chars, ["海", "泳"]);
    assert.equal(isKanji("𠮟"), true, "astral kanji count as one character");
    assert.equal(isKanji("ア"), false);
});

test("caps sets at 60 kanji and titles at 80 characters", () => {
    const many = Array.from({ length: 100 }, (_, i) => String.fromCodePoint(0x4e00 + i)).join("");
    assert.equal(MAX_SET_KANJI, 60);
    assert.equal(decodeSet({ k: many }).chars.length, 60);
    assert.equal(decodeSet({ k: many }).chars.at(-1), String.fromCodePoint(0x4e00 + 59));
    // Unknown characters don't use up the cap.
    const withUnknown = "鍋".repeat(5) + "海泳";
    assert.deepEqual(decodeSet({ k: withUnknown }, KNOWN).chars, ["海", "泳"]);

    const long = "a".repeat(120);
    assert.equal(cleanTitle(long).length, MAX_TITLE_LENGTH);
    assert.equal(cleanTitle("  Lesson\n\t7   · water  "), "Lesson 7 · water");
    assert.equal(cleanTitle(`${"x".repeat(79)} y`), "x".repeat(79), "trimmed after cutting");
    assert.equal(Array.from(cleanTitle("𠮟".repeat(90))).length, 80, "counts code points, not UTF-16 units");
    assert.equal(cleanTitle(null), "");
    assert.equal(decodeSet({ k: "海", t: "  " }).title, "");
});

test("builds print, present and set paths", () => {
    const set = { chars: ["海", "泳"], title: "Lesson 7" };
    assert.equal(setPath("set", set), "/set?k=%E6%B5%B7%E6%B3%B3&t=Lesson%207");
    assert.equal(setPath("present", { chars: "海" }), "/teach/present?k=%E6%B5%B7");
    assert.equal(setPath("print", { chars: "海" }), "/teach/print?k=%E6%B5%B7");
    assert.equal(
        setPath("print", set, { paper: "letter", answerKey: true, words: false }),
        "/teach/print?k=%E6%B5%B7%E6%B3%B3&t=Lesson%207&paper=letter&key=1&words=0",
    );
    assert.equal(setPath("set", set, { answerKey: true }), "/set?k=%E6%B5%B7%E6%B3%B3&t=Lesson%207", "print options only apply to print");
    assert.equal(setPath("set", { chars: [] }), "/set");
    assert.equal(parsePaper("Letter"), "letter");
    assert.equal(parsePaper(["a4"]), "a4");
    assert.equal(parsePaper("tabloid"), "a4");
    assert.equal(parsePaper(undefined), "a4");
});

test("saved sets are sanitized, upserted by title and removed", () => {
    const now = new Date(Date.UTC(2026, 9, 31, 12));
    let sets = upsertSavedSet([], { chars: "海泳", title: "Water" }, now);
    assert.equal(sets.length, 1);
    assert.deepEqual({ title: sets[0].title, chars: sets[0].chars }, { title: "Water", chars: "海泳" });

    const later = new Date(now.getTime() + 60_000);
    sets = upsertSavedSet(sets, { chars: "海泳港", title: "Water" }, later);
    assert.equal(sets.length, 1, "same title replaces");
    assert.equal(sets[0].chars, "海泳港");

    sets = upsertSavedSet(sets, { chars: "休", title: "" }, new Date(later.getTime() + 1000));
    assert.equal(sets.length, 2);
    assert.equal(sets[0].chars, "休", "newest first");
    assert.deepEqual(upsertSavedSet(sets, { chars: "abc" }), sets, "empty sets are not saved");

    assert.deepEqual(removeSavedSet(sets, sets[0].id).map((s) => s.chars), ["海泳港"]);

    const stored = JSON.parse(JSON.stringify(sets));
    assert.deepEqual(sanitizeSavedSets(stored), sets);
    assert.deepEqual(sanitizeSavedSets(null), []);
    assert.deepEqual(sanitizeSavedSets({ a: 1 }), []);
    assert.deepEqual(
        sanitizeSavedSets([{ id: "a", title: 3, chars: "海海x", savedAt: "t" }, { id: "a", chars: "泳", savedAt: "t" }, { id: "b", chars: "abc", savedAt: "t" }, { id: "c", chars: "泳" }]),
        [{ id: "a", title: "", chars: "海", savedAt: "t" }],
    );
    const lots = Array.from({ length: 80 }, (_, i) => ({ id: `x${i}`, title: "", chars: "海", savedAt: "t" }));
    assert.equal(sanitizeSavedSets(lots).length, MAX_SAVED_SETS);
});

test("moves items and finds a shared radical", () => {
    assert.deepEqual(moveItem(["a", "b", "c"], 0, 1), ["b", "a", "c"]);
    assert.deepEqual(moveItem(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
    assert.deepEqual(moveItem(["a", "b", "c"], 2, 9), ["a", "b", "c"], "clamped");
    assert.deepEqual(moveItem(["a", "b", "c"], 0, -1), ["a", "b", "c"]);

    const radicals = { 海: "sanzui", 泳: "sanzui", 休: "ninben" };
    const of = (c) => radicals[c] ?? null;
    assert.equal(sharedRadical(["海", "泳"], of), "sanzui");
    assert.equal(sharedRadical(["海", "休"], of), null);
    assert.equal(sharedRadical(["海"], of), null, "one kanji is not a pattern");
    assert.equal(sharedRadical(["x", "y"], of), null);
});

test("words shards spread kanji by code point", () => {
    assert.equal(wordsShardOf("海"), 0x6d77 % TEACH_WORDS_SHARDS);
    for (const c of KNOWN) {
        const shard = wordsShardOf(c);
        assert.ok(shard >= 0 && shard < TEACH_WORDS_SHARDS);
    }
});

test("picks up to two worksheet words, compounds first, no special readings", () => {
    const examples = [
        { word: "日本海", reading: "にほんかい", meaning: "Sea of Japan" },
        { word: "航海", reading: "こうかい", meaning: "sailing; voyage" },
        { word: "海", reading: "うみ", meaning: "sea" },
        { word: "海岸", reading: "かいがん", meaning: "coast, beach" },
        { word: "海老", reading: "えび", meaning: "shrimp", special: true },
        { word: "海水浴場です", reading: "x", meaning: "too long" },
        { word: "山", reading: "やま", meaning: "unrelated" },
    ];
    assert.deepEqual(pickTeachWords("海", examples), [
        { word: "航海", reading: "こうかい", meaning: "sailing" },
        { word: "海岸", reading: "かいがん", meaning: "coast" },
    ]);
    assert.deepEqual(pickTeachWords("海", examples.slice(2, 3)), [{ word: "海", reading: "うみ", meaning: "sea" }]);
    assert.deepEqual(pickTeachWords("海", []), []);
    assert.equal(shortGloss("a very long meaning that goes on and on and on"), "a very long meaning that goes o…");
    assert.equal(shortGloss("west; Spain"), "west");
});
