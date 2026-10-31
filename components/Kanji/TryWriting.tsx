"use client";

import { useCallback, useRef, useState } from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import { KanjiCanvas, type KanjiCanvasRef } from "@/components/Learning/KanjiCanvas";
import { trackEvent } from "@/lib/analytics";

const button =
    "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-line-2 px-4 text-sm text-ink transition-colors hover:border-[var(--c)] hover:text-[var(--c)]";

/** Tracing practice over guide strokes (KanjiCanvas practice mode). Local only: no scoring, no API calls. */
export function TryWriting({ char }: { char: string }) {
    const canvasRef = useRef<KanjiCanvasRef>(null);
    const [done, setDone] = useState(false);

    const onComplete = useCallback(() => {
        setDone(true);
        trackEvent("trace_used", { kanji: char, action: "completed" });
    }, [char]);

    return (
        <div className="flex w-full max-w-[300px] flex-col items-center gap-3">
            <div className="overflow-hidden rounded-xl" data-testid="stroke-canvas" data-mode="practice">
                <KanjiCanvas ref={canvasRef} kanji={char} mode="practice" onComplete={onComplete} />
            </div>
            <p className="min-h-5 text-center text-sm text-ink-2" aria-live="polite">
                {done ? "All strokes done. Clear to try again." : "Trace the guide strokes in order."}
            </p>
            <div className="flex w-full gap-2">
                <button
                    type="button"
                    className={button}
                    onClick={() => {
                        setDone(false);
                        canvasRef.current?.clear();
                    }}
                >
                    <Trash2 size={16} aria-hidden /> Clear
                </button>
                <button type="button" className={button} onClick={() => canvasRef.current?.hint()}>
                    <Lightbulb size={16} aria-hidden /> Hint
                </button>
            </div>
        </div>
    );
}
