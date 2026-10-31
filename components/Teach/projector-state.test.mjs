import test from "node:test";
import assert from "node:assert/strict";

import { INITIAL_PROJECTOR, keyDirection, projectorKey, projectorReducer } from "./projector-state.ts";

const run = (actions, state = INITIAL_PROJECTOR) => actions.reduce(projectorReducer, state);

test("Space draws one stroke at a time, then moves to the next kanji", () => {
    const advance = { type: "advance", total: 3, count: 2 };
    assert.deepEqual(run([advance]), { index: 0, drawn: 1, quiz: "off" });
    assert.deepEqual(run([advance, advance, advance]), { index: 0, drawn: 3, quiz: "off" });
    assert.deepEqual(run([advance, advance, advance, advance]), { index: 1, drawn: 0, quiz: "off" });
    const last = { index: 1, drawn: 3, quiz: "off" };
    assert.equal(projectorReducer(last, advance), last, "stops at the end of the set");
    assert.equal(projectorReducer(INITIAL_PROJECTOR, { type: "advance", total: null, count: 2 }), INITIAL_PROJECTOR, "waits for strokes");
});

test("arrows move between kanji, reset strokes and clamp", () => {
    const state = { index: 1, drawn: 2, quiz: "off" };
    assert.deepEqual(projectorReducer(state, { type: "go", delta: 1, count: 3 }), { index: 2, drawn: 0, quiz: "off" });
    assert.deepEqual(projectorReducer(state, { type: "go", delta: -1, count: 3 }), { index: 0, drawn: 0, quiz: "off" });
    assert.equal(projectorReducer({ index: 0, drawn: 2, quiz: "off" }, { type: "go", delta: -1, count: 3 }).drawn, 2, "no move, no reset");
    assert.deepEqual(projectorReducer(state, { type: "unstroke" }), { index: 1, drawn: 1, quiz: "off" });
    assert.deepEqual(projectorReducer(state, { type: "show-all", total: 9 }), { index: 1, drawn: 9, quiz: "off" });
});

test("the class quiz asks, reveals and carries on through the set", () => {
    let state = run([{ type: "toggle-quiz" }]);
    assert.equal(state.quiz, "asking");
    state = projectorReducer(state, { type: "advance", total: 3, count: 2 });
    assert.equal(state.quiz, "revealed", "Space reveals");
    state = projectorReducer(state, { type: "advance", total: 3, count: 2 });
    assert.deepEqual(state, { index: 1, drawn: 0, quiz: "asking" }, "then asks about the next kanji");
    assert.equal(projectorReducer(state, { type: "reveal" }).quiz, "revealed");
    assert.equal(projectorReducer(state, { type: "close-quiz" }).quiz, "off");
    assert.equal(projectorReducer(state, { type: "toggle-quiz" }).quiz, "off");
    assert.equal(projectorReducer(state, { type: "unstroke" }), state, "strokes are fixed during a quiz");
});

test("maps keys to commands", () => {
    assert.equal(projectorKey(" ", "off"), "advance");
    assert.equal(projectorKey("ArrowRight", "off"), "go");
    assert.equal(projectorKey("PageUp", "off"), "go");
    assert.equal(keyDirection("ArrowLeft"), -1);
    assert.equal(keyDirection("PageDown"), 1);
    assert.equal(projectorKey("q", "off"), "toggle-quiz");
    assert.equal(projectorKey("Enter", "asking"), "reveal");
    assert.equal(projectorKey("Escape", "off"), "exit");
    assert.equal(projectorKey("Escape", "asking"), "close-quiz");
    assert.equal(projectorKey("Tab", "off"), null);
});
