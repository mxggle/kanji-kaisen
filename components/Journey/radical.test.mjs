import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
    buildsOn,
    emptyJourneyNote,
    growthFormula,
    kvgGroups,
    onlyRadical,
    originText,
    pickPlacements,
    placementIn,
    radicalKana,
    radicalTitle,
    rankGrowth,
    romajiName,
    shortMeaning,
    shownNote,
    usableExamples,
    wiktionaryRevisionUrl,
} from "./radical.ts";

test("shortMeaning keeps the first plain gloss", () => {
    assert.equal(shortMeaning("tree, wood"), "tree");
    assert.equal(shortMeaning("Water (3 drops)"), "water");
    assert.equal(shortMeaning("speech/words"), "speech");
    assert.equal(shortMeaning("sun; day"), "sun");
});

test("usableExamples drops placeholder examples", () => {
    const list = [
        { char: "林", meaning: "grove", explanation: "" },
        { char: "?", meaning: "x", explanation: "" },
        { char: "森", meaning: "example", explanation: "" },
        { char: "undefined", meaning: "y", explanation: "" },
        { char: "本", meaning: "", explanation: "" },
    ];
    assert.deepEqual(usableExamples(list).map((e) => e.char), ["林"]);
    assert.deepEqual(usableExamples(), []);
});

const stage = (id, src) => ({ stage: id, src, credit: { text: "c" } });

test("shownNote names the character the stages show when it differs from the page's", () => {
    const stages = [stage("bronze", "/ancient/b.svg"), stage("seal", "/ancient/s.svg")];
    const files = [
        { char: "仌", src: "/ancient/b.svg" },
        { char: "仌", src: "/ancient/s.svg" },
        { char: "仌" },
    ];
    assert.equal(shownNote("冫", stages, files), "The bronze and seal stages show 仌, not 冫 itself.");
});

test("shownNote leaves stages of the page's own character alone", () => {
    const stages = [stage("oracle", "/ancient/o.svg"), stage("bronze", "/ancient/b.svg")];
    const files = [
        { char: "木", src: "/ancient/o.svg" },
        { char: "朩", src: "/ancient/b.svg" },
    ];
    assert.equal(shownNote("木", stages, files), "The bronze stage shows 朩, not 木 itself.");
    assert.equal(shownNote("木", [], []), "");
});

test("shownNote names each differing character with its stages", () => {
    const stages = [stage("oracle", "/o.svg"), stage("bronze", "/b.svg"), stage("seal", "/s.svg")];
    const files = [
        { char: "网", src: "/o.svg" },
        { char: "冈", src: "/b.svg" },
        { char: "罒", src: "/s.svg" },
    ];
    assert.equal(shownNote("罒", stages, files), "The oracle bone stage shows 网 and the bronze stage shows 冈, not 罒 itself.");
});

test("emptyJourneyNote names the character and the licence rule", () => {
    assert.equal(
        emptyJourneyNote("木"),
        "No ancient form of 木 passed our licence check yet. We only show forms from public-domain or CC0 sources.",
    );
});

test("wiktionaryRevisionUrl links the exact revision", () => {
    assert.equal(
        wiktionaryRevisionUrl("水", 94507192),
        "https://en.wiktionary.org/w/index.php?title=%E6%B0%B4&oldid=94507192",
    );
});

test("originText keeps sourced sentences and drops ones that lost an inline image", () => {
    assert.equal(
        originText("Semantic 士 or 王, + semantic 呂 (“two blocks of metal”) + phonetic 亼 (今). The blocks of metal were originally drawn as: and later as 丷."),
        "Semantic 士 or 王, + semantic 呂 (“two blocks of metal”) + phonetic 亼 (今).",
    );
    assert.equal(
        originText("The sun. A dot or line was added in the centre to distinguish it from visually similar characters, e.g. 口."),
        "The sun. A dot or line was added in the centre to distinguish it from visually similar characters, e.g. 口.",
    );
    assert.equal(originText("A tree: branches on top, roots on the bottom."), "A tree: branches on top, roots on the bottom.");
    assert.equal(originText("Drawn as ( ) in bronze."), "");
    assert.equal(originText(undefined), "");
});

// ------------------------------------------------------------- names, placement, growth

test("radicalKana spells the romaji name in hiragana", () => {
    assert.equal(radicalKana("Sanzui"), "さんずい");
    assert.equal(radicalKana("Ninben"), "にんべん");
    assert.equal(radicalKana("Ennyou"), "えんにょう");
    assert.equal(radicalKana("Risshinben"), "りっしんべん");
    assert.equal(radicalKana("Hi / Nichi"), "ひ / にち");
    assert.equal(radicalKana("Gen (Darkness)"), "げん");
    // Rendaku つ is づ; a plain ず stays.
    assert.equal(radicalKana("Nikuzuki"), "にくづき");
    assert.equal(radicalKana("Sunzukuri"), "すんづくり");
    assert.equal(radicalKana("Mizukara"), "みずから");
    assert.equal(radicalKana("Shitamizu"), "したみず");
});

test("romajiName and radicalTitle", () => {
    assert.equal(romajiName("Ki (Yellow)"), "ki");
    assert.equal(romajiName("Hashiru / Sou"), "hashiru / sou");
    assert.equal(radicalTitle("Water (3 drops)"), "water (3 drops)");
    assert.equal(radicalTitle("tree, wood"), "tree, wood");
});

const kvg = (hex) => fs.readFileSync(new URL(`../../public/kanjivg/kanji/${hex}.svg`, import.meta.url), "utf8");

