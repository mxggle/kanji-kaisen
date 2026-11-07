"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { cssEase, DUR, EASE, prefersReducedMotion } from "@/components/Motion/tokens";

/**
 * The dialog pattern from docs/design/motion.md for the story modals, which
 * their parents mount and unmount: on mount the backdrop fades in (--dur-ui)
 * and the panel rises 12px over --dur-enter on the ink curve; `close` plays
 * the exit in half the time on the leaving curve, then calls `onClose`.
 * Reduced motion: no animation, and `close` is immediate.
 */
export function useDialogMotion<B extends HTMLElement, P extends HTMLElement>(onClose: () => void) {
    const backdrop = useRef<B>(null);
    const panel = useRef<P>(null);
    const closing = useRef(false);

    useLayoutEffect(() => {
        if (prefersReducedMotion()) return;
        backdrop.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: DUR.ui * 1000, easing: cssEase(EASE.out), fill: "backwards" });
        panel.current?.animate?.([{ opacity: 0, transform: "translate3d(0, 12px, 0)" }, { opacity: 1, transform: "none" }], {
            duration: DUR.enter * 1000,
            easing: cssEase(EASE.ink),
            fill: "backwards",
        });
    }, []);

    const close = useCallback(() => {
        if (closing.current) return;
        const node = panel.current;
        if (!node || prefersReducedMotion() || typeof node.animate !== "function") {
            onClose();
            return;
        }
        closing.current = true;
        const timing = { duration: DUR.ui * 1000, easing: cssEase(EASE.in), fill: "forwards" } as const;
        backdrop.current?.animate([{ opacity: 1 }, { opacity: 0 }], timing);
        node.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translate3d(0, 8px, 0)" }], timing).finished.then(onClose, onClose);
    }, [onClose]);

    return { backdrop, panel, close };
}
