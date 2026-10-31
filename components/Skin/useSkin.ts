"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_SKIN, isSkin, SKIN_STORAGE_KEY, type Skin } from "./skin";

const listeners = new Set<() => void>();

function readSkin(): Skin {
    const value = document.documentElement.dataset.skin;
    return isSkin(value) ? value : DEFAULT_SKIN;
}

function notify() {
    listeners.forEach((listener) => listener());
}

function onStorage(e: StorageEvent) {
    // Another tab changed the skin.
    if (e.key !== SKIN_STORAGE_KEY) return;
    document.documentElement.dataset.skin = isSkin(e.newValue) ? e.newValue : DEFAULT_SKIN;
    notify();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
}

/** Applies and remembers a skin. */
export function setSkin(skin: Skin) {
    document.documentElement.dataset.skin = skin;
    try {
        localStorage.setItem(SKIN_STORAGE_KEY, skin);
    } catch {
        // Private mode or blocked storage: the skin still applies to this page view.
    }
    notify();
}

/**
 * The current skin. The server snapshot is the default, so components render
 * "night" until hydration; style anything visual from `[data-skin]` in CSS so
 * it is right from the first paint.
 */
export function useSkin(): Skin {
    return useSyncExternalStore(subscribe, readSkin, () => DEFAULT_SKIN);
}
