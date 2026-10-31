"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { useSkin } from "@/components/Skin/useSkin";
import type { Stroke } from "@/components/Kanji/types";

export interface WriterApi {
    hint: () => void;
    clear: () => void;
}

interface WriteCanvasProps {
    /** KanjiVG strokes in order (a stable array: the writer restarts when it changes). */
    strokes: Stroke[];
    onComplete: () => void;
    /** Filled with hint/clear once the writer is ready. */
    apiRef: RefObject<WriterApi | null>;
}

type Writer = {
    hint: () => void;
    clear: () => void;
    destroy?: () => void;
    onComplete?: () => void;
    svg?: SVGSVGElement | null;
};

/**
 * Writing from memory, checked stroke by stroke in the browser by
 * kanji-recognizer (no guide strokes, no API calls). A stroke in the wrong
 * place or order fades out and can be tried again.
 */
export function WriteCanvas({ strokes, onComplete, apiRef }: WriteCanvasProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const done = useRef(onComplete);
    const id = `kk-write-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const skin = useSkin();

    useEffect(() => {
        done.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const host = hostRef.current;
        const paths = strokes.map((s) => s.d);
        if (!host || !paths.length) return;
        let cancelled = false;
        let writer: Writer | null = null;

        import("kanji-recognizer").then(({ KanjiWriter }) => {
            if (cancelled) return;
            // Colours come from the skin tokens on this element (--c follows the theme).
            const css = getComputedStyle(host);
            const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
            host.innerHTML = "";
            writer = new KanjiWriter(id, paths, {
                width: 300,
                height: 300,
                strokeColor: token("--ink", "#EDEAE2"),
                correctColor: token("--c", "#3BE0A6"),
                incorrectColor: token("--bad", "#F87171"),
                hintColor: token("--c", "#3BE0A6"),
                gridColor: token("--line-2", "rgba(237,234,226,.28)"),
                showGhost: false,
                showGrid: true,
                checkMode: "stroke",
                strokeWidth: 4.5,
                snapDuration: 160,
                hintDuration: 900,
            }) as unknown as Writer;
            if (writer.svg) {
                writer.svg.style.background = "transparent";
                writer.svg.style.border = "0";
                writer.svg.setAttribute("aria-hidden", "true");
            }
            writer.onComplete = () => done.current();
            apiRef.current = { hint: () => writer?.hint(), clear: () => writer?.clear() };
        });

        return () => {
            cancelled = true;
            writer?.destroy?.();
            writer = null;
            apiRef.current = null;
        };
    }, [id, strokes, skin, apiRef]);

    return <div ref={hostRef} id={id} className="h-full w-full cursor-crosshair touch-none rounded-2xl border border-dashed border-line-2" />;
}
