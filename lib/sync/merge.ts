import type { AppSnapshot, MergeOptions, ProgressSnapshot } from "./types";

function mergeCompletedCheckpoints(
    local: ProgressSnapshot["completedCheckpoints"],
    remote: ProgressSnapshot["completedCheckpoints"]
) {
    return {
        ...remote,
        ...local,
    };
}

function mergeUnlockedLevels(local: string[], remote: string[]) {
    return Array.from(new Set([...local, ...remote]));
}

function compareDateKeys(a: string | null, b: string | null) {
    if (a === b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return a > b ? 1 : -1;
}

function mergeProgress(local: ProgressSnapshot, remote: ProgressSnapshot): ProgressSnapshot {
    const maxHearts = Math.max(local.maxHearts, remote.maxHearts);
    const dateComparison = compareDateKeys(local.lastLoginDate, remote.lastLoginDate);
    const streakSource = dateComparison >= 0 ? local : remote;
    const sameLoginDate = dateComparison === 0;

    return {
        hearts: Math.min(Math.max(local.hearts, remote.hearts), maxHearts),
        maxHearts,
        streak: sameLoginDate ? Math.max(local.streak, remote.streak) : streakSource.streak,
        lastLoginDate: streakSource.lastLoginDate,
        completedCheckpoints: mergeCompletedCheckpoints(
            local.completedCheckpoints,
            remote.completedCheckpoints
        ),
        unlockedLevels: mergeUnlockedLevels(local.unlockedLevels, remote.unlockedLevels),
    };
}

export function mergeSnapshots(
    local: AppSnapshot,
    remote: AppSnapshot | null,
    options: MergeOptions
): AppSnapshot {
    if (!remote) {
        return local;
    }

    return {
        progress: mergeProgress(local.progress, remote.progress),
        settings: options.preferLocalSettings ? local.settings : remote.settings,
    };
}
