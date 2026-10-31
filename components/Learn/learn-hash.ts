"use client";

// The #learn layer is open whenever the URL hash is "#learn": on load
// (deep links from home and theme pages), on hashchange, and when the page's
// "Learn it" button pushes the hash. Closing goes back when we pushed the
// entry, or strips the hash when the page was opened with it.

import { useSyncExternalStore } from "react";

export const LEARN_HASH = "#learn";

const listeners = new Set<() => void>();
let pushedFor: string | null = null;
let opener: HTMLElement | null = null;

function notify() {
    if (window.location.hash !== LEARN_HASH) pushedFor = null;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
        window.addEventListener("hashchange", notify);
        window.addEventListener("popstate", notify);
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            window.removeEventListener("hashchange", notify);
            window.removeEventListener("popstate", notify);
        }
    };
}

const isOpen = () => window.location.hash === LEARN_HASH;

/** True while the URL hash is #learn (false on the server and during hydration). */
export function useLearnOpen(): boolean {
    return useSyncExternalStore(subscribe, isOpen, () => false);
}

/** Opens the layer for `char`, remembering the element to refocus on close. */
export function openLearn(char: string, from?: HTMLElement | null) {
    opener = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (!isOpen()) {
        window.history.pushState(null, "", LEARN_HASH);
        pushedFor = char;
    }
    notify();
}

/** Closes the layer (the layer restores focus as it unmounts). */
export function closeLearn(char: string) {
    if (pushedFor === char && isOpen()) {
        pushedFor = null;
        window.history.back();
    } else {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        notify();
    }
}

/** Marks every "Learn it" button (LearnButton sets it); a page may have two, desktop row and phone action bar. */
export const LEARN_BUTTON_ATTR = "data-learn-button";

/** The first "Learn it" button that is shown, for a layer opened by a #learn link. */
function visibleLearnButton(): HTMLElement | null {
    const buttons = document.querySelectorAll<HTMLElement>(`[${LEARN_BUTTON_ATTR}]`);
    return Array.from(buttons).find((el) => el.getClientRects().length > 0) ?? null;
}

/**
 * Refocuses whatever opened the layer, else the shown "Learn it" button, else
 * the element with `fallbackId`. Call once the page is interactive again.
 */
export function restoreLearnFocus(fallbackId?: string) {
    const target = opener;
    opener = null;
    const el = target && target.isConnected ? target : (visibleLearnButton() ?? (fallbackId ? document.getElementById(fallbackId) : null));
    el?.focus({ preventScroll: true });
}

/** Forget a pushed entry when the page changes (a new kanji's layer closes by stripping the hash). */
export function forgetLearnEntry() {
    pushedFor = null;
}
