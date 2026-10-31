import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { extractStrokes, partOffsets, pathPoints, rangeIndexes, strokeOwners, strokeTypeName } from "./strokes.ts";

const raw = fs.readFileSync(path.join(process.cwd(), "public", "kanjivg", "kanji", "06d77.svg"), "utf8");

test("extractStrokes reads 海's nine strokes in order with their types", () => {
    const strokes = extractStrokes(raw);
    assert.equal(strokes.length, 9);
    assert.ok(strokes[0].d.startsWith("M20.38,14.75"));
    assert.equal(strokes[0].type, "㇔");
    assert.ok(strokes[8].d.startsWith("M30.63,58.98"));
});

test("extractStrokes sorts by the stroke number in the id", () => {
    const svg = '<svg><path id="kvg:x-s2" d="M2,2"/><path id="kvg:x-s1" kvg:type="㇐" d="M1,1"/></svg>';
    assert.deepEqual(extractStrokes(svg), [
        { d: "M1,1", type: "㇐" },
        { d: "M2,2", type: "" },
    ]);
    assert.deepEqual(extractStrokes("<svg></svg>"), []);
});

test("rangeIndexes and strokeOwners map component ranges to strokes", () => {
    assert.deepEqual(rangeIndexes([[1, 2], [8, 8]]), [0, 1, 7]);
    assert.deepEqual(rangeIndexes([[3, 5]], 4), [2, 3]);
    assert.deepEqual(strokeOwners(5, [[0, 1], [1, 2, 3]]), [0, 0, 1, 1, null]);
});

test("pathPoints follows relative and absolute commands", () => {
    assert.deepEqual(pathPoints("M10,10c1,1,2,2,3,3"), [
        { x: 10, y: 10 },
        { x: 11, y: 11 },
        { x: 12, y: 12 },
        { x: 13, y: 13 },
    ]);
    const pts = pathPoints("M13.75,89.21C16,90,17.06,89.57,18,87.95c2.75-4.7,5.5-10.45,8-16.45");
    const last = pts[pts.length - 1];
    assert.ok(Math.abs(last.x - 26) < 1e-9 && Math.abs(last.y - 71.5) < 1e-9);
    assert.deepEqual(pathPoints("M0,0L5,5h2v-1z"), [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 7, y: 5 },
        { x: 7, y: 4 },
    ]);
});

test("partOffsets pulls 海's 氵 left and 毎 right", () => {
    const paths = extractStrokes(raw).map((s) => s.d);
    const [water, every] = partOffsets(paths, [[0, 1, 2], [3, 4, 5, 6, 7, 8]]);
    assert.ok(water.x < 0, "氵 moves left");
    assert.ok(every.x > 0, "毎 moves right");
});

test("partOffsets spreads parts that share a centre", () => {
    const paths = ["M50,50l1,1", "M51,51l-1,-1"];
    const [a, b] = partOffsets(paths, [[0], [1]]);
    assert.ok(a.x < 0 && b.x > 0);
});

test("strokeTypeName names common strokes", () => {
    assert.equal(strokeTypeName("㇔"), "a dot");
    assert.equal(strokeTypeName("㇑a"), "a line down");
    assert.equal(strokeTypeName("㇔/㇀"), "a dot");
    assert.equal(strokeTypeName(""), "");
});
