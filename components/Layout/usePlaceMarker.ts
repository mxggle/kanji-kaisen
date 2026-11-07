"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { cssEase, EASE, prefersReducedMotion } from "@/components/Motion/tokens";

/** The slide between places (ms): a little longer than a tab indicator, it travels across the header. */
const SLIDE = 380;

/**
 * The current place's marker (the header's underline, the tab bar's top mark)
 * slides over from the place you came from. Each place link holds its own
 * marker, `[data-place="learn"] [data-place-marker]`, and CSS shows only the
 * current one, so the server render is already right; on a change this plays
 * the new marker from the old one's box (FLIP, Web Animations API). The header
 * and tab bar live in the root layout, so they see every navigation.
 */
export function usePlaceMarker(root: RefObject<HTMLElement | null>, place: string | null) {
    const last = useRef(place);

    useLayoutEffect(() => {
        const prev = last.current;
        last.current = place;
        const el = root.current;
        if (!el || prev === place || prefersReducedMotion()) return;

        const marker = (p: string | null) => (p ? el.querySelector<HTMLElement>(`[data-place="${p}"] [data-place-marker]`) : null);
        const from = marker(prev);
        const to = marker(place);
        const a = from?.getBoundingClientRect();
        const b = to?.getBoundingClientRect();

        if (to && a?.width && b?.width) {
            to.animate([{ transform: `translateX(${a.left - b.left}px) scaleX(${a.width / b.width})` }, { transform: "none" }], {
                duration: SLIDE,
                easing: cssEase(EASE.out),
            });
        } else if (to) {
            // Arriving from a page with no place (about, settings): painted in left to right.
            to.animate([{ transform: "scaleX(0)" }, { transform: "none" }], { duration: 300, easing: cssEase(EASE.inOut) });
        } else if (from) {
            // Leaving for a page with no place: the old mark fades where it was.
            from.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: cssEase(EASE.in) });
        }
    }, [root, place]);
}