test("kvgGroups lists the groups under the kanji with their strokes", () => {
    const groups = kvgGroups(kvg("06751")); // 村
    assert.deepEqual(
        groups.map((g) => [g.element, g.position, g.strokes]),
        [
            ["木", "left", [1, 2, 3, 4]],
            ["寸", "right", [5, 6, 7]],
        ],
    );
    assert.equal(groups[0].parent, null);
});

test("placementIn reads the radical's kvg:position", () => {
    assert.deepEqual(placementIn(kvg("06751"), ["木"]), { placement: "left", strokes: [1, 2, 3, 4] }); // 村
    assert.equal(placementIn(kvg("06848"), ["木"])?.placement, "bottom"); // 案
    assert.equal(placementIn(kvg("05e97"), ["广"])?.placement, "top-left"); // 店
    assert.equal(placementIn(kvg("06d77"), ["氵"])?.placement, "left"); // 海
});

test("placementIn calls a radical drawn twice or more repeated", () => {
    const grove = placementIn(kvg("06797"), ["木"]); // 林
    assert.equal(grove?.placement, "repeated");
    assert.deepEqual(grove?.strokes, [1, 2, 3, 4, 5, 6, 7, 8]);
    const forest = placementIn(kvg("068ee"), ["木"]); // 森
    assert.equal(forest?.placement, "repeated");
    assert.equal(forest?.strokes.length, 12);
});

test("placementIn ignores a copy that is a piece of another part", () => {
    // 催: 亻 on the left, and another 亻 inside 隹.
    assert.deepEqual(placementIn(kvg("050ac"), ["亻"]), { placement: "left", strokes: [1, 2] });
    // 準: 氵 sits inside 淮, which is on top.
    assert.equal(placementIn(kvg("06e96"), ["氵"])?.placement, "top");
});

test("placementIn gives up without a position or when the radical is split", () => {
    assert.equal(placementIn(kvg("0672c"), ["木"]), null); // 本
    assert.equal(placementIn(kvg("06771"), ["木"]), null); // 東
    assert.equal(placementIn(kvg("06751"), ["氵"]), null);
    assert.equal(placementIn("<svg/>", ["木"]), null);
});

test("pickPlacements keeps the first kanji per placement", () => {
    const hits = { 本: null, 村: "left", 相: "left", 案: "bottom", 森: "repeated", 査: "top" };
    const picked = pickPlacements(
        Object.keys(hits).map((char) => ({ char })),
        (k) => (hits[k.char] ? { placement: hits[k.char], strokes: [] } : null),
    );
    assert.deepEqual(
        picked.map((p) => [p.kanji.char, p.placement]),
        [
            ["村", "left"],
            ["案", "bottom"],
            ["森", "repeated"],
        ],
    );
});

test("buildsOn finds the radical among the sourced parts or in the text", () => {
    const forms = ["氵", "水"];
    assert.equal(buildsOn({ components: [{ char: "水", form: "氵", role: "semantic" }, { char: "每", role: "phonetic" }] }, forms), true);
    assert.equal(buildsOn({ components: [{ char: "骨", role: "semantic" }, { char: "豊", role: "phonetic" }] }, forms), false);
    assert.equal(buildsOn({ components: [], text: "A tree (木) with its bottom highlighted." }, ["木"]), true);
    assert.equal(buildsOn({ components: [], text: "A man walking." }, ["木"]), false);
});

test("growthFormula collapses repeats and writes the radical as the page does", () => {
    assert.deepEqual(growthFormula([{ char: "木" }, { char: "木" }, { char: "木" }], "木", ["木"]), [
        { char: "木", role: "meaning", radical: true, count: 3 },
    ]);
    assert.deepEqual(growthFormula([{ char: "水", role: "semantic" }, { char: "台", role: "phonetic" }], "氵", ["氵", "水"]), [
        { char: "氵", role: "meaning", radical: true, count: 1 },
        { char: "台", role: "sound", radical: false, count: 1 },
    ]);
});

test("rankGrowth puts meaning compounds and sourced sentences first", () => {
    const items = [
        { char: "校", formation: "phono-semantic-compound", text: "" },
        { char: "権", formation: "phono-semantic-compound", text: "Some sentence." },
        { char: "相", formation: "ideogrammic-compound", text: "" },
        { char: "本", formation: "ideogram", text: "A tree." },
        { char: "林", formation: null, text: "Two trees." },
    ];
    assert.deepEqual(rankGrowth(items, 3).map((i) => i.char), ["本", "林", "相"]);
    assert.deepEqual(rankGrowth(items, 10).map((i) => i.char), ["本", "林", "相", "権", "校"]);
});

test("rankGrowth puts the radical repeated before everything else", () => {
    const tree = { char: "木", role: "meaning", radical: true };
    const items = [
        { char: "本", formation: "ideogram", text: "A tree.", formula: [] },
        { char: "楽", formation: "ideogrammic-compound", text: "Strings.", formula: [{ ...tree, char: "絲", radical: false, count: 1 }, { ...tree, count: 1 }] },
        { char: "森", formation: "ideogrammic-compound", text: "Three trees.", formula: [{ ...tree, count: 3 }] },
        { char: "林", formation: null, text: "Two trees.", formula: [{ ...tree, count: 2 }] },
    ];
    assert.deepEqual(rankGrowth(items, 3).map((i) => i.char), ["森", "林", "本"]);
    assert.equal(onlyRadical([{ ...tree, count: 1 }]), false);
});
