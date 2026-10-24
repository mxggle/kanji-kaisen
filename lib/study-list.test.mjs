import test from "node:test";
import assert from "node:assert/strict";

import { countByStatus, listSaved, sanitizeEntries, saveKanji, setStatus, toggleSaved, unsaveKanji } from "./study-list.ts";

const t1 = new Date("2026-10-24T10:00:00Z");
const t2 = new Date("2026-10-24T11:00:00Z");

test("saveKanji adds a learning entry once", () => {
    const a = saveKanji({}, "海", t1);
    assert.deepEqual(a, { 海: { status: "learning", addedAt: t1.toISOString(), updatedAt: t1.toISOString() } });
    assert.equal(saveKanji(a, "海", t2), a);
});

test("unsaveKanji and toggleSaved remove and re-add", () => {
    const a = saveKanji({}, "海", t1);
    assert.deepEqual(unsaveKanji(a, "海"), {});
    assert.equal(unsaveKanji({}, "海").海, undefined);
    assert.deepEqual(toggleSaved(a, "海"), {});
    assert.ok(toggleSaved({}, "海", t1).海);
});

test("setStatus updates status, keeps addedAt and saves unsaved kanji", () => {
    const a = saveKanji({}, "海", t1);
    const b = setStatus(a, "海", "known", t2);
    assert.equal(b.海.status, "known");
    assert.equal(b.海.addedAt, t1.toISOString());
    assert.equal(b.海.updatedAt, t2.toISOString());
    assert.equal(setStatus(b, "海", "known", t2), b);
    assert.equal(setStatus({}, "山", "known", t2).山.status, "known");
});

test("listSaved sorts newest first and filters by status", () => {
    let e = saveKanji({}, "海", t1);
    e = saveKanji(e, "山", t2);
    e = setStatus(e, "海", "known", t2);
    assert.deepEqual(listSaved(e), ["山", "海"]);
    assert.deepEqual(listSaved(e, "known"), ["海"]);
    assert.deepEqual(listSaved(e, "learning"), ["山"]);
    assert.deepEqual(countByStatus(e), { all: 2, learning: 1, known: 1 });
});

test("sanitizeEntries drops malformed persisted data", () => {
    assert.deepEqual(sanitizeEntries(null), {});
    assert.deepEqual(sanitizeEntries({ 海: { status: "bogus", addedAt: "x", updatedAt: "x" }, 山: 3 }), {});
    const ok = { status: "known", addedAt: "a", updatedAt: "b" };
    assert.deepEqual(sanitizeEntries({ 海: ok }), { 海: ok });
});
