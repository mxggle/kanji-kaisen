"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { KanjiTile, type KanjiTileData } from "@/components/ui/KanjiTile";
import { EASE, cssEase, prefersReducedMotion } from "@/components/Motion/tokens";
import { PAGE_SIZE } from "./filters";
import "./tool-motion.css";

/** The cascade's step and cap, as in tool-motion.css ([data-cascade]). */
const STEP = 14;
const CAP = 24;

/**
 * A new result set (another filter, sort or query) cascades in again from the
 * top-left, including tiles that stayed but moved: without this, the tiles
 * the old and new sets share would just jump into place. Only what is on
 * screen; tiles the set merely gained at the end ("Show more") are left to
 * the CSS cascade.
 */
function recascade(list: HTMLElement) {
    const bottom = window.innerHeight;
    for (const li of Array.from(list.children) as HTMLElement[]) {
        const r = li.getBoundingClientRect();
        if (r.bottom < 0 || r.top > bottom) continue;
        const i = Number(li.style.getPropertyValue("--ci")) || 0;
        li.animate(
            [
                { opacity: 0, translate: "0 10px" },
                { opacity: 1, translate: "0 0" },
            ],
            { duration: 440, delay: Math.min(i, CAP) * STEP, easing: cssEase(EASE.out), fill: "backwards" },
        );
    }
}

/**
 * The Browse and Search result grid: md tiles, each in its own theme colour,
 * 88px columns (76 on phones, so four fit). The page's <InkPaint> fills the
 * tiles.
 *
 * The tiles cascade in top-left first (tool-motion.css, data-cascade="page"):
 * after the title row on first paint, and at once for tiles a new filter or
 * "Show more" adds. Each "Show more" batch counts from its own first tile.
 * Not a motion hook: the glyphs are shared elements, and the cascade stands
 * down while a page change flies one of them in.
 */
export function TileGrid({ items, label, className }: { items: readonly KanjiTileData[]; label?: string; className?: string }) {
    const ref = useRef<HTMLUListElement>(null);
    const shown = useRef<readonly string[] | null>(null);

    useLayoutEffect(() => {
        const before = shown.current;
        shown.current = items.map((k) => k.char);
        // First render: the CSS cascade (or the page change) brings the grid in.
        if (!before || !ref.current || prefersReducedMotion()) return;
        const kept = before.length <= items.length && before.every((c, i) => items[i]?.char === c);
        if (!kept) recascade(ref.current);
    }, [items]);

    return (
        <ul
            ref={ref}
            aria-label={label}
            data-cascade="page"
            className={cn("grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(88px,1fr))]", className)}
        >
            {items.map((k, i) => (
                <li key={k.char} className="min-w-0" style={{ "--ci": i % PAGE_SIZE } as CSSProperties}>
                    <KanjiTile kanji={k} morph />
                </li>
            ))}
        </ul>
    );
}
