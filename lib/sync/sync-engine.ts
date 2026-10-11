"use client";

import { create } from "zustand";
import { useProgressStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settings-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import { applySnapshot, getLocalSnapshot } from "./local-state";
import { mergeSnapshots, sanitizeRemoteSnapshot, snapshotsEqual } from "./merge";
import type { AppSnapshot, MergeOptions, RemoteAppStateRow } from "./types";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncState {
    status: SyncStatus;
    error: string | null;
    lastSyncedAt: string | null;
    setStatus: (status: SyncStatus, error?: string | null) => void;
}

export const useSyncStatusStore = create<SyncState>((set) => ({
    status: "idle",
    error: null,
    lastSyncedAt: null,
    setStatus: (status, error = null) =>
        set((state) => ({
            status,
            error,
            lastSyncedAt: status === "synced" ? new Date().toISOString() : state.lastSyncedAt,
        })),
}));

const DEBOUNCE_MS = 800;
const MIN_RETRY_MS = 2_000;
const MAX_RETRY_MS = 60_000;

// Settings edited while signed in stay "dirty" until uploaded, even across reloads,
// so an offline edit is not replaced by the older remote settings on the next load.
// The marker is per user so one account's pending edit never wins another account's merge.
function settingsDirtyKey(userId: string) {
    return `kanji-kaisen-settings-dirty:${userId}`;
}

function readSettingsDirtyMarker(userId: string): string | null {
    try {
        return window.localStorage.getItem(settingsDirtyKey(userId));
    } catch {
        return null;
    }
}

function writeSettingsDirtyMarker(userId: string, value: string | null) {
    try {
        if (value) {
            window.localStorage.setItem(settingsDirtyKey(userId), value);
        } else {
            window.localStorage.removeItem(settingsDirtyKey(userId));
        }
    } catch {
        // Storage can be unavailable (private mode); the marker is only an optimization.
    }
}

async function upsertSnapshot(userId: string, snapshot: AppSnapshot, migratedAt: string | null) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const now = new Date().toISOString();
    const { error } = await supabase.from("user_app_state").upsert({
        user_id: userId,
        progress: snapshot.progress,
        settings: snapshot.settings,
        schema_version: 1,
        migrated_at: migratedAt ?? now,
        updated_at: now,
    });

    if (error) throw error;
}

async function fetchRemoteRow(userId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("user_app_state")
        .select("progress, settings, schema_version, migrated_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle<RemoteAppStateRow>();

    if (error) throw error;
    return data;
}

// Every sync reads the remote row, merges it with local state and writes the result back,
// so a failed read never turns into a blind overwrite of the remote copy.
export function startDebouncedSync(userId: string) {
    let stopped = false;
    let initialSynced = false;
    let applyingRemoteSnapshot = false;
    let heartsChangeCount = 0;
    let inFlight = false;
    let pendingRun = false;
    let debounceId: ReturnType<typeof setTimeout> | null = null;
    let retryId: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = MIN_RETRY_MS;

    const setStatus = useSyncStatusStore.getState().setStatus;

    const syncOnce = async () => {
        const row = await fetchRemoteRow(userId);
        if (stopped) return;

        // Read local state after the fetch so changes made while it was in flight are kept.
        const local = getLocalSnapshot();
        const remote = row ? sanitizeRemoteSnapshot(row, local) : null;
        const settingsMarker = readSettingsDirtyMarker(userId);
        const heartsChangesAtStart = heartsChangeCount;

        let hearts: MergeOptions["hearts"] = "max";
        if (initialSynced) hearts = heartsChangeCount > 0 ? "local" : "remote";

        const merged = mergeSnapshots(local, remote, {
            preferLocalSettings: settingsMarker !== null || !row?.migrated_at,
            hearts,
        });

        if (!snapshotsEqual(merged, local)) {
            applyingRemoteSnapshot = true;
            try {
                applySnapshot(merged);
            } finally {
                applyingRemoteSnapshot = false;
            }
        }

        if (!remote || !row?.migrated_at || !snapshotsEqual(merged, remote)) {
            await upsertSnapshot(userId, merged, row?.migrated_at ?? null);
        }

        // Only clear markers that were not bumped by changes made during the upload.
        heartsChangeCount -= heartsChangesAtStart;
        if (settingsMarker !== null && readSettingsDirtyMarker(userId) === settingsMarker) {
            writeSettingsDirtyMarker(userId, null);
        }
    };

    const scheduleRetry = () => {
        if (stopped) return;
        if (retryId) clearTimeout(retryId);
        retryId = setTimeout(run, retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
    };

    async function run() {
        if (stopped) return;
        if (inFlight) {
            pendingRun = true;
            return;
        }

        if (debounceId) clearTimeout(debounceId);
        if (retryId) clearTimeout(retryId);
        debounceId = null;
        retryId = null;
        inFlight = true;

        try {
            do {
                pendingRun = false;
                setStatus("syncing");
                await syncOnce();
                if (stopped) return;
                initialSynced = true;
                retryDelay = MIN_RETRY_MS;
                setStatus("synced");
            } while (pendingRun && !stopped);
        } catch (error) {
            if (stopped) return;
            setStatus("error", error instanceof Error ? error.message : "Sync failed.");
            scheduleRetry();
        } finally {
            inFlight = false;
        }
    }

    const scheduleSync = () => {
        if (applyingRemoteSnapshot || stopped) return;

        if (debounceId) clearTimeout(debounceId);
        debounceId = setTimeout(run, DEBOUNCE_MS);
    };

    const unsubscribeProgress = useProgressStore.subscribe((state, previous) => {
        if (applyingRemoteSnapshot || stopped) return;
        // Only a change to hearts on this device makes local hearts win the next merge.
        if (state.hearts !== previous.hearts) heartsChangeCount += 1;
        scheduleSync();
    });
    const unsubscribeSettings = useSettingsStore.subscribe(() => {
        if (applyingRemoteSnapshot || stopped) return;
        writeSettingsDirtyMarker(userId, String(Date.now()));
        scheduleSync();
    });

    const handleOnline = () => void run();
    const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
            // Pick up changes made on other devices while this tab was in the background.
            void run();
        } else if (debounceId) {
            // Flush pending changes before the page may be frozen or closed.
            void run();
        }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    void run();

    return () => {
        stopped = true;
        if (debounceId) clearTimeout(debounceId);
        if (retryId) clearTimeout(retryId);
        unsubscribeProgress();
        unsubscribeSettings();
        window.removeEventListener("online", handleOnline);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
}
