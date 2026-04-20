"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { KanjiWriter, KanjiVGParser } from "kanji-recognizer";

interface KanjiCanvasProps {
    kanji: string;
    mode: "view" | "practice" | "challenge";
    onComplete?: () => void;
    onMistake?: () => void;
    animateOnLoad?: boolean;
}

export interface KanjiCanvasRef {
    animate: () => void;
    clear: () => void;
    hint: () => void;
    getCanvasImage: () => Promise<string | null>;
}

export const KanjiCanvas = forwardRef<KanjiCanvasRef, KanjiCanvasProps>(
    ({ kanji, mode, onComplete, animateOnLoad }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const writerRef = useRef<KanjiWriter | null>(null);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [isInitialized, setIsInitialized] = useState(false);

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            animate: () => writerRef.current?.animate(),
            clear: () => writerRef.current?.clear(),
            hint: () => writerRef.current?.hint(),
            getCanvasImage: async () => {
                try {
                    // Check if writer is initialized
                    if (!isInitialized || !writerRef.current) {
                        console.warn("KanjiCanvas: Writer not fully initialized yet");
                        return null;
                    }

                    // Check if exportImage method exists
                    if (typeof writerRef.current.exportImage !== 'function') {
                        console.error("KanjiCanvas: exportImage method not available on writer");
                        return null;
                    }

                    // Use the writer's built-in exportImage method
                    const dataUrl = await writerRef.current.exportImage({
                        includeGrid: false,
                        backgroundColor: '#ffffff'
                    });

                    if (!dataUrl) {
                        console.warn("KanjiCanvas: exportImage returned null or empty");
                        return null;
                    }

                    console.log("KanjiCanvas: Canvas image exported successfully using writer.exportImage(), size:", dataUrl.length);
                    return dataUrl;
                } catch (error) {
                    console.error("KanjiCanvas: Failed to export canvas image:", error);
                    return null;
                }
            }
        }));

        useEffect(() => {
            let isMounted = true;

            async function init() {
                if (!containerRef.current) return;
                setIsLoading(true);
                setError(null);

                try {
                    // Fetch SVG
                    const unicode = kanji.charCodeAt(0).toString(16).padStart(5, '0');
                    const res = await fetch(`/kanjivg/kanji/${unicode}.svg`);
                    if (!res.ok) throw new Error("Failed to load kanji SVG");
                    const text = await res.text();

                    const data = KanjiVGParser.parse(text);

                    if (!isMounted) return;

                    // Cleanup previous instance
                    if (writerRef.current?.destroy) {
                        writerRef.current.destroy();
                    }
                    containerRef.current.innerHTML = '';
                    setIsInitialized(false); // Reset initialization flag

                    const id = `kanji-canvas-${unicode}-${mode}`;
                    containerRef.current.id = id;

                    // Base options
                    const options: Record<string, unknown> = {
                        width: 300,
                        height: 300,
                        strokeColor: "#333",
                        correctColor: "#22c55e", // Green for success
                        incorrectColor: "#ef4444", // Red for mistakes
                        hintColor: "#06b6d4", // Cyan for hints
                        gridColor: "#ddd",
                        ghostColor: "#888", // Gray ghost strokes
                        showGrid: true,
                        showGhost: true, // Default: show ghost strokes
                        strokeWidth: 5,
                        ghostOpacity: "0.3",
                        stepDuration: 400,
                        snapDuration: 150,
                    };

                    // Mode specific settings
                    if (mode === "view") {
                        options.strokeWidth = 4;
                        options.showGhost = true;
                        options.ghostOpacity = "0.8"; // More visible in view mode
                    } else if (mode === "practice") {
                        options.strokeWidth = 6;
                        options.showGhost = true; // Show guide strokes
                        options.ghostOpacity = "0.4";
                        options.ghostColor = "#3b82f6"; // Blue for practice
                    } else if (mode === "challenge") {
                        options.strokeWidth = 6;
                        options.showGhost = false; // Hide all ghost strokes - draw from memory
                        options.gridColor = "#555"; // Darker grid for challenge
                        options.checkMode = "free"; // Disable automatic stroke filling
                    }

                    console.log(`KanjiCanvas: Initializing in ${mode} mode with showGhost=${options.showGhost}`);
                    writerRef.current = new KanjiWriter(id, data, options);

                    // Mark as initialized - canvas is ready
                    setIsInitialized(true);
                    console.log("KanjiCanvas: Writer initialized and ready");

                    // Wire up callbacks
                    if (mode !== "view") {
                        // onComplete fires when all strokes are drawn correctly
                        writerRef.current.onComplete = () => {
                            console.log("KanjiCanvas: All strokes completed!");
                            onComplete?.();
                        };
                    }

                    // Auto-animate in view mode
                    if (animateOnLoad && mode === "view") {
                        // Small delay to ensure DOM is ready
                        setTimeout(() => {
                            if (writerRef.current?.animate) {
                                writerRef.current.animate();
                            }
                        }, 100);
                    }

                } catch (e) {
                    console.error("KanjiCanvas error:", e);
                    setError(e instanceof Error ? e.message : "Failed to load kanji");
                } finally {
                    if (isMounted) {
                        setIsLoading(false);
                    }
                }
            }

            init();

            return () => {
                isMounted = false;
                // Cleanup on unmount
                if (writerRef.current?.destroy) {
                    writerRef.current.destroy();
                }
                writerRef.current = null;
                setIsInitialized(false);
            };
        }, [kanji, mode, animateOnLoad, onComplete]);

        return (
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-xl z-10">
                        <p className="text-red-500 text-sm px-4 text-center">{error}</p>
                    </div>
                )}
                <div
                    ref={containerRef}
                    className={`bg-white rounded-xl overflow-hidden ${mode === 'view' ? 'pointer-events-none' : ''}`}
                    style={{ minHeight: 300, minWidth: 300 }}
                />
            </div>
        );
    }
);

KanjiCanvas.displayName = "KanjiCanvas";
