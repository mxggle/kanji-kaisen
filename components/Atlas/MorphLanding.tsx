"use client";

import { useLayoutEffect } from "react";

/** Every shared-element name (components/Motion/Morph.tsx morphName) starts with this. */
const MORPH = "kk-";

/** Stop watching after this long; a page transition is over well before. */
const WATCH_MS = 2000;

function inViewTransition(): boolean {
    if (!("startViewTransition" in document)) return false;
    try {
        return document.documentElement.matches(":active-view-transition");
    } catch {
        // No :active-view-transition: assume one may be running and watch anyway (cheap).
        return true;
    }
}

const isRevealTarget = (el: Element) => el.hasAttribute("data-reveal") || !!el.parentElement?.hasAttribute("data-reveal-group");
const isEnterTarget = (el: Element) => el.hasAttribute("data-enter") || !!el.parentElement?.hasAttribute("data-enter-group");

/**
 * The motion hooks on a landing element and on its ancestors stand down: the
 * flight is its entrance, and a hook still playing when it lands would make
 * it jump (or vanish and stamp in again).
 */
function settle(el: Element) {
    if (!(el instanceof HTMLElement) || !el.style.viewTransitionName.startsWith(MORPH)) return;
    for (let a: HTMLElement | null = el; a && a !== document.body; a = a.parentElement) {
        if (isRevealTarget(a)) a.setAttribute("data-shown", "instant");
        if (isEnterTarget(a)) a.style.animation = "none";
    }
}

/**
 * Lets a page keep data-enter / data-reveal on (or around) its <Morph>
 * landing elements: the theme art, the radical seal, seal and tile grids.
 *
 * On first paint, and on navigations where nothing flies, every hook plays as
 * usual. When the page arrives in a view transition, React names the paired
 * elements after the commit (after images load) and clears the names once the
 * new state is captured, while rendering is paused. So this watches style
 * changes for that window and settles whatever is named to land. Renders
 * nothing; one per page.
 */
export function MorphLanding() {
    useLayoutEffect(() => {
        if (!inViewTransition()) return;
        const mo = new MutationObserver((records) => records.forEach((r) => settle(r.target as Element)));
        mo.observe(document.body, { attributes: true, attributeFilter: ["style"], subtree: true });
        document.querySelectorAll('[style*="view-transition-name"]').forEach(settle);
        const stop = window.setTimeout(() => mo.disconnect(), WATCH_MS);
        return () => {
            mo.disconnect();
            window.clearTimeout(stop);
        };
    }, []);
    return null;
}
