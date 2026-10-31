import { test } from "node:test";
import assert from "node:assert/strict";
import { minifyPathData, sanitizeAncientSvg } from "./svg-sanitize.ts";

// Shape of a real ACC file (File:水-oracle.svg, Inkscape output), shortened.
const INKSCAPE = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg4242"
   width="300" height="300" viewBox="0 0 300 300">
  <metadata id="metadata4248"><rdf:RDF><dc:title>x</dc:title></rdf:RDF></metadata>
  <defs id="defs4246" />
  <path style="fill:#000000;stroke-width:0.6988551" id="path4252"
     d="m 136.09531,259.30587 c 26.81679,-59.68105 21.60895,-76.16305 -5.71347,-130.44743 z" />
</svg>`;

test("keeps the drawing and drops prolog, metadata, ids and namespaces", () => {
    const out = sanitizeAncientSvg(INKSCAPE);
    assert.ok(!("error" in out));
    assert.equal(
        out.svg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="currentColor">' +
            '<path d="m136.1 259.3c26.8-59.7 21.6-76.2-5.7-130.4z"/></svg>',
    );
    assert.deepEqual(out.viewBox, [0, 0, 300, 300]);
    assert.equal(out.shapes, 1);
    assert.deepEqual(out.dropped, ["defs", "metadata"]);
});

test("strips scripts, event handlers, foreign content and external references", () => {
    const evil = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" onload="alert(1)">
  <script>alert(1)</script>
  <style>path{fill:red}</style>
  <foreignObject><div xmlns="http://www.w3.org/1999/xhtml">hi</div></foreignObject>
  <image href="https://example.com/x.png" width="10" height="10"/>
  <use xlink:href="https://example.com/s.svg#a"/>
  <a href="javascript:alert(1)"><path d="M0 0L1 1"/></a>
  <g onclick="alert(1)" transform="translate(10, 20)" filter="url(https://example.com/f)">
    <path d="M10 10L20 20" fill="url(https://example.com/p)" onmouseover="x()" class="c" style="background:url(x)"/>
  </g>
</svg>`;
    const out = sanitizeAncientSvg(evil);
    assert.ok(!("error" in out));
    assert.doesNotMatch(out.svg, /script|style|foreign|image|use|href|on\w+=|url\(|javascript|example|class=/i);
    assert.equal(
        out.svg,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">' +
            '<g transform="translate(10,20)"><path d="M10 10L20 20"/></g></svg>',
    );
    assert.deepEqual(out.dropped, ["a", "foreignObject", "image", "script", "style", "use"]);
});

test("makes the viewBox square, centred, from width/height when missing", () => {
    const out = sanitizeAncientSvg('<svg width="200" height="100"><rect x="0" y="0" width="50" height="50"/></svg>');
    assert.ok(!("error" in out));
    assert.deepEqual(out.viewBox, [0, -50, 200, 200]);
    assert.match(out.svg, /viewBox="0 -50 200 200"/);
    assert.match(out.svg, /<rect x="0" y="0" width="50" height="50"\/>/);
});

test("stroked drawings keep their strokes in currentColor; hidden shapes go", () => {
    const svg = `<svg viewBox="0 0 300 300"><g style="fill:none;stroke:#000;stroke-width:8;stroke-linecap:round">
  <path d="M10 10 L 290 290"/><path style="display:none" d="M0 0L5 5"/><path d="M1 1L2 2" opacity="0"/></g></svg>`;
    const out = sanitizeAncientSvg(svg);
    assert.ok(!("error" in out));
    assert.equal(out.shapes, 1);
    assert.match(out.svg, /<path d="M10 10L290 290" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"\/>/);
});

test("drops a white background but refuses white shapes used as holes", () => {
    const bg = '<svg viewBox="0 0 300 300"><rect width="300" height="300" fill="#fff"/><path d="M0 0L9 9"/></svg>';
    const out = sanitizeAncientSvg(bg);
    assert.ok(!("error" in out));
    assert.equal(out.shapes, 1);
    assert.doesNotMatch(out.svg, /rect/);

    const hole = '<svg viewBox="0 0 300 300"><path d="M0 0L9 9"/><circle cx="5" cy="5" r="2" style="fill:white"/></svg>';
    assert.deepEqual(sanitizeAncientSvg(hole), { error: "white-fill" });
});

test("rejects non-SVG, malformed and empty input", () => {
    assert.deepEqual(sanitizeAncientSvg("<html></html>"), { error: "not-svg" });
    assert.deepEqual(sanitizeAncientSvg('<svg viewBox="0 0 1 1"><g></svg>'), { error: "malformed" });
    assert.deepEqual(sanitizeAncientSvg('<svg viewBox="0 0 1 1"><text>木</text></svg>'), { error: "no-shapes" });
    assert.deepEqual(sanitizeAncientSvg('<svg viewBox="0 0 0 1"><path d="M0 0"/></svg>'), { error: "bad-viewbox" });
});

test("minifyPathData rounds, compacts and refuses junk", () => {
    assert.equal(minifyPathData("M 10.04,20.06 L -5.5 -0.25 Z", 1), "M10 20.1L-5.5-.3Z");
    assert.equal(minifyPathData("m 1.25 .5 .75 .5", 2), "m1.25.5.75.5");
    assert.equal(minifyPathData("M0 0 A5 5 0 011 1", 1), "M0 0 A5 5 0 011 1");
    assert.equal(minifyPathData("M0 0 L url(x)", 1), null);
    assert.equal(minifyPathData("L0 0", 1), null);
});
