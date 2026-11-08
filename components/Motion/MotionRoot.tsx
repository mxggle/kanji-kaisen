"use client";

import { useEffect } from "react";

/** What counts as a reveal target: a [data-reveal] element, or a child of a [data-reveal-group]. */
const TARGETS = "[data-reveal], [data-reveal-group] > *";

/** Rows closer than this (px) count as one row when ordering a batch. */
const ROW = 24;

function isTarget(el: Element): boolean {
    return el.hasAttribute("data-reveal") || !!el.parentElement?.hasAttribute("data-reveal-group");
}

/** The element and every target inside it. */
function targetsIn(node: Node): Element[] {
    if (!(node instanceof Element)) return [];
    const found = Array.from(node.querySelectorAll(TARGETS));
    if (isTarget(node)) found.unshift(node);
    // Children of a group that was just added are covered by the selector; a
    // node added to an existing group is covered by isTarget.
    return found;
}

function onScreen(rect: DOMRect): boolean {
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

/**
 * The scroll-reveal engine (one per app, in the root layout). Watches every
 * [data-reveal] and [data-reveal-group] child, and marks it data-shown when it
 * scrolls into view; app/motion.css plays the animation. What arrives in one
 * batch is staggered top-left first (--ri).
 *
 * It only starts after hydration, and marks whatever is already on screen then
 * data-shown="instant", so nothing that was painted gets hidden again; on-load
 * entrances are data-enter's job (pure CSS). Client navigations add nodes,
 * which the MutationObserver picks up. Off with reduced motion: nothing is
 * ever hidden.
 */
export function MotionRoot() {
    useEffect(() => {
        const root = document.documentElement;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (reduce.matches || !("IntersectionObserver" in window)) return;

        const show = (el: Element, how: "" | "instant", order = 0) => {
            if (el.hasAttribute("data-shown")) return;
            // Always set, so a target never inherits a revealed ancestor's place.
            (el as HTMLElement).style.setProperty("--ri", String(order));
            el.setAttribute("data-shown", how);
        };

        const io = new IntersectionObserver(
            (entries) => {
                const arriving = entries.filter((e) => e.isIntersecting);
                arriving.sort((a, b) => {
                    const dy = a.boundingClientRect.top - b.boundingClientRect.top;
                    return Math.abs(dy) > ROW ? dy : a.boundingClientRect.left - b.boundingClientRect.left;
                });
                arriving.forEach((e, i) => {
                    io.unobserve(e.target);
                    show(e.target, "", i);
                });
            },
            // Starts a little before the bottom edge so it is seen arriving. A fixed
            // 40px, not a percentage: on a very tall window 6% outgrew the footer,
            // so the last row of a page never counted as on screen.
            { rootMargin: "0px 0px -40px 0px", threshold: 0 },
        );

        const watch = (el: Element) => {
            if (!el.hasAttribute("data-shown")) io.observe(el);
        };

        // What is on screen at hydration has been visible since first paint: keep it.
        for (const el of document.querySelectorAll(TARGETS)) {
            if (onScreen(el.getBoundingClientRect())) show(el, "instant");
            else watch(el);
        }
        root.dataset.motion = "on";

        const mo = new MutationObserver((records) => {
            for (const r of records) {
                r.addedNodes.forEach((n) => targetsIn(n).forEach(watch));
                r.removedNodes.forEach((n) => targetsIn(n).forEach((el) => io.unobserve(el)));
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });

        // Turning reduced motion on mid-visit shows everything at once.
        const stop = () => {
            if (!reduce.matches) return;
            mo.disconnect();
            io.disconnect();
            delete root.dataset.motion;
        };
        reduce.addEventListener("change", stop);

        return () => {
            reduce.removeEventListener("change", stop);
            mo.disconnect();
            io.disconnect();
            delete root.dataset.motion;
        };
    }, []);

    return null;
}
