import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { countStrokes, kanjivgFileName, toInlineStrokeSvg } from "./kanjivg-svg.ts";

const read = (char) =>
    fs.readFileSync(path.join(process.cwd(), "public", "kanjivg", "kanji", kanjivgFileName(char)), "utf8");

test("kanjivgFileName pads the lowercase hex codepoint to 5 digits", () => {
    assert.equal(kanjivgFileName("海"), "06d77.svg");
    assert.equal(kanjivgFileName("々"), "03005.svg");
    assert.equal(kanjivgFileName("日"), "065e5.svg");
});

test("toInlineStrokeSvg strips prolog, doctype, comments and kvg attributes", () => {
    const svg = toInlineStrokeSvg(read("海"), { title: "Stroke order of 海", titleId: "t" });
    assert.ok(svg);
    assert.ok(svg.startsWith("<svg"));
    assert.doesNotMatch(svg, /<\?xml|<!DOCTYPE|<!--|ATTLIST|kvg:|id="kvg/);
    assert.match(svg, /<title id="t">Stroke order of 海<\/title>/);
    assert.match(svg, /role="img"/);
    assert.match(svg, /stroke="currentColor"/);
    assert.match(svg, /fill:var\(--accent\)/);
    assert.equal((svg.match(/<path\b/g) ?? []).length, 9);
    // Stroke numbers are kept.
    assert.equal((svg.match(/<text\b/g) ?? []).length, 9);
    assert.match(svg, /<\/svg>$/);
});

test("toInlineStrokeSvg escapes the title and rejects non-KanjiVG input", () => {
    const svg = toInlineStrokeSvg(read("々"), { title: 'a <b> & "c"', titleId: "x" });
    assert.match(svg, /a &lt;b&gt; &amp; &quot;c&quot;/);
    assert.equal(toInlineStrokeSvg("<svg></svg>", { title: "x", titleId: "x" }), null);
    assert.equal(toInlineStrokeSvg("not svg", { title: "x", titleId: "x" }), null);
});

test("countStrokes counts path elements", () => {
    assert.equal(countStrokes(read("海")), 9);
});
