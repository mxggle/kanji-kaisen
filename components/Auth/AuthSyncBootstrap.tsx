"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { startDebouncedSync, useSyncStatusStore } from "@/lib/sync/sync-engine";

export function AuthSyncBootstrap() {
    const initializeAuth = useAuthStore((state) => state.initializeAuth);
    const userId = useAuthStore((state) => state.user?.id ?? null);
    const setSyncStatus = useSyncStatusStore((state) => state.setStatus);

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        if (!userId) {
            setSyncStatus("idle");
            return;
        }

        return startDebouncedSync(userId);
    }, [setSyncStatus, userId]);

    return null;
}
