import test from "node:test";
import assert from "node:assert/strict";

import {
    meaningLabel,
    parseJlpt,
    parseStudyParams,
    sessionRanges,
    shuffled,
    studyPath,
    toQuizCandidate,
    uniqueChars,
} from "./session.ts";

test("parses deck params with deck > jlpt > radical > theme precedence", () => {
    assert.deepEqual(parseStudyParams({}), { request: null, invalid: false, mode: null });
    assert.deepEqual(parseStudyParams({ deck: "list" }).request, { kind: "list" });
    assert.deepEqual(parseStudyParams({ deck: "Learning", mode: "quiz" }), { request: { kind: "learning" }, invalid: false, mode: "quiz" });
    assert.deepEqual(parseStudyParams({ jlpt: "n4" }).request, { kind: "jlpt", level: "N4" });
    assert.deepEqual(parseStudyParams({ radical: "sanzui", theme: "x" }).request, { kind: "radical", key: "sanzui" });
    assert.deepEqual(parseStudyParams({ theme: "Nature-Elements" }).request, { kind: "theme", slug: "nature-elements" });
    assert.deepEqual(parseStudyParams({ jlpt: ["N5", "N1"] }).request, { kind: "jlpt", level: "N5" });
});

test("flags unknown deck values and ignores unknown modes", () => {
    assert.equal(parseStudyParams({ deck: "everything" }).invalid, true);
    assert.equal(parseStudyParams({ jlpt: "N9" }).invalid, true);
    assert.equal(parseStudyParams({ deck: "list", mode: "hearts" }).mode, null);
    assert.equal(parseJlpt("5"), "N5");
    assert.equal(parseJlpt("N0"), null);
});

test("parses a chars deck after the other params, validated and capped at 60", () => {
    assert.deepEqual(parseStudyParams({ chars: "海泳" }), { request: { kind: "chars", chars: ["海", "泳"] }, invalid: false, mode: null });
    assert.deepEqual(parseStudyParams({ chars: "海x海 泳!", mode: "quiz" }), { request: { kind: "chars", chars: ["海", "泳"] }, invalid: false, mode: "quiz" });
    assert.deepEqual(parseStudyParams({ chars: "海", t: "  Lesson 7 " }).request, { kind: "chars", chars: ["海"], title: "Lesson 7" });
    assert.deepEqual(parseStudyParams({ theme: "time-sequence", chars: "海" }).request, { kind: "theme", slug: "time-sequence" }, "existing params win");
    assert.deepEqual(parseStudyParams({ jlpt: "N5", chars: "海" }).request, { kind: "jlpt", level: "N5" });
    assert.equal(parseStudyParams({ chars: "abc" }).invalid, true, "no kanji at all is an invalid deck");
    const many = Array.from({ length: 80 }, (_, i) => String.fromCodePoint(0x4e00 + i)).join("");
    assert.equal(parseStudyParams({ chars: many }).request.chars.length, 60);
    assert.equal(parseStudyParams({ chars: "海", t: "x".repeat(200) }).request.title.length, 80);
});

test("study paths round-trip through the parser", () => {
    const requests = [
        { kind: "list" },
        { kind: "learning" },
        { kind: "jlpt", level: "N2" },
        { kind: "radical", key: "sanzui" },
        { kind: "theme", slug: "time-sequence" },
        { kind: "chars", chars: ["海", "泳"] },
        { kind: "chars", chars: ["𠮟"], title: "Lesson 7 · words" },
    ];
    for (const request of requests) {
        const path = studyPath(request, "flashcards");
        const params = Object.fromEntries(new URLSearchParams(path.split("?")[1]));
        assert.deepEqual(parseStudyParams(params), { request, invalid: false, mode: "flashcards" });
    }
    assert.equal(studyPath(null), "/study");
    assert.equal(studyPath(null, "quiz"), "/study?mode=quiz");
});

test("splits decks into session-size chunks", () => {
    assert.deepEqual(sessionRanges(0), []);
    assert.deepEqual(sessionRanges(3), [{ start: 0, end: 3, label: "1–3" }]);
    const ranges = sessionRanges(41, 20);
    assert.deepEqual(ranges.map((r) => r.label), ["1–20", "21–40", "41"]);
    assert.equal(sessionRanges(1233).length, 62);
});

test("shuffles deterministically without losing cards", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const a = shuffled(items, 42);
    assert.deepEqual(a, shuffled(items, 42));
    assert.notDeepEqual(a, items);
    assert.deepEqual([...a].sort((x, y) => x - y), items);
    assert.deepEqual(items[0], 0, "input is not mutated");
});

test("builds quiz candidates from slim index entries", () => {
    const entry = { c: "海", m: ["sea", "ocean", "marine", "extra"], on: ["カイ"], kun: ["うみ"], j: 4, s: 9, f: 200 };
    assert.equal(meaningLabel(entry.m), "sea, ocean, marine");
    assert.deepEqual(toQuizCandidate(entry, "Nature & Elements"), {
        char: "海",
        meaning: "sea, ocean, marine",
        jlpt: "N4",
        strokeCount: 9,
        category: "Nature & Elements",
    });
    assert.deepEqual(uniqueChars(["a", "b", "a"]), ["a", "b"]);
});

test("a chars deck drops unknown kanji before the 60 cap", () => {
    const rare = "丨".repeat(1) + Array.from({ length: 60 }, (_, i) => String.fromCodePoint(0x4e00 + 200 + i)).join("");
    const known = new Set(["海", "泳"]);
    assert.deepEqual(parseStudyParams({ chars: rare + "海泳" }, known).request, { kind: "chars", chars: ["海", "泳"] });
    assert.equal(parseStudyParams({ chars: rare }, known).invalid, true);
});
