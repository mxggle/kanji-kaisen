import { test } from "node:test";
import assert from "node:assert/strict";
import {
    codePointHex,
    etymonCandidates,
    parseCjkRadicals,
    parseEquivalentUnified,
    parseRadicalStrokes,
    parseUnihanVariants,
} from "./etymon.ts";

// Excerpts of the Unicode 18 data files.
const VARIANTS = [
    "# comment",
    "U+5B66\tkJapaneseOldVariant\tU+5B78",
    "U+5B66\tkTraditionalVariant\tU+5B78",
    "U+4F53\tkJapaneseOldVariant\tU+9AD4",
    "U+4F53\tkTraditionalVariant\tU+4F53 U+9AD4",
    "U+82B8\tkJapaneseOldVariant\tU+85DD",
    "U+82B8\tkTraditionalVariant\tU+82B8 U+8553",
    "U+5F01\tkJapaneseOldVariant\tU+8FA8 U+74E3 U+8FAF",
    "U+6238\tkZVariant\tU+6236 U+6237",
    "U+6C35\tkSemanticVariant\tU+6C34<kMatthews",
    "U+9EC4\tkTraditionalVariant\tU+9EC3 U+9EC4",
    "U+6D77\tkJapaneseOldVariant\tU+FA45",
].join("\n");
const RS = [
    "U+6C35\tkRSUnicode\t85.0",
    "U+6C34\tkRSUnicode\t85.0",
    "U+738B\tkRSUnicode\t96.-1",
    "U+5FC4\tkRSUnicode\t61.0",
    "U+6728\tkRSUnicode\t75.0",
    "U+4F11\tkRSUnicode\t9.4",
].join("\n");
const RADICALS = ["85; 2F54; 6C34", "85'; 2EA1; 6C35", "61; 2F3C; 5FC3", "96; 2F5F; 7389", "75; 2F4A; 6728"].join("\n");
const EQUIVALENT = ["2E96       ; 5FC4  #     CJK RADICAL HEART ONE", "2F00..2F01 ; 4E00 # test range"].join("\n");

const data = {
    variants: parseUnihanVariants(VARIANTS),
    radicalStrokes: parseRadicalStrokes(RS),
    radicalChars: parseCjkRadicals(RADICALS),
    equivalent: parseEquivalentUnified(EQUIVALENT),
};

test("parsers read the Unicode data formats", () => {
    assert.deepEqual(data.variants.get("戸"), { kZVariant: ["戶", "户"] });
    assert.deepEqual(data.variants.get("氵"), { kSemanticVariant: ["水"] });
    assert.deepEqual(data.radicalStrokes.get("王"), { radical: "96", residual: -1 });
    assert.equal(data.radicalChars.get("85"), "水");
    assert.equal(data.radicalChars.has("85'"), false);
    assert.equal(data.equivalent.get("⺖"), "忄");
    assert.equal(data.equivalent.get(String.fromCodePoint(0x2f01)), "一");
});

test("a single Japanese old variant replaces the shinjitai", () => {
    assert.deepEqual(etymonCandidates("学", data), { candidates: ["學"] });
    assert.deepEqual(etymonCandidates("体", data), { candidates: ["體"] });
    // 芸 is also an unrelated old character (rue); 藝 is the one meant.
    assert.deepEqual(etymonCandidates("芸", data), { candidates: ["藝"] });
});

test("compatibility ideographs are not separate old forms", () => {
    assert.deepEqual(etymonCandidates("海", data), { candidates: ["海"] });
});

test("several old variants make the etymon ambiguous", () => {
    assert.deepEqual(etymonCandidates("弁", data), { candidates: [], ambiguous: ["辨", "瓣", "辯"] });
});

test("radical forms fall back to their main radical", () => {
    assert.deepEqual(etymonCandidates("氵", data), { candidates: ["氵", "水"] });
    assert.deepEqual(etymonCandidates("⺖", data), { candidates: ["⺖", "忄", "心"] });
    // 王 is a character of its own (residual -1), so 玉 is not added.
    assert.deepEqual(etymonCandidates("王", data), { candidates: ["王"] });
    // A compound is not a radical form.
    assert.deepEqual(etymonCandidates("休", data), { candidates: ["休"] });
});

test("Z variants are added; traditional variants only when the char isn't traditional", () => {
    assert.deepEqual(etymonCandidates("戸", data), { candidates: ["戸", "戶", "户"] });
    assert.deepEqual(etymonCandidates("黄", data), { candidates: ["黄"] });
    assert.deepEqual(etymonCandidates("木", data), { candidates: ["木"] });
});

test("codePointHex pads like KanjiVG file names", () => {
    assert.equal(codePointHex("學"), "05b78");
    assert.equal(codePointHex("𦉰"), "26270");
});
