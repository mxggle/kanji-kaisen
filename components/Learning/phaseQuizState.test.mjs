import test from "node:test";
import assert from "node:assert/strict";

import { canSelectQuizMeaning, getLockedQuizMeaning } from "./phaseQuizState.ts";

test("getLockedQuizMeaning keeps the first selected answer once revealed", () => {
    const firstSelection = getLockedQuizMeaning(null, "wrong answer");
    const secondSelection = getLockedQuizMeaning(firstSelection, "correct answer");

    assert.equal(firstSelection, "wrong answer");
    assert.equal(secondSelection, "wrong answer");
});

test("canSelectQuizMeaning is false after the first selection", () => {
    assert.equal(canSelectQuizMeaning(null), true);
    assert.equal(canSelectQuizMeaning("wrong answer"), false);
});
