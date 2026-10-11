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

// Compares date keys (YYYY-MM-DD) or ISO timestamps; null sorts first.
function compareKeys(a: string | null, b: string | null) {
    if (a === b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return a > b ? 1 : -1;
}

function previousDateKey(dateKey: string): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

    const date = new Date(`${dateKey}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return null;

    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
}

function mergeStreak(local: ProgressSnapshot, remote: ProgressSnapshot) {
    const dateComparison = compareKeys(local.lastLoginDate, remote.lastLoginDate);

    if (dateComparison === 0) {
        return {
            streak: Math.max(local.streak, remote.streak),
            lastLoginDate: local.lastLoginDate,
        };
    }

    const [newer, older] = dateComparison > 0 ? [local, remote] : [remote, local];

    // The newer side may have reset its streak before it saw the older side's login,
    // e.g. a device that was last opened a week ago. If the older side logged in the
    // day before, the streak actually continued.
    const continuesOlderStreak =
        newer.lastLoginDate !== null &&
        older.lastLoginDate !== null &&
        previousDateKey(newer.lastLoginDate) === older.lastLoginDate;

    return {
        streak: continuesOlderStreak ? Math.max(newer.streak, older.streak + 1) : newer.streak,
        lastLoginDate: newer.lastLoginDate,
    };
}

function mergeHearts(local: number, remote: number, mode: MergeOptions["hearts"]) {
    if (mode === "local") return local;
    if (mode === "remote") return remote;
    return Math.max(local, remote);
}

function mergeProgress(
    local: ProgressSnapshot,
    remote: ProgressSnapshot,
    options: MergeOptions
): ProgressSnapshot {
    // A newer reset replaces everything recorded before it on the other side.
    const resetComparison = compareKeys(local.progressResetAt, remote.progressResetAt);
    if (resetComparison > 0) return local;
    if (resetComparison < 0) return remote;

    const maxHearts = Math.max(local.maxHearts, remote.maxHearts);

    return {
        hearts: Math.min(mergeHearts(local.hearts, remote.hearts, options.hearts), maxHearts),
        maxHearts,
        ...mergeStreak(local, remote),
        completedCheckpoints: mergeCompletedCheckpoints(
            local.completedCheckpoints,
            remote.completedCheckpoints
        ),
        unlockedLevels: mergeUnlockedLevels(local.unlockedLevels, remote.unlockedLevels),
        progressResetAt: local.progressResetAt,
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
        progress: mergeProgress(local.progress, remote.progress, options),
        settings: options.preferLocalSettings ? local.settings : remote.settings,
    };
}

const NULLABLE_KEYS = new Set(["lastLoginDate", "skipHandwritingTodayDate", "progressResetAt"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExpectedShape(key: string, candidate: unknown, fallback: unknown) {
    if (NULLABLE_KEYS.has(key)) return candidate === null || typeof candidate === "string";
    if (Array.isArray(fallback)) return Array.isArray(candidate);
    if (isPlainObject(fallback)) return isPlainObject(candidate);
    if (typeof fallback === "number") return typeof candidate === "number" && Number.isFinite(candidate);
    return typeof candidate === typeof fallback;
}

function sanitizeSection<T extends object>(value: unknown, fallback: T): T {
    if (!isPlainObject(value)) return fallback;

    const result = { ...fallback } as Record<string, unknown>;
    for (const [key, fallbackValue] of Object.entries(fallback)) {
        if (hasExpectedShape(key, value[key], fallbackValue)) {
            result[key] = value[key];
        }
    }
    return result as T;
}

// Remote rows are untrusted JSON (older schema, the column default '{}', manual edits).
// Any field that is missing or has the wrong type falls back to the local value.
export function sanitizeRemoteSnapshot(
    remote: { progress: unknown; settings: unknown },
    local: AppSnapshot
): AppSnapshot {
    return {
        progress: sanitizeSection(remote.progress, local.progress),
        settings: sanitizeSection(remote.settings, local.settings),
    };
}

function stableStringify(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (isPlainObject(value)) {
        return `{${Object.keys(value)
            .sort()
            .filter((key) => value[key] !== undefined)
            .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
            .join(",")}}`;
    }
    return JSON.stringify(value ?? null);
}

export function snapshotsEqual(a: AppSnapshot, b: AppSnapshot) {
    return stableStringify(a) === stableStringify(b);
}
