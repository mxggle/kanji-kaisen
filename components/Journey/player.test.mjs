import { test } from "node:test";
import assert from "node:assert/strict";
import { journeyTabs } from "../../lib/story/journey.ts";
import { creditGroups, creditSource, journeyLede, listSeparator, stageEra } from "./player.ts";

const stage = (id, text, href) => ({ stage: id, src: `/ancient/x-${id}.png`, credit: { text, href } });

test("journeyLede counts the forms from the oldest stage", () => {
    assert.equal(journeyLede(["oracle", "bronze", "seal", "today"]), "3,000 years in four forms");
    assert.equal(journeyLede(["bronze", "seal", "today"]), "3,000 years in three forms");
    assert.equal(journeyLede(["seal", "today"]), "2,200 years in two forms");
    assert.equal(journeyLede(["today"]), "As written today");
});

test("stageEra keeps the era before the date", () => {
    assert.equal(stageEra("Shang · c. 1200 BCE"), "Shang");
    assert.equal(stageEra("Warring States · 475–221 BCE"), "Warring States");
    assert.equal(stageEra("standard form"), "standard form");
});

test("listSeparator joins with commas and a final and", () => {
    assert.deepEqual([0, 1, 2].map((i) => listSeparator(i, 3)), ["", ", ", " and "]);
    assert.deepEqual([0, 1].map((i) => listSeparator(i, 2)), ["", " and "]);
    assert.equal(listSeparator(0, 1), "");
});

test("creditSource drops the stage name", () => {
    assert.equal(creditSource("Oracle bone form: Academia Sinica 小學堂, CC0"), "Academia Sinica 小學堂, CC0");
    assert.equal(creditSource("Strokes: KanjiVG, CC BY-SA 3.0"), "KanjiVG, CC BY-SA 3.0");
    assert.equal(creditSource("no stage"), "no stage");
});

test("creditGroups groups stages by source, keeping each stage's link", () => {
    const tabs = journeyTabs("木", [
        stage("oracle", "Oracle bone form: Academia Sinica 小學堂, CC0", "https://a/1"),
        stage("bronze", "Bronze form: Wikimedia Commons, public domain", "https://c/2"),
        stage("seal", "Seal form: Academia Sinica 小學堂, CC0", "https://a/3"),
    ]);
    const groups = creditGroups(tabs);
    assert.deepEqual(
        groups.map((g) => [g.source, g.stages.map((s) => s.label)]),
        [
            ["Academia Sinica 小學堂, CC0", ["Oracle bone", "small seal"]],
            ["Wikimedia Commons, public domain", ["Bronze"]],
            ["KanjiVG, CC BY-SA 3.0", ["Today’s form"]],
        ],
    );
    assert.equal(groups[0].stages[1].href, "https://a/3");
    assert.equal(groups[2].stages[0].href, "https://kanjivg.tagaini.net/");
});

test("creditGroups with no ancient stage credits only today", () => {
    const groups = creditGroups(journeyTabs("亅", []));
    assert.equal(groups.length, 1);
    assert.equal(groups[0].stages[0].id, "today");
});
