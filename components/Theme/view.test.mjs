import { test } from "node:test";
import assert from "node:assert/strict";
import { levelCounts, radicalGloss, ringNeighbours } from "./view.ts";

test("radicalGloss keeps the first plain gloss, lower-cased", () => {
    assert.equal(radicalGloss("Water (3 drops)"), "water");
    assert.equal(radicalGloss("hill, village, mound (left form)"), "hill");
    assert.equal(radicalGloss("inch, (2.25 cm)"), "inch");
    assert.equal(radicalGloss("rain (top radical)"), "rain");
    assert.equal(radicalGloss("tree, wood"), "tree");
    assert.equal(radicalGloss("steam/air"), "steam");
});

test("radicalGloss leaves acronyms and empty meanings alone", () => {
    assert.equal(radicalGloss("UFO, saucer"), "UFO");
    assert.equal(radicalGloss(""), "");
});

test("ringNeighbours wraps at both ends", () => {
    const list = ["a", "b", "c"];
    assert.deepEqual(ringNeighbours(list, "b"), { prev: "a", next: "c" });
    assert.deepEqual(ringNeighbours(list, "a"), { prev: "c", next: "b" });
    assert.deepEqual(ringNeighbours(list, "c"), { prev: "b", next: "a" });
});

test("ringNeighbours is null for a missing item or a list of one", () => {
    assert.equal(ringNeighbours(["a", "b"], "z"), null);
    assert.equal(ringNeighbours(["a"], "a"), null);
});

test("levelCounts counts per level, N5 first, without empty levels", () => {
    assert.deepEqual(levelCounts(["N1", "N5", "N1", "N3", "N5", "N1"]), [
        { level: "N5", count: 2 },
        { level: "N3", count: 1 },
        { level: "N1", count: 3 },
    ]);
    assert.deepEqual(levelCounts([]), []);
});
