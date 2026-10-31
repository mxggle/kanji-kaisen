import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createStory, extractStrokePaths } from "./core.ts";
import { journeyTabs, stageWhen, creditText } from "./journey.ts";
import { kanjivgFileName } from "../atlas/kanjivg-svg.ts";

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
const ancient = readJson("lib/core/ancient-forms.json");
const etymology = readJson("lib/core/etymology.wiktionary.json");

const file = (over) => ({
    url: "https://commons.wikimedia.org/wiki/File:x.svg",
    author: "A",
    license: "PD",
    revid: 1,
    sha1: "0",
    fetched: "2026-10-31",
    ...over,
});
const FIXTURE = {
    about: {},
    files: {
        "學-oracle-2.svg": file({ stage: "oracle", char: "學", license: "CC0", source: "Academia Sinica 小學堂 41.F2ED", src: "/ancient/05b78-oracle.svg" }),
        "學-bronze.svg": file({ stage: "bronze", char: "學", period: "western-zhou", src: "/ancient/05b78-bronze.svg" }),
        "學-silk.svg": file({ stage: "silk", char: "學" }),
        "肉-oracle.svg": file({ stage: "oracle", char: "肉", src: "/ancient/08089-oracle.svg" }),
        "月-oracle.svg": file({ stage: "oracle", char: "月", src: "/ancient/06708-oracle.svg" }),
    },
    chars: {
        学: { etymon: "學", bronze: "學-bronze.svg", oracle: "學-oracle-2.svg", other: ["學-silk.svg"] },
        月: { etymon: "月", oracle: "月-oracle.svg" },
    },
    radicals: { nikuzuki: { etymon: "肉", oracle: "肉-oracle.svg" } },
};
const ETYM = {
    about: {},
    entries: { 月: { page: "月", url: "u", revid: 1, section: "Chinese", formation: "pictogram", components: [] } },
    radicals: { nikuzuki: { page: "肉", url: "v", revid: 2, section: "Chinese", formation: "pictogram", components: [] } },
};

test("getAncientForms orders shown stages and credits each file", () => {
    const story = createStory(FIXTURE, ETYM);
    const forms = story.getAncientForms("学");
    assert.equal(forms.etymon, "學");
    assert.deepEqual(
        forms.stages.map((s) => [s.stage, s.src, s.when]),
        [
            ["oracle", "/ancient/05b78-oracle.svg", "Shang · c. 1200 BCE"],
            ["bronze", "/ancient/05b78-bronze.svg", "Western Zhou · c. 1000 BCE"],
        ],
    );
    assert.deepEqual(forms.stages[0].credit, {
        text: "Oracle bone form: Wikimedia Commons, traced from Academia Sinica, CC0",
        href: "https://commons.wikimedia.org/wiki/File:x.svg",
    });
    assert.equal(forms.stages[1].credit.text, "Bronze form: Wikimedia Commons, public domain");
    assert.deepEqual(forms.files.map((f) => f.name), ["學-oracle-2.svg", "學-bronze.svg", "學-silk.svg"]);
    assert.equal(story.getAncientForms("木"), null);
});

test("radical lookups use the radical's own entry when it has one", () => {
    const story = createStory(FIXTURE, ETYM);
    assert.equal(story.getRadicalAncientForms("nikuzuki", "月").etymon, "肉");
    assert.equal(story.getRadicalAncientForms("tsuki", "月").etymon, "月");
    assert.equal(story.getRadicalEtymology("nikuzuki", "月").page, "肉");
    assert.equal(story.getRadicalEtymology("tsuki", "月").page, "月");
    assert.equal(story.getEtymology("木"), null);
    assert.deepEqual(story.getAncientFormCredits().map((f) => f.name).slice(0, 2), ["學-bronze.svg", "學-oracle-2.svg"]);
});

