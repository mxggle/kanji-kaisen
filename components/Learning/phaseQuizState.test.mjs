import test from "node:test";
import assert from "node:assert/strict";

import {
    canSelectQuizMeaning,
    getLockedQuizMeaning,
    shouldLoseHeartForQuizSelection,
} from "./phaseQuizState.ts";

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

test("shouldLoseHeartForQuizSelection is true only for the first wrong selection", () => {
    assert.equal(shouldLoseHeartForQuizSelection(null, "wrong answer", "correct answer"), true);
    assert.equal(shouldLoseHeartForQuizSelection(null, "correct answer", "correct answer"), false);
    assert.equal(shouldLoseHeartForQuizSelection("wrong answer", "wrong answer", "correct answer"), false);
});
