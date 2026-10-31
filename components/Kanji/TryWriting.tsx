"use client";

import { useCallback, useRef, useState } from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import { KanjiCanvas, type KanjiCanvasRef } from "@/components/Learning/KanjiCanvas";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/Button";

/** Tracing practice over guide strokes (KanjiCanvas practice mode). Local only: no scoring, no API calls. */
export function TryWriting({ char }: { char: string }) {
    const canvasRef = useRef<KanjiCanvasRef>(null);
    const [done, setDone] = useState(false);

    const onComplete = useCallback(() => {
        setDone(true);
        trackEvent("trace_used", { kanji: char, action: "completed" });
    }, [char]);

    return (
        <div className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-3">
            <div className="overflow-hidden rounded-xl" data-testid="stroke-canvas" data-mode="practice">
                <KanjiCanvas ref={canvasRef} kanji={char} mode="practice" onComplete={onComplete} />
            </div>
            <p className="min-h-5 text-center text-sm text-ink-2" aria-live="polite">
                {done ? "All strokes done. Clear to try again." : "Trace the guide strokes in order."}
            </p>
            <div className="flex w-full gap-2">
                <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                        setDone(false);
                        canvasRef.current?.clear();
                    }}
                >
                    <Trash2 aria-hidden /> Clear
                </Button>
                <Button size="sm" className="flex-1" onClick={() => canvasRef.current?.hint()}>
                    <Lightbulb aria-hidden /> Hint
                </Button>
            </div>
        </div>
    );
}
