"use client";

import { flushSync } from "react-dom";
import { prefersReducedMotion } from "@/components/Motion/tokens";
import type { Skin } from "./skin";
import { setSkin } from "./useSkin";

type StartViewTransition = (update: () => void) => ViewTransition;

let running: ViewTransition | null = null;

/**
 * Applies a skin so that it spreads like ink from `origin` (the button that
 * was pressed): a View Transition of the root whose new view grows as a
 * circle from the button (components/Skin/skin.css). Instant with reduced
 * motion, without View Transitions or without an origin.
 */
export function spreadSkin(skin: Skin, origin?: Element | null) {
    const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
    if (!origin || typeof start !== "function" || prefersReducedMotion()) {
        setSkin(skin);
        return;
    }

    const root = document.documentElement;
    const box = origin.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--skin-x", `${x}px`);
    root.style.setProperty("--skin-y", `${y}px`);
    root.style.setProperty("--skin-r", `${Math.ceil(r)}px`);
    root.dataset.skinShift = "";

    // A second press mid-change starts a new spread from where it is.
    running?.skipTransition();
    const transition = start.call(document, () => {
        // Render React's side (aria-pressed, canvases) inside the new view.
        flushSync(() => setSkin(skin));
    });
    running = transition;
    // A skipped transition rejects `ready`; the skin is applied either way.
    transition.ready.catch(() => {});
    transition.finished
        .catch(() => {})
        .finally(() => {
            if (running !== transition) return;
            running = null;
            delete root.dataset.skinShift;
            root.style.removeProperty("--skin-x");
            root.style.removeProperty("--skin-y");
            root.style.removeProperty("--skin-r");
        });
}
