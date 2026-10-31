"use client";

// Saved sets in localStorage ("kanji-teach-sets"), read through
// useSyncExternalStore so the server render and hydration see an empty list.
// If storage is blocked, sets still work for the current page view.

import { useSyncExternalStore } from "react";
import { removeSavedSet, sanitizeSavedSets, SAVED_SETS_KEY, upsertSavedSet, type SavedSet } from "@/lib/teach-set";

const EMPTY: SavedSet[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cached: SavedSet[] = EMPTY;
// Used instead of localStorage when it throws (private mode, blocked storage).
let memory: SavedSet[] | null = null;

function read(): SavedSet[] {
    if (memory) return memory;
    let raw: string | null;
    try {
        raw = localStorage.getItem(SAVED_SETS_KEY);
    } catch {
        return cached;
    }
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    try {
        cached = raw ? sanitizeSavedSets(JSON.parse(raw)) : EMPTY;
    } catch {
        cached = EMPTY;
    }
    return cached;
}

function write(sets: SavedSet[]) {
    try {
        localStorage.setItem(SAVED_SETS_KEY, JSON.stringify(sets));
        memory = null;
    } catch {
        memory = sets;
    }
    listeners.forEach((listener) => listener());
}

function onStorage(e: StorageEvent) {
    if (e.key === SAVED_SETS_KEY) listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
}

export function useSavedSets(): SavedSet[] {
    return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function saveSet(set: { chars: string[]; title: string }) {
    write(upsertSavedSet(read(), set));
}

export function deleteSavedSet(id: string) {
    write(removeSavedSet(read(), id));
}
