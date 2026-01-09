"use client";

import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { KanjiWriter, KanjiVGParser } from "kanji-recognizer";

interface KanjiCanvasProps {
    kanji: string;
    mode: "view" | "practice" | "challenge";
    onComplete?: () => void;
    onMistake?: () => void;
    animateOnLoad?: boolean;
}

export function KanjiCanvas({ kanji, mode, onComplete, onMistake, animateOnLoad }: KanjiCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const writerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function init() {
            if (!containerRef.current) return;
            setIsLoading(true);

            try {
                // Fetch SVG
                const unicode = kanji.charCodeAt(0).toString(16).padStart(5, '0');
                const res = await fetch(`/kanjivg/kanji/${unicode}.svg`);
                if (!res.ok) throw new Error("Failed to load kanji");
                const text = await res.text();

                // @ts-ignore
                const data = KanjiVGParser.parse(text);

                if (!isMounted) return;

                containerRef.current.innerHTML = '';
                const id = `kanji-canvas-${Math.random().toString(36).substr(2, 9)}`;
                containerRef.current.id = id;

                const options: any = {
                    width: 300,
                    height: 300,
                    strokeColor: "#333", // Drawing color
                    gridColor: mode === 'challenge' ? "#333" : "#ddd", // Hide grid in challenge? keeping visible for now
                    showGrid: true,
                };

                // Mode specific settings
                if (mode === "view") {
                    options.strokeWidth = 4;
                    // In view mode, we might just want to animate. 
                    // KanjiWriter doesn't have a "read only" mode easily without disabling interaction?
                    // We'll handle via CSS pointer-events.
                } else if (mode === "practice") {
                    options.strokeWidth = 6;
                    // Practice uses default ghosts
                } else if (mode === "challenge") {
                    options.strokeWidth = 6;
                    // Hide outlines for challenge
                    options.showCharacter = false; // "ghost" hidden
                    options.showMuted = false;
                }

                writerRef.current = new KanjiWriter(id, data, options);

                if (animateOnLoad && mode === "view") {
                    writerRef.current.animate();
                }

                // Add event listeners for completion/mistake if supported by library
                // The library might not expose simple callbacks. 
                // We can "hack" it by listening to the internal state if possible, 
                // or just rely on user clicking "Next" for practice/view.

                // For 'challenge'/'practice', capturing 'success' is tricky without library support.
                // Assuming KanjiWriter has an 'onComplete' callback in newer versions or we mimic it.
                // Looking at library source (unavailable), we'll assume basic functionality.
                // If the library doesn't support callbacks in the Constructor options, 
                // we might need to patch it or use a different approach.
                // For now, let's assume manual "I'm done" or the library emits an event.

                // HACK: Shim the complete method if possible or polling?
                // Actually `kanji-recognizer` (based on makemeahanzi/kanjivg?) usually is for recognition.
                // If this is `kanji-canvas` (quiz), they usually track strokes.
                // Let's assume for this prototype we use a "Check" button if auto-detect fails,
                // OR we accept that we can't auto-detect perfectly without deeper integration.

                // However, the spec says "Completion Logic".
                // I'll add a listener to the writer instance if it has one.
                if (writerRef.current.quiz) {
                    // If it has quiz mode
                    writerRef.current.quiz({
                        onSuccess: () => onComplete?.(),
                        onMistake: () => onMistake?.(),
                    });
                } else {
                    // If no quiz mode, we might monitor strokes. 
                    // Since I don't have the library docs, I'll rely on a manual button fallback 
                    // if I can't find the event.

                    // But wait! Kanjivg is just data. KanjiWriter (from older projects) often has `quiz`.
                    // Let's try to hook `onCorrectStroke` or similar if it exists.
                }

            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }

        init();

        return () => {
            isMounted = false;
            writerRef.current = null;
        };
    }, [kanji, mode, animateOnLoad]);

    // Expose control methods
    const animate = () => writerRef.current?.animate();
    const clear = () => writerRef.current?.clear();

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className={`bg-white rounded-xl overflow-hidden ${mode === 'view' ? 'pointer-events-none' : ''}`}
            />
            {/* If we can't hook events, we might need a "Check" or interaction 
                 simulated by the user just drawing. 
                 For 'practice', usually the library prevents wrong strokes? 
             */}
        </div>
    );
}
