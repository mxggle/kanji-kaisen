import { test } from "node:test";
import assert from "node:assert/strict";
import { etymologyView, journeyCaptions } from "./story.ts";

const entry = (over) => ({
    page: "海",
    url: "https://en.wiktionary.org/wiki/%E6%B5%B7",
    revid: 93388184,
    section: "Chinese",
    formation: null,
    components: [],
    ...over,
});

test("etymologyView labels the formation and keeps the components", () => {
    const view = etymologyView(
        entry({
            formation: "phono-semantic-compound",
            components: [
                { char: "水", form: "氵", role: "semantic", gloss: "water" },
                { char: "每", role: "phonetic" },
            ],
        }),
    );
    assert.equal(view.formation, "Phono-semantic compound (形聲)");
    assert.equal(view.parts.length, 2);
    assert.equal(view.text, null);
    assert.equal(view.lang, "zh-Hant");
    assert.equal(view.revid, 93388184);
});

test("etymologyView is null when nothing is showable", () => {
    assert.equal(etymologyView(null), null);
    assert.equal(etymologyView(entry({})), null);
    const ja = etymologyView(entry({ section: "Japanese", text: "Made in Japan." }));
    assert.equal(ja.lang, "ja");
    assert.equal(ja.formation, null);
});

const stages = [
    { stage: "oracle", src: "/ancient/05b78-oracle.svg", credit: { text: "x" } },
    { stage: "seal", src: "/ancient/06586-seal.svg", credit: { text: "y" } },
];
const files = [
    { char: "學", src: "/ancient/05b78-oracle.svg" },
    { char: "斆", src: "/ancient/06586-seal.svg" },
];

test("journeyCaptions name the etymon and the redirected file", () => {
    const captions = journeyCaptions("学", "學", stages, files, "Two hands and a building.", "𦥯 (sound) + 子 child (meaning)");
    assert.equal(captions.oracle, "Oracle bone form of 學, the older form of 学. Two hands and a building.");
    assert.match(captions.seal, /^Seal form filed under 斆 on Wikimedia Commons\. /);
    assert.equal(captions.today, "Today: 𦥯 (sound) + 子 child (meaning).");
});

test("journeyCaptions keep plain captions for the kanji's own forms", () => {
    const own = [{ stage: "oracle", src: "/a.svg", credit: { text: "x" } }];
    const captions = journeyCaptions("休", "休", own, [{ char: "休", src: "/a.svg" }], "A man leaning against a tree, resting.", null);
    assert.equal(captions.oracle, "A man leaning against a tree, resting.");
    assert.equal(captions.today, undefined);
});
