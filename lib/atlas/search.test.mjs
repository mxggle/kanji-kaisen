import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { searchKanji } from "./search.ts";

const index = JSON.parse(readFileSync(new URL("../../public/data/search-index.json", import.meta.url), "utf8"));
const chars = (results) => results.map((r) => r.entry.c);

test("empty or blank query returns nothing", () => {
    assert.deepEqual(searchKanji(index, ""), []);
    assert.deepEqual(searchKanji(index, "   "), []);
});

test("English meaning: exact match ranks first", () => {
    const results = searchKanji(index, "water");
    assert.equal(results[0].entry.c, "水");
    assert.equal(results[0].match, "meaning");
});

test("English meaning is case-insensitive", () => {
    assert.equal(searchKanji(index, "  WATER ")[0].entry.c, "水");
});

test("'sea' finds 海 at the top", () => {
    assert.equal(searchKanji(index, "sea")[0].entry.c, "海");
});

test("exact > word prefix > substring for meanings", () => {
    const results = searchKanji(index, "sea", { limit: 200 });
    const scores = Object.fromEntries(results.map((r) => [r.entry.c, r.score]));
    const sea = scores["海"];
    // 季 "season" is a word-prefix hit; anything matching only inside a word ranks lower.
    const prefixHit = results.find((r) => r.entry.m.some((m) => m.toLowerCase().startsWith("sea") && m.toLowerCase() !== "sea"));
    const substringHit = results.find((r) => r.entry.m.every((m) => !/(^|[^a-z])sea/i.test(m)));
    assert.ok(prefixHit && substringHit, "fixture has prefix and substring hits");
    assert.ok(sea > prefixHit.score);
    assert.ok(prefixHit.score > substringHit.score);
});

test("romaji is converted to kana: 'mizu' finds 水", () => {
    const results = searchKanji(index, "mizu", { limit: 5 });
    assert.ok(chars(results).includes("水"), chars(results).join(""));
    assert.equal(results[0].entry.c, "水");
});

test("hiragana reading: 'みず' finds 水 first", () => {
    assert.equal(searchKanji(index, "みず")[0].entry.c, "水");
});

test("katakana is normalized: 'ミズ' finds 水 first", () => {
    assert.equal(searchKanji(index, "ミズ")[0].entry.c, "水");
});

test("on'yomi typed in hiragana or katakana", () => {
    assert.ok(chars(searchKanji(index, "かい", { limit: 30 })).includes("海"));
    assert.ok(chars(searchKanji(index, "カイ", { limit: 30 })).includes("海"));
});

test("KANJIDIC okurigana dot is ignored: 'ふるい' and stem 'ふる' find 古", () => {
    assert.equal(searchKanji(index, "ふるい")[0].entry.c, "古");
    assert.ok(chars(searchKanji(index, "ふる", { limit: 10 })).includes("古"));
});

test("exact reading outranks prefix reading", () => {
    const results = searchKanji(index, "みず", { limit: 50 });
    const exact = results.find((r) => r.entry.c === "水");
    const prefix = results.find((r) => r.entry.c === "自"); // みずか.ら
    assert.ok(prefix, "自 matches as a prefix");
    assert.ok(exact.score > prefix.score);
});

test("a single kanji query returns that kanji first", () => {
    const results = searchKanji(index, "海");
    assert.equal(results[0].entry.c, "海");
    assert.equal(results[0].match, "kanji");
});

test("every kanji in the query is a hit, in query order", () => {
    assert.deepEqual(chars(searchKanji(index, "日本")).slice(0, 2), ["日", "本"]);
    assert.deepEqual(chars(searchKanji(index, "本日")).slice(0, 2), ["本", "日"]);
    assert.deepEqual(chars(searchKanji(index, "日日")), ["日"]);
});

test("ties break by frequency, unknown frequency last", () => {
    const results = searchKanji(index, "a", { limit: 500 });
    for (let i = 1; i < results.length; i++) {
        const [a, b] = [results[i - 1], results[i]];
        if (a.score !== b.score) continue;
        assert.ok((a.entry.f ?? Infinity) <= (b.entry.f ?? Infinity), `${a.entry.c} before ${b.entry.c}`);
    }
});

test("limit caps the result count", () => {
    assert.equal(searchKanji(index, "a", { limit: 7 }).length, 7);
    assert.deepEqual(searchKanji(index, "water", { limit: 0 }), []);
});

test("nonsense finds nothing", () => {
    assert.deepEqual(searchKanji(index, "zzqxv"), []);
});

test("English queries tolerate a leading 'to' or article", () => {
    const eat = chars(searchKanji(index, "to eat"));
    assert.ok(eat.slice(0, 3).includes("食"), eat.slice(0, 5).join(""));
    assert.equal(searchKanji(index, "the sea")[0].entry.c, searchKanji(index, "sea")[0].entry.c);
});

test("a whole reading outranks an okurigana stem, and macrons are accepted", () => {
    // 人 has the reading ひと; 独 only reaches it as the stem of ひと.り.
    const hito = chars(searchKanji(index, "hito"));
    assert.ok(hito.indexOf("人") < hito.indexOf("独"), hito.slice(0, 5).join(""));
    assert.ok(searchKanji(index, "ōkii").some((r) => r.entry.c === "大"));
});
