import test from "node:test";
import assert from "node:assert/strict";

import {
    SHADE_JP,
    SHADE_NAMES,
    dayKey,
    getShade,
    migrateFromStudyList,
    paintedPercent,
    recordStep,
    sanitizeInk,
    setShade,
    shadeLabel,
    studyEntriesFromJson,
    themeProgress,
} from "./ink.ts";

// Noon UTC keeps every test day on the same local calendar day in any time zone.
const day = (n, minutes = 0) => new Date(Date.UTC(2026, 9, 1 + n, 12, minutes));

test("shade names follow 白 淡 中 濃 印", () => {
    assert.deepEqual([...SHADE_JP], ["白", "淡", "中", "濃", "印"]);
    assert.deepEqual([...SHADE_NAMES], ["Not met", "Met", "Learning", "Familiar", "Mastered"]);
    assert.equal(shadeLabel(4), "印 Mastered");
});

test("meet raises an unmet kanji to 淡 and nothing else", () => {
    const a = recordStep({}, "海", "meet", true, day(0));
    assert.equal(getShade(a, "海"), 1);
    assert.equal(recordStep(a, "海", "meet", true, day(1)), a);
    assert.equal(getShade({}, "海"), 0);
});

test("recall ok plus trace ok reaches 中 in either order", () => {
    let a = recordStep({}, "海", "meet", true, day(0));
    a = recordStep(a, "海", "recall", true, day(0));
    assert.equal(getShade(a, "海"), 1);
    a = recordStep(a, "海", "trace", true, day(0));
    assert.equal(getShade(a, "海"), 2);

    let b = recordStep({}, "山", "trace", true, day(0));
    assert.equal(getShade(b, "山"), 0);
    b = recordStep(b, "山", "recall", true, day(0));
    assert.equal(getShade(b, "山"), 2);
});

test("a wrong recall does not count toward 中", () => {
    let a = recordStep({}, "海", "recall", false, day(0));
    a = recordStep(a, "海", "trace", true, day(0));
    assert.equal(getShade(a, "海"), 0);
});

test("ok writes on two different days reach 濃; the same day twice does not", () => {
    let a = recordStep({}, "海", "write", true, day(0));
    a = recordStep(a, "海", "write", true, day(0, 20));
    assert.equal(getShade(a, "海"), 0);
    a = recordStep(a, "海", "write", true, day(1));
    assert.equal(getShade(a, "海"), 3);
});

test("an ok write 21+ days after the first ok write reaches 印", () => {
    let a = recordStep({}, "海", "write", true, day(0));
    a = recordStep(a, "海", "write", true, day(3));
    assert.equal(getShade(a, "海"), 3);
    a = recordStep(a, "海", "write", true, day(20));
    assert.equal(getShade(a, "海"), 3);
    a = recordStep(a, "海", "write", true, day(21));
    assert.equal(getShade(a, "海"), 4);
});

test("recordStep never lowers a shade", () => {
    const a = setShade({}, "海", 4, day(0));
    for (const step of ["meet", "recall", "trace", "write"]) {
        for (const ok of [true, false]) {
            assert.equal(getShade(recordStep(a, "海", step, ok, day(1)), "海"), 4, `${step} ${ok}`);
        }
    }
    const b = setShade({}, "山", 3, day(0));
    assert.equal(getShade(recordStep(b, "山", "write", false, day(30)), "山"), 3);
    assert.equal(getShade(recordStep(b, "山", "meet", true, day(30)), "山"), 3);
});

test("wrong answers change nothing at all", () => {
    const a = recordStep({}, "海", "meet", true, day(0));
    assert.equal(recordStep(a, "海", "recall", false, day(1)), a);
    assert.equal(recordStep(a, "海", "write", false, day(1)), a);
});

test("setShade can raise or lower, and lowering drops higher evidence", () => {
    let a = recordStep({}, "海", "recall", true, day(0));
    a = recordStep(a, "海", "trace", true, day(0));
    assert.equal(getShade(a, "海"), 2);
    a = setShade(a, "海", 4, day(1));
    assert.equal(getShade(a, "海"), 4);
    a = setShade(a, "海", 1, day(2));
    assert.equal(getShade(a, "海"), 1);
    // The old recall/trace no longer count: a new trace alone stays at 淡.
    assert.equal(getShade(recordStep(a, "海", "trace", true, day(3)), "海"), 1);
    assert.deepEqual(setShade(a, "海", 0, day(3)), {});
    assert.equal(setShade(a, "海", 1, day(3)), a);
});

test("themeProgress sums shades over distinct kanji", () => {
    let e = setShade({}, "海", 4);
    e = setShade(e, "川", 3);
    e = setShade(e, "池", 1);
    assert.deepEqual(themeProgress(e, ["海", "川", "池", "泳", "海"]), { painted: 8 / 16, known: 2, met: 3, total: 4 });
    assert.deepEqual(themeProgress(e, []), { painted: 0, known: 0, met: 0, total: 0 });
    assert.equal(themeProgress({}, ["海"]).painted, 0);
});

test("paintedPercent keeps a little ink visible and never claims 100 early", () => {
    assert.equal(paintedPercent(0), 0);
    assert.equal(paintedPercent(0.001), 1);
    assert.equal(paintedPercent(0.38), 38);
    assert.equal(paintedPercent(0.999), 99);
    assert.equal(paintedPercent(1), 100);
});

test("migration maps known → 濃 and learning → 中 without lowering", () => {
    const study = {
        海: { status: "known", addedAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z" },
        山: { status: "learning", addedAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" },
        川: { status: "learning", addedAt: "x", updatedAt: "x" },
        木: { status: "unknown" },
        火: null,
    };
    const existing = setShade({}, "川", 4, day(0));
    const out = migrateFromStudyList(existing, study, day(5));
    assert.equal(getShade(out, "海"), 3);
    assert.equal(out.海.updatedAt, "2026-10-02T00:00:00.000Z");
    assert.equal(getShade(out, "山"), 2);
    assert.equal(getShade(out, "川"), 4);
    assert.equal(getShade(out, "木"), 0);
    assert.equal(getShade(out, "火"), 0);
    assert.equal(migrateFromStudyList(existing, null), existing);
});

test("studyEntriesFromJson reads the persisted study list", () => {
    const raw = JSON.stringify({ state: { entries: { 海: { status: "known" } } }, version: 1 });
    assert.deepEqual(studyEntriesFromJson(raw), { 海: { status: "known" } });
    assert.equal(studyEntriesFromJson(null), null);
    assert.equal(studyEntriesFromJson("not json"), null);
    assert.equal(studyEntriesFromJson("null"), null);
});

test("sanitizeInk drops malformed entries", () => {
    const out = sanitizeInk({
        海: { shade: 3, updatedAt: "t", writeDays: ["a", 1, "b", "c"], recall: true, trace: "yes" },
        山: { shade: 7, updatedAt: "t" },
        川: { shade: 0, updatedAt: "t" },
        木: { shade: 2 },
        火: "x",
    });
    assert.deepEqual(out, { 海: { shade: 3, updatedAt: "t", recall: true, writeDays: ["a", "b"] } });
    assert.deepEqual(sanitizeInk(null), {});
});

test("dayKey uses the local calendar day", () => {
    const d = new Date(2026, 0, 5, 23, 59);
    assert.equal(dayKey(d), "2026-01-05");
});