test("journeyTabs renders zero, one or three ancient stages, then today", () => {
    const stage = (s) => ({ stage: s, src: `/ancient/x-${s}.svg`, credit: { text: s } });
    assert.deepEqual(journeyTabs("木", []).map((t) => t.id), ["today"]);
    assert.deepEqual(journeyTabs("木", [stage("bronze")]).map((t) => t.id), ["bronze", "today"]);
    const three = journeyTabs("木", [stage("seal"), stage("oracle"), stage("bronze"), stage("oracle")], { today: "Now." });
    assert.deepEqual(three.map((t) => t.id), ["oracle", "bronze", "seal", "today"]);
    assert.equal(three[3].caption, "Now.");
    assert.equal(three[0].when, "Shang · c. 1200 BCE");
    assert.equal(three[3].credit.text, "Strokes: KanjiVG, CC BY-SA 3.0");
    assert.equal(stageWhen("bronze", "warring-states"), "Warring States · 475–221 BCE");
    assert.equal(stageWhen("seal", "shang"), "Qin · 221 BCE");
    assert.equal(creditText("seal", "PD", false), "Seal form: Wikimedia Commons, public domain");
});

test("extractStrokePaths reads KanjiVG strokes in order", () => {
    const raw = fs.readFileSync(path.join(process.cwd(), "public", "kanjivg", "kanji", kanjivgFileName("木")), "utf8");
    const paths = extractStrokePaths(raw);
    assert.equal(paths.length, 4);
    assert.match(paths[0], /^M\d/);
    assert.deepEqual(extractStrokePaths("<svg></svg>"), []);
});

// ---- the committed data

test("every kept Commons file has a license, author, URL and revision; shown files exist", () => {
    const names = Object.keys(ancient.files);
    assert.ok(names.length > 0);
    for (const name of names) {
        const f = ancient.files[name];
        assert.ok(["PD", "CC0"].includes(f.license), name);
        assert.ok(f.author && f.revid && f.sha1 && /^\d{4}-\d{2}-\d{2}$/.test(f.fetched), name);
        assert.ok(f.url.startsWith("https://commons.wikimedia.org/wiki/File:"), name);
        if (f.license === "CC0") assert.match(f.source, /^Academia Sinica 小學堂 \d+\.[0-9A-F]+$/, name);
        if (f.src) {
            const svg = fs.readFileSync(path.join(process.cwd(), "public", f.src), "utf8");
            assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[-\d. ]+" fill="currentColor">/, name);
            assert.doesNotMatch(svg, /script|href|on\w+=|url\(|<style|<image|<foreign/i, name);
        }
    }
    for (const [char, entry] of [...Object.entries(ancient.chars), ...Object.entries(ancient.radicals)]) {
        for (const name of [entry.oracle, entry.bronze, entry.seal, ...(entry.other ?? [])].filter(Boolean)) {
            assert.ok(ancient.files[name], `${char}: ${name}`);
        }
    }
});

test("every etymology entry has a page URL and revision ID", () => {
    const all = [...Object.values(etymology.entries), ...Object.values(etymology.radicals)];
    assert.ok(all.length > 500);
    for (const e of all) {
        assert.match(e.url, /^https:\/\/en\.wiktionary\.org\/wiki\//);
        assert.ok(Number.isInteger(e.revid) && e.revid > 0);
        assert.ok(e.formation || e.components.length || e.text);
    }
});

test("木 is a pictogram and 休 an ideogrammic compound of 人 + 木", () => {
    const story = createStory(ancient, etymology);
    assert.equal(story.getEtymology("木").formation, "pictogram");
    const xiu = story.getEtymology("休");
    assert.equal(xiu.formation, "ideogrammic-compound");
    assert.deepEqual(xiu.components.map((c) => c.char), ["人", "木"]);
    const hai = story.getEtymology("海");
    assert.equal(hai.formation, "phono-semantic-compound");
    assert.deepEqual(hai.components.map((c) => [c.form ?? c.char, c.role]), [["氵", "semantic"], ["每", "phonetic"]]);
});
