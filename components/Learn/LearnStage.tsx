"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
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
/** Meet writes the kanji in within about a second, however many strokes it has. */
const strokeGap = (n: number) => `${Math.round(Math.min(90, 1000 / Math.max(n, 1)))}ms`;

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
 *
 * Each mode arrives with its own motion: Meet writes the kanji in stroke by
 * stroke (also the end of the loop), the glyph soaks in for Recall, the guide
 * fades in for Trace, the canvas for Write.
 */
export function LearnStage({ data, mode, at = 1, replay = 0, children, caption, label }: LearnStageProps) {
    const paths = data.strokes.map((s) => s.d);
    let glyph: ReactNode;

    if (children) {
        glyph = <div className={cn("absolute inset-0", styles.appear)}>{children}</div>;
    } else if (!paths.length || mode === "recall" || mode === "write") {
        glyph = (
            <span lang="ja" className={cn("absolute inset-0 flex items-center justify-center font-jp text-[58cqw] font-extrabold leading-none text-ink", styles.soak)}>
                {data.char}
            </span>
        );
    } else if (mode === "trace") {
        const current = Math.min(Math.max(at, 1), paths.length) - 1;
        const start = pathPoints(paths[current])[0];
        glyph = (
            <>
                <svg viewBox="0 0 109 109" aria-hidden className={cn(STROKES, styles.appear)}>
                    <g className="stroke-ink">{paths.map((d, i) => (i < current ? <path key={i} d={d} /> : null))}</g>
                    <g className="stroke-line-2">{paths.map((d, i) => (i > current ? <path key={i} d={d} /> : null))}</g>
                    {start && <circle key={current} cx={start.x} cy={start.y} r={2.2} className={cn("fill-c", styles.appear)} />}
                </svg>
                <svg viewBox="0 0 109 109" aria-hidden className={cn(STROKES, "live stroke-c")}>
                    <path key={`${current}-${replay}`} d={paths[current]} pathLength={1} className={styles.draw} />
                </svg>
            </>
        );
    } else {
        const lines = strokeLines(data.parts, data.owners, paths.length);
        glyph = (
            <svg viewBox="0 0 109 109" aria-hidden className={cn(STROKES, "stroke-c")} style={{ "--stroke-step": strokeGap(paths.length), "--stroke-wait": "120ms" } as CSSProperties}>
                {paths.map((d, i) =>
                    lines[i] === "sound" ? (
                        <path key={i} d={d} strokeDasharray={SOUND_DASH} className={styles.dashed} style={{ "--stroke-n": i } as CSSProperties} />
                    ) : (
                        <path key={i} d={d} pathLength={1} className={cn(lines[i] === "form" && "stroke-ink-3", styles.write)} style={{ "--stroke-n": i } as CSSProperties} />
                    ),
                )}
            </svg>
        );
    }

    return (
        <div className="@container relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-card">
            <svg viewBox="0 0 109 109" aria-hidden className="absolute inset-0 size-full fill-none stroke-line [stroke-dasharray:1.2_1.2] [stroke-width:.35]">
                <path d={GRID} />
            </svg>
            <div role="img" aria-label={label} className="absolute inset-0">
                {/* A new mode mounts its glyph afresh, so its entrance plays. */}
                <Fragment key={mode}>{glyph}</Fragment>
            </div>
            {caption && <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-ink-3">{caption}</p>}
        </div>
    );
}
