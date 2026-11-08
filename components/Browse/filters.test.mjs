import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    applyBrowseFilters,
    DEFAULT_FILTERS,
    filterTags,
    levelCounts,
    MAX_LINK_KANJI,
    parseBrowseParams,
    readingKey,
    setTitle,
    studyLink,
    teachLink,
    THEME_SLUGS,
    toBrowseKanji,
    toBrowseQuery,
    withStrokes,
} from "./filters.ts";

const atlas = JSON.parse(readFileSync(new URL("../../lib/atlas/kanji-atlas.json", import.meta.url), "utf8"));
const items = atlas.kanji.map(toBrowseKanji);

/** parse → serialize → parse gives the same filters and the same query. */
function roundTrips(filters) {
    const query = toBrowseQuery(filters);
    const again = parseBrowseParams(Object.fromEntries(new URLSearchParams(query)));
    assert.deepEqual(again, filters);
    assert.equal(toBrowseQuery(again), query);
    return query;
}

test("no params gives the defaults and an empty query", () => {
    assert.deepEqual(parseBrowseParams({}), DEFAULT_FILTERS);
    assert.equal(toBrowseQuery(DEFAULT_FILTERS), "");
});

test("params round-trip through the query string", () => {
    const filters = parseBrowseParams({ jlpt: "n4,N5", sort: "strokes", min: "1", max: "10", theme: "nature-elements" });
    assert.deepEqual(filters.jlpt, ["N5", "N4"]);
    assert.equal(roundTrips(filters), "?jlpt=N5,N4&max=10&sort=strokes&theme=nature-elements");
});

test("every filter round-trips at once", () => {
    const filters = parseBrowseParams({
        jlpt: "N3",
        min: "4",
        max: "12",
        sort: "frequency",
        theme: "time-sequence,nature-elements",
        radical: "sanzui",
        ink: "1,0",
        reading: "Sei",
    });
    assert.equal(
        roundTrips(filters),
        "?jlpt=N3&min=4&max=12&sort=frequency&theme=nature-elements,time-sequence&radical=sanzui&ink=0,1&reading=sei",
    );
});

test("invalid params fall back to defaults", () => {
    const f = parseBrowseParams({ jlpt: "N9", sort: "random", min: "abc", max: "99", theme: "<script>", ink: "x", reading: "<b>" });
    assert.deepEqual(f, { ...DEFAULT_FILTERS, maxStrokes: 30 });
    assert.deepEqual(parseBrowseParams({ min: "12", max: "3" }).minStrokes, 3);
    assert.deepEqual(parseBrowseParams({ jlpt: "N1,N2,N3,N4,N5" }).jlpt, []);
    assert.deepEqual(parseBrowseParams({ jlpt: ["N3", "N2"] }).jlpt, ["N3"]);
});

test("theme= still reads a single slug", () => {
    const filters = parseBrowseParams({ theme: "nature-elements" });
    assert.deepEqual(filters.themes, ["nature-elements"]);
    assert.equal(roundTrips(filters), "?theme=nature-elements");
});

test("theme= reads a comma list in path order, without repeats", () => {
    const filters = parseBrowseParams({ theme: "time-sequence, Nature-Elements,time-sequence" });
    assert.deepEqual(filters.themes, ["nature-elements", "time-sequence"]);
    assert.equal(roundTrips(filters), "?theme=nature-elements,time-sequence");
});

test("theme= drops unknown slugs", () => {
    assert.deepEqual(parseBrowseParams({ theme: "dragons" }).themes, []);
    assert.deepEqual(parseBrowseParams({ theme: "dragons,animals-wildlife,,nature" }).themes, ["animals-wildlife"]);
    assert.deepEqual(parseBrowseParams({ theme: ["animals-wildlife", "nature-elements"] }).themes, ["animals-wildlife"]);
    assert.equal(THEME_SLUGS.length, 10);
});

test("ink= reads shades 0–4, sorted and unique", () => {
    assert.deepEqual(parseBrowseParams({ ink: "0" }).ink, [0]);
    assert.deepEqual(parseBrowseParams({ ink: "3,0,1,3" }).ink, [0, 1, 3]);
    assert.equal(roundTrips(parseBrowseParams({ ink: "4, 2" })), "?ink=2,4");
});

test("ink= drops junk values", () => {
    assert.deepEqual(parseBrowseParams({ ink: "5,-1,1.5,a,01,,  " }).ink, []);
    assert.deepEqual(parseBrowseParams({ ink: "9,2,two" }).ink, [2]);
    assert.deepEqual(parseBrowseParams({ ink: "" }).ink, []);
    // All five shades is the same as no ink filter.
    assert.deepEqual(parseBrowseParams({ ink: "0,1,2,3,4" }).ink, []);
});

