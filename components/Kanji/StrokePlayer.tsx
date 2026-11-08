"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/Button";
import type { Point } from "./strokes";
import styles from "./kanji.module.css";

// The writing canvas (and kanji-recognizer) loads only when asked for.
const TryWriting = dynamic(() => import("./TryWriting").then((m) => m.TryWriting), {
    ssr: false,
    loading: () => <div className="mx-auto aspect-square w-full max-w-[300px] animate-pulse rounded-xl bg-bg" aria-hidden />,
});

const STEP_MS = 620;
// The first play waits a beat once the player is seen, so it starts after the
// panel has arrived rather than mid-entrance.
const AUTO_WAIT_MS = 320;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface StrokePlayerProps {
    char: string;
    paths: string[];
    /** KanjiVG's stroke number positions; numbers are left out without them. */
    numbers?: Point[];
    /** Play once when the player is first seen (skipped with reduced motion). */
    autoPlay?: boolean;
    className?: string;
}

/**
 * Stroke order, numbered: strokes so far in ink, the one being drawn in the
 * accent (the only thing that lights up, rule 5), the rest faint. Step with
 * ‹ ›, replay, or swap in "Try writing it" (local tracing, no scoring).
 */
export function StrokePlayer({ char, paths, numbers, autoPlay = true, className }: StrokePlayerProps) {
    const total = paths.length;
    // The stroke being drawn; null when all strokes are shown at rest.
    const [current, setCurrent] = useState<number | null>(null);
    const [playing, setPlaying] = useState(false);
    const [mode, setMode] = useState<"view" | "write">("view");
    // After the first switch between view and write, the new one cross-fades in.
    const [swapped, setSwapped] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoPlayed = useRef(false);

    const stop = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    const tick = (i: number) => {
        stop();
        if (i >= total) {
            setCurrent(null);
            setPlaying(false);
            return;
        }
        setCurrent(i);
        timer.current = setTimeout(() => tick(i + 1), STEP_MS);
    };

    const play = () => {
        if (!total || reducedMotion()) {
            stop();
            setPlaying(false);
            setCurrent(null);
            return;
        }
        setPlaying(true);
        tick(0);
    };

    const step = (delta: number) => {
        stop();
        setPlaying(false);
        setCurrent((c) => {
            const from = c ?? total;
            const next = from + delta;
            return next >= total ? null : Math.max(0, next);
        });
    };

    useEffect(() => stop, []);

    // Play once when first seen (a hidden tab panel is seen when it opens).
    useEffect(() => {
        const el = rootRef.current;
        if (!autoPlay || !el || !total || typeof IntersectionObserver === "undefined") return;
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting) || autoPlayed.current) return;
                autoPlayed.current = true;
                io.disconnect();
                if (!reducedMotion()) {
                    stop();
                    timer.current = setTimeout(() => {
                        setPlaying(true);
                        tick(0);
                    }, AUTO_WAIT_MS);
                }
            },
            { threshold: 0.5 },
        );
        io.observe(el);
        return () => io.disconnect();
        // tick is stable enough for a one-time observer.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, total]);

    const write = () => {
        stop();
        setPlaying(false);
        if (mode === "view") trackEvent("trace_used", { kanji: char, action: "start" });
        setSwapped(true);
        setMode(mode === "view" ? "write" : "view");
    };

    if (!total) {
        return <p className="text-sm text-ink-3">No stroke order data for this kanji yet.</p>;
    }

    const status = current === null ? `${total} stroke${total === 1 ? "" : "s"}` : `Stroke ${current + 1} of ${total}`;
    const box = "relative aspect-square w-full rounded-xl bg-bg max-[959px]:border max-[959px]:border-line max-[959px]:bg-card";

    return (
        <div ref={rootRef} className={cn("flex flex-col gap-3.5", className)}>
            {mode === "view" ? (
                <div role="img" aria-label={current === null ? `${char}, all ${total} strokes, numbered` : `${char}, stroke ${current + 1} of ${total}`} className={cn(box, swapped && styles.swap)}>
                    <svg viewBox="0 0 109 109" aria-hidden className="absolute inset-0 size-full fill-none stroke-line [stroke-dasharray:1.4_1.4] [stroke-width:.4]">
                        <path d="M54.5 0V109M0 54.5H109" />
                    </svg>
                    <svg viewBox="0 0 109 109" aria-hidden className="absolute inset-[6%] size-[88%] overflow-visible fill-none [stroke-linecap:round] [stroke-linejoin:round]" strokeWidth={4.2}>
                        {paths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                className={current === null || i < current ? "stroke-ink" : i === current ? "stroke-transparent" : cn("stroke-line-2", styles.faint)}
                            />
                        ))}
                        {numbers?.map((p, i) => (
                            <text
                                key={i}
                                x={p.x}
                                y={p.y}
                                className={cn("stroke-none text-[5.5px] font-bold", i === current ? "fill-c" : "fill-ink-3", styles.num)}
                            >
                                {i + 1}
                            </text>
                        ))}
                    </svg>
                    {current !== null && (
                        <svg viewBox="0 0 109 109" aria-hidden className="live absolute inset-[6%] size-[88%] overflow-visible fill-none stroke-c [stroke-linecap:round] [stroke-linejoin:round]" strokeWidth={4.2}>
                            <path key={current} d={paths[current]} pathLength={1} className={styles.draw} style={{ "--dur": `${STEP_MS - 120}ms` } as CSSProperties} />
                        </svg>
                    )}
                </div>
            ) : (
                <TryWriting char={char} className={styles.swap} />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                {mode === "view" ? (
                    <div className="flex items-center gap-1.5">
                        <Button size="sm" iconOnly aria-label="Previous stroke" onClick={() => step(-1)} disabled={current === 0} className={styles.press}>
                            <ChevronLeft aria-hidden />
                        </Button>
                        <span aria-live={playing ? "off" : "polite"} className="min-w-24 text-center text-sm text-ink-2">
                            {status}
                        </span>
                        <Button size="sm" iconOnly aria-label="Next stroke" onClick={() => step(1)} disabled={current === null} className={styles.press}>
                            <ChevronRight aria-hidden />
                        </Button>
                        <Button size="sm" variant="quiet" iconOnly aria-label={playing ? "Restart the stroke order" : "Play the stroke order"} onClick={play} className={styles.press}>
                            <RotateCcw aria-hidden />
                        </Button>
                    </div>
                ) : (
                    <span />
                )}
                <Button size="sm" onClick={write} aria-pressed={mode === "write"} className={styles.press}>
                    {mode === "view" ? "Try writing it" : "Back to the strokes"}
                </Button>
            </div>
        </div>
    );
}
