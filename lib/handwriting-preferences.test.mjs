import test from "node:test";
import assert from "node:assert/strict";

import {
    getLocalDateKey,
    isDailyHandwritingSkipActive,
    isHandwritingSkipped,
    shouldShowDailySkipBanner,
} from "./handwriting-preferences.js";

test("daily handwriting skip is active only on the matching local date", () => {
    const now = new Date("2026-04-20T09:00:00");

    assert.equal(isDailyHandwritingSkipActive("2026-04-20", now), true);
    assert.equal(isDailyHandwritingSkipActive("2026-04-19", now), false);
    assert.equal(isDailyHandwritingSkipActive(null, now), false);
});

test("global handwriting skip always wins over the daily value", () => {
    const now = new Date("2026-04-20T09:00:00");

    assert.equal(
        isHandwritingSkipped({
            skipHandwritingGlobally: true,
            skipHandwritingTodayDate: null,
            now,
        }),
        true
    );

    assert.equal(
        isHandwritingSkipped({
            skipHandwritingGlobally: false,
            skipHandwritingTodayDate: "2026-04-20",
            now,
        }),
        true
    );

    assert.equal(
        isHandwritingSkipped({
            skipHandwritingGlobally: false,
            skipHandwritingTodayDate: "2026-04-19",
            now,
        }),
        false
    );
});

test("getLocalDateKey returns the local calendar date", () => {
    assert.equal(getLocalDateKey(new Date("2026-04-20T23:15:00")), "2026-04-20");
});

test("daily skip banner is shown whenever the daily skip is active but global skip is off", () => {
    const now = new Date("2026-04-20T09:00:00");

    assert.equal(
        shouldShowDailySkipBanner({
            skipHandwritingGlobally: false,
            skipHandwritingTodayDate: "2026-04-20",
            now,
        }),
        true
    );

    assert.equal(
        shouldShowDailySkipBanner({
            skipHandwritingGlobally: true,
            skipHandwritingTodayDate: "2026-04-20",
            now,
        }),
        false
    );

    assert.equal(
        shouldShowDailySkipBanner({
            skipHandwritingGlobally: false,
            skipHandwritingTodayDate: null,
            now,
        }),
        false
    );
});
