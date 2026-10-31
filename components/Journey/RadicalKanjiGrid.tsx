"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { JlptLevel } from "@/lib/atlas/types";
import { Chip } from "@/components/ui/Chip";
import { InkLegend } from "@/components/ui/InkLegend";

const LEVELS: readonly JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

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
    const [level, setLevel] = useState<JlptLevel | null>(null);
    const counts = useMemo(() => {
        const out = new Map<JlptLevel, number>();
        for (const t of tiles) out.set(t.jlpt, (out.get(t.jlpt) ?? 0) + 1);
        return out;
    }, [tiles]);
    const levels = LEVELS.filter((l) => counts.has(l));
    const shown = level ? (counts.get(level) ?? 0) : tiles.length;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
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
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] sm:gap-2.5">
                {tiles.map((t) => (
                    <li key={t.char} hidden={level !== null && t.jlpt !== level} className="min-w-0">
                        {t.tile}
                    </li>
                ))}
            </ul>
        </div>
    );
}