test("reading= keeps kana and romaji, and drops anything else", () => {
    assert.equal(parseBrowseParams({ reading: " セイ " }).reading, "セイ");
    assert.equal(parseBrowseParams({ reading: "YASU" }).reading, "yasu");
    assert.equal(parseBrowseParams({ reading: "やす.む" }).reading, "やす.む");
    assert.equal(parseBrowseParams({ reading: "水" }).reading, null);
    assert.equal(parseBrowseParams({ reading: "a".repeat(40) }).reading, null);
    assert.equal(readingKey("sei"), "せい");
    assert.equal(readingKey("セイ"), "せい");
    assert.equal(readingKey("kō"), "こう");
    assert.equal(readingKey("sh"), null);
});

test("ink filter applies only with a shade lookup", () => {
    const filters = parseBrowseParams({ ink: "3,4" });
    assert.equal(applyBrowseFilters(items, filters).length, items.length);
    const shades = { 日: 3, 一: 4, 人: 1 };
    const shadeOf = (char) => shades[char] ?? 0;
    assert.deepEqual(applyBrowseFilters(items, filters, { shadeOf }).map((k) => k.char).sort(), ["一", "日"].sort());
    const notMet = applyBrowseFilters(items, parseBrowseParams({ ink: "0" }), { shadeOf });
    assert.equal(notMet.length, items.length - 3);
});

test("JLPT filter keeps only the chosen levels", () => {
    const n5 = applyBrowseFilters(items, parseBrowseParams({ jlpt: "N5" }));
    assert.ok(n5.length > 50);
    assert.ok(n5.every((k) => k.jlpt === "N5"));
    assert.ok(n5.some((k) => k.char === "日"));
});

test("several themes combine as either-or", () => {
    const nature = applyBrowseFilters(items, parseBrowseParams({ theme: "nature-elements" }));
    const animals = applyBrowseFilters(items, parseBrowseParams({ theme: "animals-wildlife" }));
    const both = applyBrowseFilters(items, parseBrowseParams({ theme: "nature-elements,animals-wildlife" }));
    assert.equal(both.length, nature.length + animals.length);
    assert.ok(both.every((k) => k.theme === "nature-elements" || k.theme === "animals-wildlife"));
});

test("stroke range, theme and radical filters combine", () => {
    const f = parseBrowseParams({ min: "3", max: "5", theme: "nature-elements" });
    const out = applyBrowseFilters(items, f);
    assert.ok(out.length > 0);
    assert.ok(out.every((k) => k.strokeCount >= 3 && k.strokeCount <= 5 && k.theme === "nature-elements"));
    const sanzui = applyBrowseFilters(items, parseBrowseParams({ radical: "sanzui" }));
    assert.ok(sanzui.some((k) => k.char === "海"));
    assert.ok(sanzui.every((k) => k.radical === "sanzui"));
});

test("reading filter matches on'yomi, kun'yomi and kun stems", () => {
    const sei = applyBrowseFilters(items, parseBrowseParams({ reading: "sei" })).map((k) => k.char);
    assert.ok(sei.includes("青") && sei.includes("生") && sei.includes("晴"));
    assert.deepEqual(applyBrowseFilters(items, parseBrowseParams({ reading: "セイ" })).map((k) => k.char), sei);
    const yasu = applyBrowseFilters(items, parseBrowseParams({ reading: "やす" })).map((k) => k.char);
    assert.ok(yasu.includes("休") && yasu.includes("安"));
    assert.ok(applyBrowseFilters(items, parseBrowseParams({ reading: "yasumu" })).some((k) => k.char === "休"));
    assert.equal(applyBrowseFilters(items, parseBrowseParams({ reading: "sh" })).length, 0);
});

test("level counts leave the JLPT filter out", () => {
    const filters = parseBrowseParams({ jlpt: "N5", theme: "nature-elements" });
    const counts = levelCounts(items, filters);
    const nature = applyBrowseFilters(items, parseBrowseParams({ theme: "nature-elements" }));
    assert.equal(counts.all, nature.length);
    assert.equal(counts.N5, applyBrowseFilters(items, filters).length);
    assert.equal(counts.N5 + counts.N4 + counts.N3 + counts.N2 + counts.N1, counts.all);
});

test("stroke bounds clamp, and the bound that moved wins", () => {
    const f = parseBrowseParams({ min: "3", max: "10" });
    assert.deepEqual([withStrokes(f, { minStrokes: 12 }).minStrokes, withStrokes(f, { minStrokes: 12 }).maxStrokes], [12, 12]);
    assert.deepEqual([withStrokes(f, { maxStrokes: 2 }).minStrokes, withStrokes(f, { maxStrokes: 2 }).maxStrokes], [2, 2]);
    assert.equal(withStrokes(f, { maxStrokes: 99 }).maxStrokes, 30);
    assert.equal(withStrokes(f, { minStrokes: 0 }).minStrokes, 1);
});

