"use client";

import { useCallback, useRef, useState } from "react";
import { Lightbulb, PenLine, Play, Trash2, Eye } from "lucide-react";
import { KanjiCanvas, type KanjiCanvasRef } from "@/components/Learning/KanjiCanvas";
import { cn } from "@/lib/utils";

const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const buttonClass =
    "flex-1 py-2 px-3 bg-zinc-800 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm font-medium focus-visible:outline-2 focus-visible:outline-[var(--accent)]";

/**
 * Animated stroke order (KanjiCanvas view mode) with replay, plus a
 * "Try writing" mode (practice mode: Clear/Hint, no scoring, no API calls).
 */
export function StrokeOrderPanel({ char }: { char: string }) {
    const canvasRef = useRef<KanjiCanvasRef>(null);
    const [mode, setMode] = useState<"view" | "practice">("view");
    const [done, setDone] = useState(false);
    const [animateOnLoad] = useState(() => !prefersReducedMotion());

    const handleComplete = useCallback(() => setDone(true), []);

    const switchMode = () => {
        setDone(false);
        setMode((m) => (m === "view" ? "practice" : "view"));
    };

    const clear = () => {
        setDone(false);
        canvasRef.current?.clear();
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl overflow-hidden" data-testid="stroke-canvas" data-mode={mode}>
                <KanjiCanvas
                    key={mode}
                    ref={canvasRef}
                    kanji={char}
                    mode={mode}
                    animateOnLoad={mode === "view" && animateOnLoad}
                    onComplete={mode === "practice" ? handleComplete : undefined}
                />
            </div>

            <p className="text-sm text-white/60 min-h-5 text-center" aria-live="polite">
                {mode === "view"
                    ? "Watch the strokes in order."
                    : done
                        ? "All strokes done. Clear to try again."
                        : "Trace the blue guide strokes in order."}
            </p>

            <div className="flex gap-2 w-full max-w-[300px]">
                {mode === "view" ? (
                    <button type="button" onClick={() => canvasRef.current?.animate()} className={cn(buttonClass, "text-[var(--accent)]")}>
                        <Play size={16} aria-hidden /> Replay
                    </button>
                ) : (
                    <>
                        <button type="button" onClick={clear} className={cn(buttonClass, "text-white")}>
                            <Trash2 size={16} aria-hidden /> Clear
                        </button>
                        <button type="button" onClick={() => canvasRef.current?.hint()} className={cn(buttonClass, "text-amber-400")}>
                            <Lightbulb size={16} aria-hidden /> Hint
                        </button>
                    </>
                )}
            </div>

            <button
                type="button"
                onClick={switchMode}
                aria-pressed={mode === "practice"}
                className="w-full max-w-[300px] py-2 px-3 rounded-lg border border-white/15 bg-white/5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
                {mode === "view" ? (
                    <><PenLine size={16} aria-hidden /> Try writing</>
                ) : (
                    <><Eye size={16} aria-hidden /> Back to animation</>
                )}
            </button>
        </div>
    );
}
