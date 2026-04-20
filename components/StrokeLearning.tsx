"use client";

import { useEffect, useRef, useState } from "react";
import { KanjiWriter, KanjiVGParser } from "kanji-recognizer";
import { Trash2, Play, Lightbulb } from "lucide-react";

interface StrokeLearningProps {
    kanji: string;
}

export function StrokeLearning({ kanji }: StrokeLearningProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const writerRef = useRef<KanjiWriter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const container = containerRef.current;

        async function initWriter() {
            if (!container) return;

            try {
                setIsLoading(true);
                setError(null);

                // Clear previous content
                container.innerHTML = '';

                // Convert char to unicode hex for KanjiVG (e.g. "日" -> "65e5")
                const unicode = kanji.charCodeAt(0).toString(16).padStart(5, '0');

                // Fetch SVG data from local public folder
                const response = await fetch(`/kanjivg/kanji/${unicode}.svg`);

                if (!response.ok) {
                    throw new Error("Failed to load Kanji data");
                }

                const svgText = await response.text();

                const data = KanjiVGParser.parse(svgText);

                if (!data) {
                    throw new Error("Parsed data is empty");
                }

                // Initialize Writer
                // The library expects (elementId, data, options)
                // We need to ensure the container has an ID
                const containerId = "kanji-writer-container";
                container.id = containerId;

                writerRef.current = new KanjiWriter(
                    containerId,
                    data,
                    {
                        width: 400,
                        height: 400,
                        showGrid: true,
                        stepDuration: 300,
                        strokeWidth: 6,
                        strokeColor: "#333",
                    }
                );

                // Do not auto-animate anymore as per user request

            } catch (err) {
                console.error("Failed to init kanji writer:", err);
                setError("Failed to load stroke data");
            } finally {
                setIsLoading(false);
            }
        }

        initWriter();

        return () => {
            // Cleanup
            if (container) {
                container.innerHTML = '';
            }
            writerRef.current = null;
        };
    }, [kanji]);

    const handleHint = () => {
        writerRef.current?.hint();
    };

    const handleAnimate = () => {
        writerRef.current?.animate();
    };

    const handleClear = () => {
        writerRef.current?.clear();
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/20 rounded-xl backdrop-blur-sm border border-white/10">
            <h2 className="text-xl font-bold mb-4 text-white/90">Stroke Order Practice</h2>

            <div className="relative mb-2">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
                        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {error ? (
                    <div className="w-[400px] h-[400px] flex items-center justify-center text-red-400">
                        {error}
                    </div>
                ) : (
                    <div ref={containerRef} className="bg-white rounded-lg shadow-lg overflow-hidden" />
                )}
            </div>

            <div className="flex gap-2 mb-4 w-full max-w-sm z-10">
                <button
                    onClick={handleHint}
                    className="flex-1 py-2 bg-zinc-800 text-amber-400 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                    <Lightbulb size={16} />
                    Hint
                </button>
                <button
                    onClick={handleAnimate}
                    className="flex-1 py-2 bg-zinc-800 text-cyan-400 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                    <Play size={16} />
                    Animation
                </button>
                <button
                    onClick={handleClear}
                    className="flex-1 py-2 bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                    <Trash2 size={16} />
                    Clear
                </button>
            </div>

            <p className="text-sm text-white/50">
                Draw here or use the buttons for guidance!
            </p>
        </div>
    );
}
