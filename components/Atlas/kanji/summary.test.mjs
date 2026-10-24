import { test } from "node:test";
import assert from "node:assert/strict";
import { firstSentences, truncate } from "./summary.ts";

test("firstSentences keeps the first sentences", () => {
    const text = "Imagine three raindrops falling—that's sanzui! Whenever you see these dots, think of water. Third one.";
    assert.equal(firstSentences(text, 1), "Imagine three raindrops falling—that's sanzui!");
    assert.equal(firstSentences(text, 2), "Imagine three raindrops falling—that's sanzui! Whenever you see these dots, think of water.");
    assert.equal(firstSentences("No terminal punctuation", 2), "No terminal punctuation");
    assert.equal(firstSentences("", 2), "");
});

test("firstSentences does not split on decimals or abbreviations without spaces", () => {
    assert.equal(firstSentences("It is 3.5 cm long. Next.", 1), "It is 3.5 cm long.");
});

test("truncate cuts at a word boundary", () => {
    assert.equal(truncate("short", 10), "short");
    const out = truncate("one two three four five six", 15);
    assert.ok(out.length <= 15);
    assert.equal(out, "one two three…");
});
