"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { partClass, partStyle } from "@/components/Kanji/PartChips";
import styles from "@/components/Kanji/kanji.module.css";
import type { LearnData } from "./types";

export type StageMode = "lit" | "trace" | "ghost";

interface LearnStageProps {
    data: LearnData;
    mode: StageMode;
    /** Trace: strokes before `at` are done, stroke `at` (1-based) is being drawn. */
    at?: number;
    /** Changing this replays the current stroke. */
    replay?: number;
    /** Replaces the glyph (the writing canvas). */
    children?: ReactNode;
    label: string;
}

/** Decorative rings with the kanji and its parts at the compass points. */
function Rings({ marks }: { marks: string[] }) {
    const spots = [
        { x: 300, y: 46 },
        { x: 556, y: 308 },
        { x: 300, y: 572 },
        { x: 44, y: 308 },
    ];
    return (
        <>
            <svg aria-hidden viewBox="0 0 600 600" className={cn(styles.spin, "pointer-events-none absolute inset-0 m-auto h-full w-full fill-none")}>
                <circle cx="300" cy="300" r="294" stroke="color-mix(in srgb, var(--c) 30%, transparent)" strokeWidth="2" />
                <circle cx="300" cy="300" r="278" stroke="color-mix(in srgb, var(--c) 30%, transparent)" strokeWidth="14" strokeDasharray="1.5 10" />
                <circle cx="300" cy="300" r="258" stroke="var(--line)" strokeWidth="2" />
                {marks.slice(0, 4).map((m, i) => (
                    <text key={i} x={spots[i].x} y={spots[i].y} textAnchor="middle" fontSize="22" fill="var(--ink-3)" stroke="none" className="font-jp">
                        {m}
                    </text>
                ))}
            </svg>
            <svg aria-hidden viewBox="0 0 600 600" className={cn(styles.spinBack, "pointer-events-none absolute inset-[7%] m-auto fill-none")}>
                <path d="M300 10 L551 445 L49 445 Z M300 590 L49 155 L551 155 Z" stroke="var(--line)" strokeWidth="1.5" />
            </svg>
        </>
    );
}

/** The ringed stage of the #learn layer: the glyph lit by part, traced stroke by stroke, or a writing canvas. */
export function LearnStage({ data, mode, at = 0, replay = 0, children, label }: LearnStageProps) {
    const paths = data.strokes.map((s) => s.d);
    const marks = [data.char, ...data.parts.map((p) => p.char)];

    let glyph: ReactNode;
    if (children) {
        glyph = children;
    } else if (!paths.length) {
        glyph = (
            <span lang="ja" className="flex h-full w-full items-center justify-center font-jp text-[150px] font-extrabold leading-none text-[var(--c)] glow lg:text-[260px]">
                {data.char}
            </span>
        );
    } else if (mode === "trace") {
        const current = Math.min(Math.max(at, 1), paths.length) - 1;
        glyph = (
            <svg viewBox="0 0 109 109" aria-hidden className={styles.glyph} strokeWidth={4.6}>
                <g className={styles.softGlow}>
                    {paths.map((d, i) => (i < current ? <path key={i} d={d} className={styles.done} /> : null))}
                </g>
                <g>{paths.map((d, i) => (i > current ? <path key={i} d={d} className={styles.ghost} /> : null))}</g>
                <g className={cn(styles.part, styles.glow)}>
                    <path
                        key={`${current}-${replay}`}
                        d={paths[current]}
                        pathLength={1}
                        className={cn(styles.lit, styles.draw)}
                        style={{ "--dur": "700ms" } as CSSProperties}
                    />
                </g>
            </svg>
        );
    } else {
        glyph = (
            <svg viewBox="0 0 109 109" aria-hidden className={styles.glyph} strokeWidth={4.6}>
                {mode === "ghost" ? (
                    <g>{paths.map((d, i) => <path key={i} d={d} className={styles.ghost} />)}</g>
                ) : (
                    <>
                        {data.parts.map((part) => (
                            <g key={part.char} className={cn(partClass(part), styles.glow)} style={partStyle(part)}>
                                {paths.map((d, i) => (data.owners[i] === part.char ? <path key={i} d={d} className={styles.lit} /> : null))}
                            </g>
                        ))}
                        <g className={cn(styles.part, styles.glow)}>
                            {paths.map((d, i) => (data.owners[i] === null || data.owners[i] === undefined ? <path key={i} d={d} className={styles.lit} /> : null))}
                        </g>
                    </>
                )}
            </svg>
        );
    }

    return (
        <div className="relative mx-auto aspect-square w-[min(78vw,300px)] lg:w-[min(46vh,430px)]">
            <Rings marks={marks} />
            <div role="img" aria-label={label} className="absolute inset-[17%]">
                {glyph}
            </div>
        </div>
    );
}
