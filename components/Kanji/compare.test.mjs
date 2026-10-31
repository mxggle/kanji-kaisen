import { test } from "node:test";
import assert from "node:assert/strict";
import { compareParts } from "./compare.ts";

const umi = {
    char: "海",
    strokeCount: 9,
    components: [
        { char: "氵", role: "meaning", strokes: [[1, 3]] },
        { char: "毎", role: "sound", strokes: [[4, 9]] },
    ],
};
const kuyamu = {
    char: "悔",
    strokeCount: 9,
    components: [
        { char: "忄", role: "meaning", strokes: [[1, 3]] },
        { char: "毎", role: "sound", strokes: [[4, 9]] },
    ],
};

test("compareParts highlights the part that differs", () => {
    const diff = compareParts(umi, kuyamu);
    assert.deepEqual(diff.onlyA, ["氵"]);
    assert.deepEqual(diff.onlyB, ["忄"]);
    assert.deepEqual(diff.highlightA, [0, 1, 2]);
    assert.deepEqual(diff.highlightB, [0, 1, 2]);
    assert.equal(diff.caption, "海 has 氵 where 悔 has 忄.");
});

test("compareParts names an added part", () => {
    const mai = { char: "毎", strokeCount: 6, components: [{ char: "毎", role: "form", strokes: [[1, 6]] }] };
    const diff = compareParts(mai, umi);
    assert.deepEqual(diff.onlyA, []);
    assert.deepEqual(diff.onlyB, ["氵"]);
    assert.equal(diff.caption, "海 adds 氵.");
});

test("compareParts stays neutral without parts", () => {
    const tree = { char: "木", strokeCount: 4, components: [] };
    const book = { char: "本", strokeCount: 5, components: [{ char: "木", role: "meaning", strokes: [[1, 4]] }] };
    const diff = compareParts(tree, book);
    assert.deepEqual(diff.highlightA, []);
    assert.deepEqual(diff.highlightB, []);
    assert.match(diff.caption, /stroke by stroke/);
});
