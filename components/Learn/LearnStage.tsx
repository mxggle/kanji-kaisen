"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pathPoints } from "@/components/Kanji/strokes";
import { strokeLines } from "./stage";
import type { LearnData } from "./types";
import styles from "./learn.module.css";

export type StageMode = "meet" | "recall" | "trace" | "write";

/** The 109-unit writing grid: centre cross and diagonals. */
const GRID = "M54.5 0V109M0 54.5H109M0 0L109 109M109 0L0 109";
/** Sound strokes are dashed (rule 2). */
const SOUND_DASH = "4 6.5";
const STROKES = "absolute inset-[8%] size-[84%] fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:4]";

interface LearnStageProps {
    data: LearnData;
    mode: StageMode;
    /** Trace: strokes before `at` are done, stroke `at` (1-based) is being drawn. */
    at?: number;
    /** Changing this replays the current stroke. */
    replay?: number;
    /** Write: the writing canvas, over the whole stage. */
    children?: ReactNode;
    /** A line at the foot of the stage ("Write with your finger, mouse or pen"). */
    caption?: string;
    label: string;
}

/**
 * The square stage of the #learn layer. Meet draws the kanji by part (meaning
 * solid, sound dashed, form grey, in the page's theme colour); Recall shows
 * the glyph; Trace draws one stroke at a time, the only thing that is live;
 * Write holds the canvas.
 */
export function LearnStage({ data, mode, at = 1, replay = 0, children, caption, label }: LearnStageProps) {
    const paths = data.strokes.map((s) => s.d);
    let glyph: ReactNode;

    if (children) {
        glyph = <div className="absolute inset-0">{children}</div>;
    } else if (!paths.length || mode === "recall" || mode === "write") {
        glyph = (
            <span lang="ja" className="absolute inset-0 flex items-center justify-center font-jp text-[58cqw] font-extrabold leading-none text-ink">
                {data.char}
            </span>
        );
    } else if (mode === "trace") {
        const current = Math.min(Math.max(at, 1), paths.length) - 1;
        const start = pathPoints(paths[current])[0];
        glyph = (
            <>
                <svg viewBox="0 0 109 109" aria-hidden className={STROKES}>
                    <g className="stroke-ink">{paths.map((d, i) => (i < current ? <path key={i} d={d} /> : null))}</g>
                    <g className="stroke-line-2">{paths.map((d, i) => (i > current ? <path key={i} d={d} /> : null))}</g>
                    {start && <circle cx={start.x} cy={start.y} r={2.2} className="fill-c" />}
                </svg>
                <svg viewBox="0 0 109 109" aria-hidden className={cn(STROKES, "live stroke-c")}>
                    <path key={`${current}-${replay}`} d={paths[current]} pathLength={1} className={styles.draw} />
                </svg>
            </>
        );
    } else {
        const lines = strokeLines(data.parts, data.owners, paths.length);
        glyph = (
            <svg viewBox="0 0 109 109" aria-hidden className={cn(STROKES, "stroke-c")}>
                {paths.map((d, i) => (
                    <path key={i} d={d} className={lines[i] === "form" ? "stroke-ink-3" : undefined} strokeDasharray={lines[i] === "sound" ? SOUND_DASH : undefined} />
                ))}
            </svg>
        );
    }

    return (
        <div className="@container relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-card">
            <svg viewBox="0 0 109 109" aria-hidden className="absolute inset-0 size-full fill-none stroke-line [stroke-dasharray:1.2_1.2] [stroke-width:.35]">
                <path d={GRID} />
            </svg>
            <div role="img" aria-label={label} className="absolute inset-0">
                {glyph}
            </div>
            {caption && <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-ink-3">{caption}</p>}
        </div>
    );
}
