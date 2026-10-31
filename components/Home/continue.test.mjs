import { test } from "node:test";
import assert from "node:assert/strict";
import { agoLabel, continueCard, nextStep, pickContinue, shadeCounts } from "./continue.ts";

const at = (day, hour = 12) => new Date(2026, 9, day, hour).toISOString();
const e = (shade, day, extra = {}) => ({ shade, updatedAt: at(day), ...extra });

test("nextStep walks recall, trace, write and stops at 濃", () => {
    assert.equal(nextStep(e(1, 1)), "recall");
    assert.equal(nextStep(e(1, 1, { recall: true })), "trace");
    assert.equal(nextStep(e(1, 1, { trace: true })), "recall");
    assert.equal(nextStep(e(2, 1, { recall: true, trace: true })), "write");
    assert.equal(nextStep(e(2, 1, { recall: true, trace: true, writeDays: ["2026-10-01"] })), "write");
    assert.equal(nextStep(e(3, 1, { writeDays: ["2026-10-01", "2026-10-02"] })), null);
    assert.equal(nextStep(e(4, 1)), null);
});

test("nextStep counts a shade marked by hand as its earlier steps done", () => {
    assert.equal(nextStep(e(2, 1)), "write");
    assert.equal(nextStep(e(3, 1)), null);
});

test("pickContinue is null with no ink", () => {
    assert.equal(pickContinue({}), null);
});

test("pickContinue is null when everything is 印 (or 濃)", () => {
    assert.equal(pickContinue({ 海: e(4, 3), 木: e(4, 5) }), null);
    assert.equal(pickContinue({ 海: e(3, 3), 木: e(4, 5) }), null);
});

test("pickContinue takes the most recent kanji with a step left", () => {
    const pick = pickContinue({ 木: e(4, 9), 海: e(1, 7), 川: e(2, 5, { recall: true, trace: true }) });
    assert.deepEqual(pick, { char: "海", shade: 1, step: "recall", stepNumber: 2, updatedAt: at(7) });
});

test("pickContinue skips a newer finished kanji for an older unfinished one", () => {
    const pick = pickContinue({ 林: e(3, 20), 川: e(2, 5, { recall: true, trace: true }) });
    assert.equal(pick?.char, "川");
    assert.equal(pick?.step, "write");
    assert.equal(pick?.stepNumber, 4);
});

test("pickContinue breaks updatedAt ties by code point, whatever the key order", () => {
    const a = { 海: e(1, 7), 川: e(1, 7, { recall: true }), 水: e(1, 7) };
    const b = { 水: e(1, 7), 川: e(1, 7, { recall: true }), 海: e(1, 7) };
    // 川 U+5DDD < 水 U+6C34 < 海 U+6D77
    assert.equal(pickContinue(a)?.char, "川");
    assert.equal(pickContinue(b)?.char, "川");
    assert.equal(pickContinue(a)?.step, "trace");
});

test("pickContinue ranks a bad date oldest", () => {
    const pick = pickContinue({ 海: { shade: 1, updatedAt: "not a date" }, 川: e(1, 2) });
    assert.equal(pick?.char, "川");
    assert.equal(pickContinue({ 海: { shade: 1, updatedAt: "not a date" } })?.char, "海");
});

test("continueCard shows the method before hydration and with no ink", () => {
    assert.deepEqual(continueCard(null), { kind: "first" });
    assert.deepEqual(continueCard({}), { kind: "first" });
    assert.deepEqual(continueCard({ 海: e(4, 1) }), { kind: "done" });
    assert.equal(continueCard({ 海: e(1, 1) }).kind, "continue");
});

test("shadeCounts puts every kanji without ink at 白", () => {
    assert.deepEqual(shadeCounts({}, 2384), { 0: 2384, 1: 0, 2: 0, 3: 0, 4: 0 });
    assert.deepEqual(shadeCounts({ 海: e(1, 1), 川: e(1, 1), 木: e(4, 1), 林: e(3, 1) }, 10), { 0: 6, 1: 2, 2: 0, 3: 1, 4: 1 });
    assert.equal(shadeCounts({ 海: e(1, 1), 川: e(2, 1) }, 1)[0], 0);
});

test("agoLabel speaks in calendar days", () => {
    const now = new Date(2026, 9, 31, 9);
    assert.equal(agoLabel(new Date(2026, 9, 31, 1).toISOString(), now), "today");
    assert.equal(agoLabel(new Date(2026, 9, 30, 23).toISOString(), now), "yesterday");
    assert.equal(agoLabel(new Date(2026, 9, 29, 8).toISOString(), now), "two days ago");
    assert.equal(agoLabel(new Date(2026, 9, 20).toISOString(), now), "11 days ago");
    assert.equal(agoLabel(new Date(2026, 9, 10).toISOString(), now), "three weeks ago");
    assert.equal(agoLabel(new Date(2026, 3, 1).toISOString(), now), "seven months ago");
    assert.equal(agoLabel(new Date(2025, 0, 1).toISOString(), now), "over a year ago");
    assert.equal(agoLabel(new Date(2026, 10, 2).toISOString(), now), "today");
    assert.equal(agoLabel("nope", now), null);
});
