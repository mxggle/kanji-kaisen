import test from "node:test";
import assert from "node:assert/strict";

import { mergeSnapshots, sanitizeRemoteSnapshot, snapshotsEqual } from "./merge.ts";

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

test("mergeSnapshots continues a streak a stale device reset", () => {
    // A device last opened a week ago resets to 1 today, while another device logged in yesterday.
    const result = mergeSnapshots(
        {
            progress: { ...baseProgress, streak: 1, lastLoginDate: "2026-04-22" },
            settings: baseSettings,
        },
        {
            progress: { ...baseProgress, streak: 30, lastLoginDate: "2026-04-21" },
            settings: baseSettings,
        },
        { preferLocalSettings: false }
    );

    assert.equal(result.progress.streak, 31);
    assert.equal(result.progress.lastLoginDate, "2026-04-22");
});

test("mergeSnapshots continues a streak across a month boundary", () => {
    const result = mergeSnapshots(
        {
            progress: { ...baseProgress, streak: 12, lastLoginDate: "2026-02-28" },
            settings: baseSettings,
        },
        {
            progress: { ...baseProgress, streak: 1, lastLoginDate: "2026-03-01" },
            settings: baseSettings,
        },
        { preferLocalSettings: false }
    );

    assert.equal(result.progress.streak, 13);
    assert.equal(result.progress.lastLoginDate, "2026-03-01");
});

test("mergeSnapshots keeps a broken streak broken", () => {
    const result = mergeSnapshots(
        {
            progress: { ...baseProgress, streak: 1, lastLoginDate: "2026-04-22" },
            settings: baseSettings,
        },
        {
            progress: { ...baseProgress, streak: 30, lastLoginDate: "2026-04-20" },
            settings: baseSettings,
        },
        { preferLocalSettings: false }
    );

    assert.equal(result.progress.streak, 1);
});

test("mergeSnapshots takes hearts from the requested side", () => {
    const local = { progress: { ...baseProgress, hearts: 3 }, settings: baseSettings };
    const remote = { progress: { ...baseProgress, hearts: 8 }, settings: baseSettings };

    assert.equal(mergeSnapshots(local, remote, { preferLocalSettings: true, hearts: "local" }).progress.hearts, 3);
    assert.equal(mergeSnapshots(local, remote, { preferLocalSettings: true, hearts: "remote" }).progress.hearts, 8);
    assert.equal(mergeSnapshots(local, remote, { preferLocalSettings: true }).progress.hearts, 8);
});

test("mergeSnapshots lets a newer local reset replace remote progress", () => {
    const resetProgress = {
        hearts: 10,
        maxHearts: 10,
        streak: 0,
        lastLoginDate: null,
        completedCheckpoints: {},
        unlockedLevels: ["N5"],
        progressResetAt: "2026-04-22T10:00:00.000Z",
    };
    const result = mergeSnapshots(
        { progress: resetProgress, settings: baseSettings },
        {
            progress: { ...baseProgress, completedCheckpoints: { "people-1": true }, progressResetAt: null },
            settings: baseSettings,
        },
        { preferLocalSettings: true }
    );

    assert.deepEqual(result.progress, resetProgress);
});

test("mergeSnapshots drops local progress older than a remote reset", () => {
    const remoteProgress = {
        ...baseProgress,
        completedCheckpoints: {},
        progressResetAt: "2026-04-22T10:00:00.000Z",
    };
    const result = mergeSnapshots(
        {
            progress: { ...baseProgress, completedCheckpoints: { "nature-1": true }, progressResetAt: null },
            settings: baseSettings,
        },
        { progress: remoteProgress, settings: baseSettings },
        { preferLocalSettings: true }
    );

    assert.deepEqual(result.progress, remoteProgress);
});

test("sanitizeRemoteSnapshot fills missing or invalid remote fields from local state", () => {
    const local = { progress: { ...baseProgress, progressResetAt: null }, settings: baseSettings };

    assert.deepEqual(sanitizeRemoteSnapshot({ progress: {}, settings: {} }, local), local);

    const result = sanitizeRemoteSnapshot(
        {
            progress: { hearts: "lots", streak: 9, completedCheckpoints: ["x"], lastLoginDate: null },
            settings: { nickname: "Remote", dailyGoalMinutes: null },
        },
        local
    );

    assert.equal(result.progress.hearts, baseProgress.hearts);
    assert.equal(result.progress.streak, 9);
    assert.deepEqual(result.progress.completedCheckpoints, baseProgress.completedCheckpoints);
    assert.equal(result.progress.lastLoginDate, null);
    assert.equal(result.settings.nickname, "Remote");
    assert.equal(result.settings.dailyGoalMinutes, baseSettings.dailyGoalMinutes);
});

test("snapshotsEqual ignores key order", () => {
    const a = { progress: baseProgress, settings: baseSettings };
    const b = {
        settings: { ...baseSettings },
        progress: Object.fromEntries(Object.entries(baseProgress).reverse()),
    };

    assert.equal(snapshotsEqual(a, b), true);
    assert.equal(snapshotsEqual(a, { ...b, progress: { ...b.progress, hearts: 1 } }), false);
});
