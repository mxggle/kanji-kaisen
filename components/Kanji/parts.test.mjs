import { test } from "node:test";
import assert from "node:assert/strict";
import { isAccentRole, partPhrase, partsCaption, uniqueParts } from "./parts.ts";

test("partsCaption reads like the plan: 氵 water (meaning) + 毎 (sound)", () => {
    assert.equal(
        partsCaption([
            { char: "氵", role: "meaning", gloss: "water" },
            { char: "毎", role: "sound", gloss: "every" },
        ]),
        "氵 water (meaning) + 毎 (sound)",
    );
    assert.equal(partPhrase({ char: "木", role: "form", gloss: "tree" }), "木 tree");
    assert.equal(partPhrase({ char: "咼", role: "form", gloss: null }), "咼");
    assert.equal(partPhrase({ char: "癶", role: "both", gloss: "legs" }), "癶 legs (meaning and sound)");
});

test("uniqueParts merges repeated characters, keeping the strongest role", () => {
    const parts = [
        { char: "一", role: "form", gloss: "one" },
        { char: "一", role: "meaning", gloss: "one" },
        { char: "口", role: "form", gloss: "mouth" },
    ];
    assert.deepEqual(uniqueParts(parts).map((p) => `${p.char}:${p.role}`), ["一:meaning", "口:form"]);
});

test("isAccentRole marks meaning-bearing parts", () => {
    assert.equal(isAccentRole("meaning"), true);
    assert.equal(isAccentRole("both"), true);
    assert.equal(isAccentRole("sound"), false);
    assert.equal(isAccentRole("form"), false);
});
