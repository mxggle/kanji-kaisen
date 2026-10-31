"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Eye, PenLine, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import styles from "./kanji.module.css";

// The writing canvas (and kanji-recognizer) loads only when asked for.
const TryWriting = dynamic(() => import("./TryWriting").then((m) => m.TryWriting), {
    ssr: false,
    loading: () => <div className="aspect-square w-full max-w-[300px] rounded-xl bg-card animate-pulse" aria-hidden />,
});

const STEP_MS = 620;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const control =
    "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-line-2 px-4 text-sm text-ink transition-colors hover:border-[var(--c)] hover:text-[var(--c)] disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:text-ink";

interface StrokePlayerProps {
    char: string;
    paths: string[];
    /** Play once when the player scrolls into view (skipped with reduced motion). */
    autoPlay?: boolean;
    /** Show the "Try writing" switch. */
    writing?: boolean;
    className?: string;
}

/**
 * Glowing stroke order: KanjiVG paths drawn with a dash animation (glow in 夜,
 * vermilion in 墨), replay and step back/forward. "Try writing" swaps in the
 * tracing canvas (local, no scoring, no API calls).
 */
export function StrokePlayer({ char, paths, autoPlay = true, writing = true, className }: StrokePlayerProps) {
    const total = paths.length;
    // `shown` strokes are visible; when all are shown and nothing plays, they glow.
    const [shown, setShown] = useState(total);
    const [playing, setPlaying] = useState(false);
    const [run, setRun] = useState(0);
    const [mode, setMode] = useState<"view" | "write">("view");
    const rootRef = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoPlayed = useRef(false);

    const stop = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    const tick = (next: number) => {
        stop();
        setShown(next);
        if (next >= total) {
            setPlaying(false);
            return;
        }
        timer.current = setTimeout(() => tick(next + 1), STEP_MS);
    };

    const play = () => {
        if (!total) return;
        if (reducedMotion()) {
            stop();
            setPlaying(false);
            setShown(total);
            setRun((r) => r + 1);
            return;
        }
        setPlaying(true);
        setRun((r) => r + 1);
        tick(1);
    };

    const step = (delta: number) => {
        stop();
        setPlaying(false);
        setRun((r) => r + 1);
        setShown((s) => {
            const from = s >= total ? (delta < 0 ? total : 0) : s;
            return Math.min(total, Math.max(1, from + delta));
        });
    };

    useEffect(() => stop, []);

    // Play once when first seen.
    useEffect(() => {
        const el = rootRef.current;
        if (!autoPlay || !el || !total || typeof IntersectionObserver === "undefined") return;
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting) || autoPlayed.current) return;
                autoPlayed.current = true;
                io.disconnect();
                if (!reducedMotion()) {
                    setPlaying(true);
                    setRun((r) => r + 1);
                    tick(1);
                }
            },
            { threshold: 0.5 },
        );
        io.observe(el);
        return () => io.disconnect();
        // tick is stable enough for a one-time observer.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, total]);

    const switchMode = () => {
        stop();
        setPlaying(false);
        if (mode === "view") trackEvent("trace_used", { kanji: char, action: "start" });
        setMode(mode === "view" ? "write" : "view");
    };

    if (!total) {
        return <p className="text-sm text-ink-3">No stroke order data for this kanji yet.</p>;
    }

    const finished = shown >= total && !playing;
    const current = finished ? null : shown - 1;

    return (
        <div ref={rootRef} className={cn("flex flex-col items-center gap-3", className)}>
            {mode === "view" ? (
                <div
                    role="img"
                    aria-label={finished ? `${char}, all ${total} strokes` : `${char}, stroke ${shown} of ${total}`}
                    className="relative aspect-square w-full max-w-[300px] rounded-xl border border-line bg-card p-5"
                >
                    <svg viewBox="0 0 109 109" aria-hidden className={styles.glyph} strokeWidth={4.2} key={run}>
                        {/* Faint guide cross. */}
                        <g stroke="var(--line)" strokeWidth={0.5} strokeDasharray="2 2">
                            <line x1="54.5" y1="0" x2="54.5" y2="109" />
                            <line x1="0" y1="54.5" x2="109" y2="54.5" />
                        </g>
                        <g className={cn(styles.part, finished && styles.glow)}>
                            {paths.map((d, i) => {
                                // The stroke being drawn sits in its own glowing group below.
                                if (i === current) return null;
                                const cls = finished ? styles.lit : i < shown - 1 ? styles.done : styles.ghost;
                                return <path key={i} d={d} className={cls} />;
                            })}
                        </g>
                        {current !== null && (
                            <g className={cn(styles.part, styles.glow)}>
                                <path key={current} d={paths[current]} pathLength={1} className={cn(styles.lit, styles.draw)} style={{ "--dur": `${STEP_MS - 120}ms` } as CSSProperties} />
                            </g>
                        )}
                    </svg>
                </div>
            ) : (
                <TryWriting char={char} />
            )}

            {mode === "view" && (
                <>
                    <p className="min-h-5 text-sm text-ink-2" aria-live="polite">
                        {finished ? `${total} strokes` : `Stroke ${shown} of ${total}`}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <button type="button" className={control} onClick={() => step(-1)} disabled={shown <= 1 && !finished} aria-label="Previous stroke">
                            <ChevronLeft size={18} aria-hidden />
                        </button>
                        <button type="button" className={cn(control, "px-5")} onClick={play}>
                            <Play size={15} aria-hidden /> {playing ? "Restart" : "Replay"}
                        </button>
                        <button type="button" className={control} onClick={() => step(1)} disabled={finished} aria-label="Next stroke">
                            <ChevronRight size={18} aria-hidden />
                        </button>
                    </div>
                </>
            )}

            {writing && (
                <button
                    type="button"
                    onClick={switchMode}
                    aria-pressed={mode === "write"}
                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-ink-2 transition-colors hover:text-[var(--c)]"
                >
                    {mode === "view" ? (
                        <>
                            <PenLine size={16} aria-hidden /> Try writing
                        </>
                    ) : (
                        <>
                            <Eye size={16} aria-hidden /> Back to the animation
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
