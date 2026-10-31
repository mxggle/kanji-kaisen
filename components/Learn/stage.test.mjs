import test from "node:test";
import assert from "node:assert/strict";

import { strokeLines, traceNote } from "./stage.ts";

const umi = [
    { char: "氵", role: "meaning", roleLabel: "meaning" },
    { char: "毎", role: "sound", roleLabel: "sound" },
];
const owners = ["氵", "氵", "氵", "毎", "毎", "毎", "毎", "毎", "毎"];

test("strokeLines draws meaning solid, sound dashed, the rest grey", () => {
    assert.deepEqual(strokeLines(umi, owners, 9), ["meaning", "meaning", "meaning", "sound", "sound", "sound", "sound", "sound", "sound"]);
    assert.deepEqual(strokeLines([{ char: "口", role: "both" }, { char: "木", role: "form" }], ["口", "木", null], 3), ["meaning", "form", "form"]);
    assert.deepEqual(strokeLines([], [], 2), ["meaning", "meaning"], "a kanji without parts is drawn whole");
});

test("traceNote names the stroke and its part", () => {
    assert.equal(traceNote(4, 9, "a dot", owners, umi), "Stroke 4 of 9: a dot. It begins the sound part 毎.");
    assert.equal(traceNote(5, 9, "", owners, umi), "Stroke 5 of 9. It belongs to the sound part 毎.");
    assert.equal(traceNote(1, 3, "a line down", [null, null, null], []), "Stroke 1 of 3: a line down.");
    assert.equal(traceNote(1, 1, "", ["口"], [{ char: "口", role: "form", roleLabel: "part" }]), "Stroke 1 of 1. It begins the part 口.");
});
