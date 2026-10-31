"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { partPhrase } from "./parts";
import type { BuildView } from "./types";
import styles from "./kanji.module.css";

type Stage = "parts" | "together" | "today";

const STAGES: { id: Stage; label: string }[] = [
    { id: "parts", label: "Parts" },
    { id: "together", label: "Together" },
    { id: "today", label: "Today" },
];

const STAGE_MS = 1900;
const STROKE_MS = 300;

const COUNT = ["", "One", "Two", "Three", "Four", "Five", "Six"];

function captionFor(stage: Stage, build: BuildView): string {
    if (stage === "parts") {
        const n = build.parts.length;
        return `${COUNT[n] ?? n} parts: ${build.parts.map(partPhrase).join(", ")}.`;
    }
    if (stage === "together") return build.caption;
    return `Today's ${build.char}, in ${build.paths.length} strokes.`;
}

interface BuildPlayerProps {
    build: BuildView;
    /** Heading content (e.g. 成り立ち How 海 was built). */
    title?: ReactNode;
    /** Play hands over to this after "Together" (the ancient forms) instead of showing "Today". */
    handOver?: () => void;
    /** Label of the hand-over, shown as the last stage button ("Through time"). */
    handOverLabel?: string;
    className?: string;
}

/**
 * "How it was built" from KanjiVG parts alone: each part's strokes in its
 * theme colour, pulled apart, then assembled, then today's form drawn stroke by
 * stroke. Captions state the structure only (sourced etymology lives in its
 * own block). Fires `build_played` on Play.
 */
export function BuildPlayer({ build, title, handOver, handOverLabel, className }: BuildPlayerProps) {
    const [stage, setStage] = useState<Stage>("together");
    const [run, setRun] = useState(0);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    const clear = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };
    useEffect(() => clear, []);

    const pick = (next: Stage) => {
        clear();
        setStage(next);
        setRun((r) => r + 1);
    };

    const play = () => {
        clear();
        trackEvent("build_played", { kanji: build.char });
        setStage("parts");
        setRun((r) => r + 1);
        timers.current.push(setTimeout(() => setStage("together"), STAGE_MS));
        timers.current.push(
            setTimeout(() => {
                if (handOver) {
                    handOver();
                    return;
                }
                setStage("today");
                setRun((r) => r + 1);
            }, STAGE_MS * 2),
        );
    };

    const caption = captionFor(stage, build);
    const today = stage === "today";

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">{title}</div>
                <button
                    type="button"
                    onClick={play}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-2 px-4 text-sm text-ink transition-colors hover:bg-ink hover:text-bg"
                >
                    <Play size={14} aria-hidden /> Play
                </button>
            </div>

            <div role="img" aria-label={`${build.char}: ${caption}`} className="relative mx-auto aspect-square w-full max-w-[420px] p-[9%]">
                <svg viewBox="0 0 109 109" aria-hidden className={styles.glyph} strokeWidth={4.4} key={today ? run : "static"}>
                    {build.parts.map((part, p) => {
                        const offset = build.offsets[p] ?? { x: 0, y: 0 };
                        const apart = stage === "parts";
                        return (
                            <g
                                key={p}
                                className={cn(styles.part, part.alt && styles.alt, styles.move, styles.glow)}
                                style={
                                    {
                                        "--tc": part.themeColor,
                                        transform: apart ? `translate(${offset.x}px, ${offset.y}px) scale(.88)` : "none",
                                    } as CSSProperties
                                }
                            >
                                {part.strokes.map((i) =>
                                    build.owners[i] === p && build.paths[i] ? (
                                        <path
                                            key={i}
                                            d={build.paths[i]}
                                            pathLength={1}
                                            className={cn(styles.lit, today && styles.draw)}
                                            style={today ? ({ "--delay": `${i * STROKE_MS}ms` } as CSSProperties) : undefined}
                                        />
                                    ) : null,
                                )}
                            </g>
                        );
                    })}
                    {/* Strokes no part claims (KanjiVG leaves a few loose). */}
                    <g className={cn(styles.move)} style={{ opacity: stage === "parts" ? 0.35 : 1 }}>
                        {build.paths.map((d, i) =>
                            build.owners[i] === null ? (
                                <path
                                    key={i}
                                    d={d}
                                    pathLength={1}
                                    className={cn(styles.loose, today && styles.draw)}
                                    style={today ? ({ "--delay": `${i * STROKE_MS}ms` } as CSSProperties) : undefined}
                                />
                            ) : null,
                        )}
                    </g>
                </svg>
            </div>

            <p aria-live="polite" className="min-h-[2.7em] font-disp text-xl italic leading-snug text-ink sm:text-[22px]">
                {caption}
            </p>

            <div role="group" aria-label="Build stages" className="flex gap-1.5">
                {STAGES.map((s, k) => (
                    <button
                        key={s.id}
                        type="button"
                        aria-pressed={stage === s.id}
                        onClick={() => pick(s.id)}
                        className={cn(
                            "flex h-11 flex-1 items-center justify-center gap-2 border-t-2 px-1.5 text-[13px] transition-colors",
                            stage === s.id ? "border-[var(--c)] text-ink" : "border-line text-ink-3 hover:text-ink",
                        )}
                    >
                        {k + 1} · {s.label}
                    </button>
                ))}
                {handOver && handOverLabel && (
                    <button
                        type="button"
                        onClick={() => {
                            clear();
                            handOver();
                        }}
                        className="flex h-11 flex-1 items-center justify-center gap-2 border-t-2 border-line px-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
                    >
                        {STAGES.length + 1} · {handOverLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