test("filter tags name each value and remove only it", () => {
    const filters = parseBrowseParams({ jlpt: "N5,N4", theme: "nature-elements", ink: "1", min: "3", radical: "sanzui", reading: "sei" });
    const tags = filterTags(filters, (key) => (key === "sanzui" ? "氵 water" : null));
    assert.deepEqual(tags.map((t) => t.label), ["N5", "N4", "Nature", "淡 Met", "3+ strokes", "氵 water", "Read sei"]);
    assert.equal(tags[2].theme, "Nature & Elements");
    assert.equal(tags[3].shade, 1);
    assert.deepEqual(tags[0].without.jlpt, ["N4"]);
    assert.equal(tags[4].without.minStrokes, 1);
    assert.deepEqual(filterTags(DEFAULT_FILTERS), []);
    assert.equal(filterTags(parseBrowseParams({ max: "10" }))[0].label, "Up to 10 strokes");
    assert.equal(filterTags(parseBrowseParams({ min: "4", max: "4" }))[0].label, "4 strokes");
});

test("study links open a whole deck when the filters are one, else the first 60", () => {
    const chars = items.map((k) => k.char);
    assert.equal(studyLink(parseBrowseParams({ jlpt: "N5", sort: "strokes" }), chars.slice(0, 80), "N5").href, "/study?jlpt=N5");
    assert.equal(studyLink(parseBrowseParams({ theme: "nature-elements" }), chars, "Nature").href, "/study?theme=nature-elements");
    assert.equal(studyLink(parseBrowseParams({ radical: "sanzui" }), chars, "氵").href, "/study?radical=sanzui");

    const mixed = studyLink(parseBrowseParams({ jlpt: "N5", theme: "nature-elements" }), chars, "N5 · Nature");
    assert.equal(mixed.count, MAX_LINK_KANJI);
    assert.ok(mixed.capped);
    const url = new URL(mixed.href, "https://example.test");
    assert.equal(url.pathname, "/study");
    assert.equal(url.searchParams.get("chars"), chars.slice(0, 60).join(""));
    assert.equal(url.searchParams.get("t"), "N5 · Nature");

    const small = studyLink(parseBrowseParams({ ink: "4" }), ["日", "一"], "印 Mastered");
    assert.equal(small.count, 2);
    assert.equal(small.capped, false);

    const sheet = teachLink(chars, "All kanji");
    assert.equal(new URL(sheet.href, "https://example.test").searchParams.get("k"), chars.slice(0, 60).join(""));
    assert.ok(sheet.capped);
});

test("set titles list the filters", () => {
    assert.equal(setTitle(DEFAULT_FILTERS), "All kanji");
    assert.equal(setTitle(parseBrowseParams({ jlpt: "N5", theme: "nature-elements,time-sequence" })), "N5 · Nature · Time");
});

test("sorts by strokes and by frequency", () => {
    const byStrokes = applyBrowseFilters(items, parseBrowseParams({ sort: "strokes" }));
    for (let i = 1; i < byStrokes.length; i++) assert.ok(byStrokes[i - 1].strokeCount <= byStrokes[i].strokeCount);
    const byFreq = applyBrowseFilters(items, parseBrowseParams({ sort: "frequency" }));
    assert.equal(byFreq[0].char, "日");
    assert.equal(byFreq.at(-1).frequency, null);
});

test("default sort is N5 first", () => {
    const all = applyBrowseFilters(items, DEFAULT_FILTERS);
    assert.equal(all.length, items.length);
    assert.equal(all[0].jlpt, "N5");
    assert.equal(all.at(-1).jlpt, "N1");
});

test("slim records carry no examples and at most two meanings", () => {
    const sea = items.find((k) => k.char === "海");
    assert.deepEqual(Object.keys(sea).sort(), ["char", "frequency", "jlpt", "kunyomi", "meanings", "onyomi", "radical", "readings", "strokeCount", "theme"]);
    assert.ok(sea.meanings.length <= 2);
    assert.equal(items.find((k) => k.char === "休").readings, "きゅう やすむ やす やすまる やすめる");
});

test("radical keys with underscores survive a round trip", () => {
    const filters = parseBrowseParams({ radical: "hi_fire" });
    assert.equal(filters.radical, "hi_fire");
    assert.equal(roundTrips(filters), "?radical=hi_fire");
});
