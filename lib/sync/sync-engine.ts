"use client";

import { create } from "zustand";
import { useProgressStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/settings-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import { applySnapshot, getLocalSnapshot } from "./local-state";
import { mergeSnapshots } from "./merge";
import type { AppSnapshot, RemoteAppStateRow } from "./types";

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

function remoteToSnapshot(row: Pick<RemoteAppStateRow, "progress" | "settings">): AppSnapshot {
    return {
        progress: row.progress,
        settings: row.settings,
    };
}

async function upsertSnapshot(userId: string, snapshot: AppSnapshot, migratedAt?: string | null) {
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

export async function runInitialSync(userId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    useSyncStatusStore.getState().setStatus("syncing");

    try {
        const local = getLocalSnapshot();
        const { data, error } = await supabase
            .from("user_app_state")
            .select("progress, settings, schema_version, migrated_at, updated_at")
            .eq("user_id", userId)
            .maybeSingle<RemoteAppStateRow>();

        if (error) throw error;

        const remote = data ? remoteToSnapshot(data) : null;
        const merged = mergeSnapshots(local, remote, {
            preferLocalSettings: !data?.migrated_at,
        });

        applySnapshot(merged);
        await upsertSnapshot(userId, merged, data?.migrated_at ?? null);
        useSyncStatusStore.getState().setStatus("synced");
    } catch (error) {
        useSyncStatusStore
            .getState()
            .setStatus("error", error instanceof Error ? error.message : "Sync failed.");
    }
}

export function startDebouncedSync(userId: string) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let applyingRemoteSnapshot = true;

    const scheduleSync = () => {
        if (applyingRemoteSnapshot) return;

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            try {
                useSyncStatusStore.getState().setStatus("syncing");
                await upsertSnapshot(userId, getLocalSnapshot());
                useSyncStatusStore.getState().setStatus("synced");
            } catch (error) {
                useSyncStatusStore
                    .getState()
                    .setStatus("error", error instanceof Error ? error.message : "Sync failed.");
            }
        }, 800);
    };

    const unsubscribeProgress = useProgressStore.subscribe(scheduleSync);
    const unsubscribeSettings = useSettingsStore.subscribe(scheduleSync);

    void runInitialSync(userId).finally(() => {
        applyingRemoteSnapshot = false;
    });

    return () => {
        applyingRemoteSnapshot = true;
        if (timeoutId) clearTimeout(timeoutId);
        unsubscribeProgress();
        unsubscribeSettings();
    };
}
