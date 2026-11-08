// Small list motion for the tool pages, on the Web Animations API (client only).
// A list whose children carry data-flip="<key>" can slide its items to their
// new places when one is removed, restored or moved (FLIP), and let a removed
// item fade out before it goes. Off with reduced motion. Animates `translate`,
// `scale` and `opacity` only, so it composes with the CSS hooks (which use
// `transform`) and with hover lifts.

import { DUR, EASE, cssEase, prefersReducedMotion } from "@/components/Motion/tokens";

/** Item key → where it was. null: it was there, but don't slide it (only tells it apart from a new item). */
export type Rects = Map<string, DOMRect | null>;

const items = (list: HTMLElement) => Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-flip]"));

/** Where each item of `list` is now (before a change). */
export function measure(list: HTMLElement | null): Rects {
    const rects: Rects = new Map();
    if (list) for (const el of items(list)) rects.set(el.dataset.flip ?? "", el.getBoundingClientRect());
    return rects;
}

/**
 * After the change: each item that moved slides from where it was. Items that
 * are new (not in `before`) get `enter`, staggered, when given; leave it out
 * when a hook (data-reveal-group) already brings new items in.
 */
export function flip(list: HTMLElement | null, before: Rects, enter?: Keyframe[]) {
    if (!list || prefersReducedMotion()) return;
    let fresh = 0;
    for (const el of items(list)) {
        const key = el.dataset.flip ?? "";
        const was = before.get(key);
        if (!before.has(key)) {
            if (enter) el.animate(enter, { duration: DUR.ui * 1000, delay: Math.min(fresh++, 12) * 18, easing: cssEase(EASE.out), fill: "backwards" });
            continue;
        }
        if (!was) continue;
        const now = el.getBoundingClientRect();
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration: 340, easing: cssEase(EASE.out) });
    }
}

/** A small pop for an item that just arrived (a kanji added to a set). */
export const POP_IN: Keyframe[] = [
    { opacity: 0, scale: 0.86 },
    { opacity: 1, scale: 1 },
];

/** Fades and shrinks an item that is about to be removed, then calls `done` (at once with reduced motion). */
export function leave(el: HTMLElement | null | undefined, done: () => void) {
    if (!el || prefersReducedMotion()) {
        done();
        return;
    }
    el.style.pointerEvents = "none";
    el.animate(
        [
            { opacity: 1, scale: 1 },
            { opacity: 0, scale: 0.9 },
        ],
        { duration: 180, easing: cssEase(EASE.in), fill: "forwards" },
    ).finished.then(done, done);
}
