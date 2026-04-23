import test from "node:test";
import assert from "node:assert/strict";

import { mergeSnapshots } from "./merge.ts";

const baseProgress = {
    hearts: 4,
    maxHearts: 10,
    streak: 2,
    lastLoginDate: "2026-04-21",
    completedCheckpoints: {
        "nature-1": true,
    },
    unlockedLevels: ["N5"],
};

const baseSettings = {
    skipHandwritingGlobally: false,
    skipHandwritingTodayDate: null,
    soundEnabled: true,
    reduceMotion: false,
    dailyGoalMinutes: 10,
    learningMode: "standard",
    nickname: "Local",
    targetJlpt: "N3",
};

test("mergeSnapshots uploads local state when remote is empty", () => {
    const result = mergeSnapshots(
        { progress: baseProgress, settings: baseSettings },
        null,
        { preferLocalSettings: true }
    );

    assert.deepEqual(result.progress, baseProgress);
    assert.deepEqual(result.settings, baseSettings);
});

test("mergeSnapshots unions completed checkpoints and unlocked levels", () => {
    const result = mergeSnapshots(
        {
            progress: {
                ...baseProgress,
                completedCheckpoints: { "nature-1": true },
                unlockedLevels: ["N5", "N4"],
            },
            settings: baseSettings,
        },
        {
            progress: {
                ...baseProgress,
                completedCheckpoints: { "people-1": true },
                unlockedLevels: ["N5", "N3"],
            },
            settings: { ...baseSettings, nickname: "Remote" },
        },
        { preferLocalSettings: true }
    );

    assert.deepEqual(result.progress.completedCheckpoints, {
        "nature-1": true,
        "people-1": true,
    });
    assert.deepEqual(result.progress.unlockedLevels, ["N5", "N4", "N3"]);
});

test("mergeSnapshots keeps safer larger hearts and max hearts", () => {
    const result = mergeSnapshots(
        {
            progress: { ...baseProgress, hearts: 3, maxHearts: 10 },
            settings: baseSettings,
        },
        {
            progress: { ...baseProgress, hearts: 8, maxHearts: 12 },
            settings: baseSettings,
        },
        { preferLocalSettings: true }
    );

    assert.equal(result.progress.hearts, 8);
    assert.equal(result.progress.maxHearts, 12);
});

test("mergeSnapshots chooses streak from the newer login date", () => {
    const result = mergeSnapshots(
        {
            progress: { ...baseProgress, streak: 7, lastLoginDate: "2026-04-20" },
            settings: baseSettings,
        },
        {
            progress: { ...baseProgress, streak: 3, lastLoginDate: "2026-04-22" },
            settings: baseSettings,
        },
        { preferLocalSettings: true }
    );

    assert.equal(result.progress.streak, 3);
    assert.equal(result.progress.lastLoginDate, "2026-04-22");
});

test("mergeSnapshots keeps larger streak when login dates match", () => {
    const result = mergeSnapshots(
        {
            progress: { ...baseProgress, streak: 7, lastLoginDate: "2026-04-22" },
            settings: baseSettings,
        },
        {
            progress: { ...baseProgress, streak: 3, lastLoginDate: "2026-04-22" },
            settings: baseSettings,
        },
        { preferLocalSettings: true }
    );

    assert.equal(result.progress.streak, 7);
    assert.equal(result.progress.lastLoginDate, "2026-04-22");
});

test("mergeSnapshots prefers local settings during first login migration", () => {
    const result = mergeSnapshots(
        {
            progress: baseProgress,
            settings: { ...baseSettings, nickname: "Current Device", targetJlpt: "N2" },
        },
        {
            progress: baseProgress,
            settings: { ...baseSettings, nickname: "Remote Device", targetJlpt: "N4" },
        },
        { preferLocalSettings: true }
    );

    assert.equal(result.settings.nickname, "Current Device");
    assert.equal(result.settings.targetJlpt, "N2");
});

test("mergeSnapshots prefers remote settings after migration", () => {
    const result = mergeSnapshots(
        {
            progress: baseProgress,
            settings: { ...baseSettings, nickname: "Current Device", targetJlpt: "N2" },
        },
        {
            progress: baseProgress,
            settings: { ...baseSettings, nickname: "Remote Device", targetJlpt: "N4" },
        },
        { preferLocalSettings: false }
    );

    assert.equal(result.settings.nickname, "Remote Device");
    assert.equal(result.settings.targetJlpt, "N4");
});
