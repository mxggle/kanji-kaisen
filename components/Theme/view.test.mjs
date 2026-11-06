import { test } from "node:test";
import assert from "node:assert/strict";
import { levelCounts, radicalGloss, radicalPosition } from "./view.ts";

test("radicalGloss keeps the first plain gloss, lower-cased", () => {
    assert.equal(radicalGloss("Water (3 drops)"), "water");
    assert.equal(radicalGloss("hill, village, mound (left form)"), "hill · left");
    assert.equal(radicalGloss("inch, (2.25 cm)"), "inch");
    assert.equal(radicalGloss("rain (top radical)"), "rain · top");
    assert.equal(radicalGloss("white (side form)"), "white · side");
    assert.equal(radicalGloss("tree, wood"), "tree");
    assert.equal(radicalGloss("steam/air"), "steam");
});

test("radicalGloss leaves acronyms and empty meanings alone", () => {
    assert.equal(radicalGloss("UFO, saucer"), "UFO");
    assert.equal(radicalGloss(""), "");
});

test("levelCounts counts per level, N5 first, without empty levels", () => {
    assert.deepEqual(levelCounts(["N1", "N5", "N1", "N3", "N5", "N1"]), [
        { level: "N5", count: 2 },
        { level: "N3", count: 1 },
        { level: "N1", count: 3 },
    ]);
    assert.deepEqual(levelCounts([]), []);
});

test("radicalPosition reads only position notes", () => {
    assert.equal(radicalPosition("rain (top radical)"), "top");
    assert.equal(radicalPosition("eight, divide (top form)"), "top");
    assert.equal(radicalPosition("Water (3 drops)"), null);
    assert.equal(radicalPosition("inch, (2.25 cm)"), null);
    assert.equal(radicalPosition("tree, wood"), null);
});
