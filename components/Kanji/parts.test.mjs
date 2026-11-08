import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCaptionText, buildClauses, isAccentRole, joinChars, partLine, partNote, partPhrase, partsCaption, uniqueParts } from "./parts.ts";

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

test("buildClauses says what each part does, by role", () => {
    const rest = [
        { char: "亻", role: "meaning", gloss: "person" },
        { char: "木", role: "form", gloss: "tree" },
    ];
    assert.equal(buildCaptionText(rest), "亻 carries the meaning · 木 is drawn in");
    const sea = [
        { char: "氵", role: "meaning", gloss: "water" },
        { char: "毎", role: "sound", gloss: null },
    ];
    assert.deepEqual(buildClauses(sea).map((c) => c.line), ["meaning", "sound"]);
    assert.equal(buildCaptionText(sea), "氵 carries the meaning · 毎 gives the sound");
});

test("buildClauses groups parts that share a role and merges repeats", () => {
    const parts = [
        { char: "口", role: "form", gloss: "mouth" },
        { char: "木", role: "form", gloss: "tree" },
        { char: "口", role: "form", gloss: "mouth" },
        { char: "癶", role: "both", gloss: "legs" },
    ];
    assert.equal(buildCaptionText(parts), "癶 carries meaning and sound · 口 and 木 are drawn in");
    assert.equal(joinChars(["一", "口", "木"]), "一, 口 and 木");
});

test("partLine and partNote follow rule 2", () => {
    assert.equal(partLine("both"), "meaning");
    assert.equal(partLine("sound"), "sound");
    assert.equal(partNote("both"), "meaning · sound");
    assert.equal(partNote("form"), "form");
});
