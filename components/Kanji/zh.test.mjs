import { test } from "node:test";
import assert from "node:assert/strict";
import { zhFacts, PINYIN_LIMIT } from "./zh.ts";

// Trimmed Unihan entries (lib/core/unihan.json shape).
const UNIHAN = {
    芸: { m: ["yún"], s: ["芸"], t: ["芸", "蕓"], jo: ["藝"], tgh: 1, tw: 1 },
    机: { m: ["jī"], s: ["机"], t: ["机", "機"], sv: ["機"], tgh: 1, tw: 1 },
    海: { m: ["hǎi"], tgh: 1, tw: 1 },
    学: { m: ["xué"], t: ["學"], jo: ["學"], tgh: 1 },
    広: { m: ["guǎng"], jo: ["廣"] },
};
const get = (c) => UNIHAN[c];
const MEANINGS = { 機: "loom, mechanism", 蕓: null };
const meaningOf = (c) => MEANINGS[c] ?? null;

test("芸 is a different character in Chinese", () => {
    const facts = zhFacts("芸", { relation: "all-differ", simplified: "艺", traditional: "藝", pinyin: ["yì"], kokuji: false }, get, meaningOf);
    assert.deepEqual(facts.falseFriend, { kind: "different-char", pinyin: ["yún"] });
});

test("simplified 机 also stands for 機", () => {
    const facts = zhFacts("机", { relation: "same", simplified: "机", traditional: "机", pinyin: ["jī"], kokuji: false }, get, meaningOf);
    assert.deepEqual(facts.falseFriend, { kind: "also-stands-for", chars: [{ char: "機", meaning: "loom, mechanism" }] });
});

test("plain same-form and simplified kanji carry no false-friend note", () => {
    const umi = zhFacts("海", { relation: "same", simplified: "海", traditional: "海", pinyin: ["hǎi"], kokuji: false }, get, meaningOf);
    assert.equal(umi.falseFriend, null);
    const gaku = zhFacts("学", { relation: "ja-simp", simplified: "学", traditional: "學", pinyin: ["xué"], kokuji: false }, get, meaningOf);
    assert.equal(gaku.falseFriend, null);
    // 広 is not a standard character in China or Taiwan, so it is not a false friend.
    const hiro = zhFacts("広", { relation: "all-differ", simplified: "广", traditional: "廣", pinyin: ["guǎng"], kokuji: false }, get, meaningOf);
    assert.equal(hiro.falseFriend, null);
});

test("kokuji never get a false-friend note and pinyin is capped", () => {
    const pinyin = ["a", "b", "c", "d"];
    const facts = zhFacts("働", { relation: "kokuji", simplified: null, traditional: null, pinyin, kokuji: true }, get, meaningOf);
    assert.equal(facts.falseFriend, null);
    assert.equal(facts.pinyin.length, PINYIN_LIMIT);
    assert.equal(facts.pinyinTruncated, true);
});
