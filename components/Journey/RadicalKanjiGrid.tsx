"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { JlptLevel } from "@/lib/atlas/types";
import { Chip } from "@/components/ui/Chip";
import { InkLegend } from "@/components/ui/InkLegend";
import { cssEase, DUR, EASE, prefersReducedMotion } from "@/components/Motion/tokens";

const LEVELS: readonly JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

/** Tiles answered with a rise when the filter changes: about the first screen of them. */
const RESHOWN = 36;
const RESHOW_STAGGER_MS = 18;

/**
 * A new result set rises in, quickly and in reading order (the tiles are only
 * hidden, never remounted, so the hooks in app/motion.css don't replay). Only
 * tiles on screen and already revealed by MotionRoot; the rest stay as they are.
 */
function reshow(list: HTMLUListElement | null) {
    if (!list || prefersReducedMotion() || typeof list.animate !== "function") return;
    let n = 0;
    for (const li of list.children) {
        if (n >= RESHOWN) break;
        if (!(li instanceof HTMLElement) || li.hidden) continue;
        if (document.documentElement.dataset.motion !== undefined && !li.hasAttribute("data-shown")) continue;
        const rect = li.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        li.animate([{ opacity: 0, transform: "translate3d(0, 10px, 0)" }, { opacity: 1, transform: "none" }], {
            duration: DUR.enter * 1000 * 0.75,
            delay: n * RESHOW_STAGGER_MS,
            easing: cssEase(EASE.out),
            fill: "backwards",
        });
        n++;
    }
}

export interface FilterTile {
    char: string;
    jlpt: JlptLevel;
    /** The server-rendered <KanjiTile>; the page's <InkPaint> fills it. */
    tile: ReactNode;
}

/**
 * Every kanji of a radical with JLPT filter chips. The tiles are rendered on
 * the server and only hidden here, so their ink stays painted.
 */
export function RadicalKanjiGrid({ tiles }: { tiles: FilterTile[] }) {
    const [level, setLevelState] = useState<JlptLevel | null>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const setLevel = (next: JlptLevel | null) => {
        if (next === level) return;
        setLevelState(next);
        // After React has shown the new set, before it paints.
        requestAnimationFrame(() => reshow(listRef.current));
    };
    const counts = useMemo(() => {
        const out = new Map<JlptLevel, number>();
        for (const t of tiles) out.set(t.jlpt, (out.get(t.jlpt) ?? 0) + 1);
        return out;
    }, [tiles]);
    const levels = LEVELS.filter((l) => counts.has(l));
    const shown = level ? (counts.get(level) ?? 0) : tiles.length;

    return (
        <div className="flex flex-col gap-5">
            <div data-reveal="fade" className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {levels.length > 1 && (
                    <div role="group" aria-label="Filter by JLPT level" className="flex flex-wrap gap-2">
                        <Chip pressed={level === null} onClick={() => setLevel(null)} count={tiles.length}>
                            All
                        </Chip>
                        {levels.map((l) => (
                            <Chip key={l} pressed={level === l} onClick={() => setLevel(level === l ? null : l)} count={counts.get(l)}>
                                {l}
                            </Chip>
                        ))}
                    </div>
                )}
                <InkLegend className="ml-auto" />
            </div>
            <p aria-live="polite" className="sr-only">
                {level ? `${shown} ${level} kanji` : `All ${shown} kanji`}
            </p>
            {/* Tiles rise as they scroll in; each kanji shows once, so its glyph can fly to its page. */}
            <ul
                ref={listRef}
                data-reveal-group="rise"
                className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] sm:gap-2.5"
            >
                {tiles.map((t) => (
                    <li key={t.char} hidden={level !== null && t.jlpt !== level} className="min-w-0">
                        {t.tile}
                    </li>
                ))}
            </ul>
        </div>
    );
}
