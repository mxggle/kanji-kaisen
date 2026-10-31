import test from "node:test";
import assert from "node:assert/strict";

import { dayKey } from "../../lib/ink.ts";
import { firstStep, nextShadeGoal, writeGoal } from "./next-shade.ts";

const now = new Date(2026, 9, 31, 12);
const today = dayKey(now);
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const entry = (shade, extra = {}) => ({ shade, updatedAt: daysAgo(1), ...extra });

test("nextShadeGoal walks the loop", () => {
    assert.deepEqual(nextShadeGoal(undefined, now), { to: 1, after: "Meet" });
    assert.deepEqual(nextShadeGoal(entry(1), now), { to: 2, after: "Recall and Trace" });
    assert.deepEqual(nextShadeGoal(entry(1, { recall: true }), now), { to: 2, after: "Trace" });
    assert.deepEqual(nextShadeGoal(entry(1, { trace: true }), now), { to: 2, after: "Recall" });
    assert.deepEqual(nextShadeGoal(entry(2), now), { to: 3, after: "Writes on two days" });
    assert.deepEqual(nextShadeGoal(entry(2, { writeDays: [today] }), now), { to: 3, after: "a Write on another day" });
    assert.deepEqual(nextShadeGoal(entry(2, { writeDays: ["2026-10-01"] }), now), { to: 3, after: "a Write today" });
    assert.equal(nextShadeGoal(entry(4), now), null);
});

test("nextShadeGoal counts down to 印", () => {
    assert.deepEqual(nextShadeGoal(entry(3), now), { to: 4, after: "Writes three weeks apart" });
    assert.deepEqual(nextShadeGoal(entry(3, { firstWrite: daysAgo(16) }), now), { to: 4, after: "a Write in 5 days" });
    assert.deepEqual(nextShadeGoal(entry(3, { firstWrite: daysAgo(20) }), now), { to: 4, after: "a Write tomorrow" });
    assert.deepEqual(nextShadeGoal(entry(3, { firstWrite: daysAgo(21) }), now), { to: 4, after: "your next Write" });
});

test("firstStep opens at the first step without evidence", () => {
    assert.equal(firstStep(undefined), "meet");
    assert.equal(firstStep(entry(1)), "recall");
    assert.equal(firstStep(entry(1, { trace: true })), "recall");
    assert.equal(firstStep(entry(1, { recall: true })), "trace");
    assert.equal(firstStep(entry(2)), "recall", "a hand-marked 中 still has its steps to do");
    assert.equal(firstStep(entry(2, { recall: true, trace: true })), "write");
    assert.equal(firstStep(entry(3)), "meet", "濃 and 印 count as finished");
    assert.equal(firstStep(entry(4, { recall: true, trace: true })), "meet");
});

test("writeGoal names the shade writing reaches", () => {
    assert.equal(writeGoal("海", undefined, now), "Get it right on two different days and 海 turns 濃 Familiar.");
    assert.match(writeGoal("海", entry(2, { writeDays: [today] }), now), /^You wrote it today\./);
    assert.equal(writeGoal("海", entry(1, { writeDays: ["2026-10-01"] }), now), "Get it right today and 海 turns 濃 Familiar.");
    assert.equal(writeGoal("海", entry(3, { firstWrite: daysAgo(30) }), now), "Get it right now and 海 turns 印 Mastered.");
    assert.equal(writeGoal("海", entry(3, { firstWrite: daysAgo(11) }), now), "Get it right in 10 days or later and 海 turns 印 Mastered.");
    assert.match(writeGoal("海", entry(4), now), /already 印 Mastered/);
});
