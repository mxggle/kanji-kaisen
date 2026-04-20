import { KanjiCanvas, KanjiCanvasRef } from "./KanjiCanvas";
import { KanjiReadingHeader } from "./KanjiReadingHeader";
import { KanjiData } from "@/types/kanji";
import { ArrowRight, Trash2, Lightbulb } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface PhasePracticeProps {
    data: KanjiData;
    onNext: () => void;
    onSkipForToday?: () => void;
    showSkipForToday?: boolean;
    checkpointId?: string;
    checkpointTitle?: string;
    category?: string;
    kanjiIndex?: number;
}

export function PhasePractice({
    data,
    onNext,
    onSkipForToday,
    showSkipForToday = false,
    checkpointId,
    checkpointTitle,
    category,
    kanjiIndex,
}: PhasePracticeProps) {
    const canvasRef = useRef<KanjiCanvasRef>(null);
    const [showGuide, setShowGuide] = useState(true);
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowGuide(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleClear = () => {
        canvasRef.current?.clear();
    };

    const handleHint = () => {
        canvasRef.current?.hint();
    };

    const handleSkipForToday = () => {
        setShowSkipConfirmation(true);
    };

    const handleCancelSkipForToday = () => {
        setShowSkipConfirmation(false);
    };

    const handleConfirmSkipForToday = () => {
        trackEvent("handwriting_skipped_for_today", {
            checkpoint_id: checkpointId,
            checkpoint_title: checkpointTitle,
            category,
            kanji: data.char,
            kanji_index: kanjiIndex,
            source: "practice",
        });
        setShowSkipConfirmation(false);
        onSkipForToday?.();
    };

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-2 w-full flex justify-center relative z-50">
                <KanjiReadingHeader data={data} />
            </div>

            <div className="mb-2 relative">
                <KanjiCanvas
                    ref={canvasRef}
                    kanji={data.char}
                    mode="practice"
                />
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-1000 ${showGuide ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10 animate-pulse">
                        <span className="text-lg font-medium text-white/90">Follow blue guides</span>
                    </div>
                </div>
            </div>

            {/* Removed standalone KanjiInfoDisplay - content now in header */}
            <div className="flex-1" />

            {/* Control buttons - keep with content */}
            <div className="flex gap-3 mb-4 w-full max-w-xs z-10">
                <button
                    onClick={handleClear}
                    className="flex-1 py-2 bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm"
                >
                    <Trash2 size={16} />
                    Clear
                </button>
                <button
                    onClick={handleHint}
                    className="flex-1 py-2 bg-zinc-800 text-amber-400 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm"
                >
                    <Lightbulb size={16} />
                    Hint
                </button>
            </div>

            {showSkipConfirmation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={handleCancelSkipForToday}
                    />
                    <div className="relative w-full max-w-[320px] rounded-2xl border border-white/10 bg-zinc-900/90 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                        <h3 className="text-lg font-bold text-white mb-2 text-center">
                            Skip handwriting?
                        </h3>
                        <p className="text-sm text-zinc-400 mb-6 text-center leading-relaxed">
                            Skip handwriting practice until tomorrow. Restore anytime from Settings.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCancelSkipForToday}
                                className="py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSkipForToday}
                                className="py-2.5 rounded-xl bg-cyan-400 text-black text-sm font-bold hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
                            >
                                Skip Today
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="sticky bottom-0 left-0 right-0 w-[calc(100%+2rem)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/95 to-transparent pt-6 -mx-4 mt-auto">
                <div className="space-y-3">
                    <button
                        onClick={onNext}
                        className="w-full py-4 bg-[var(--accent)] text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-[#1eeeee] transition-colors shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
                    >
                        I&apos;m Ready <ArrowRight />
                    </button>
                    {showSkipForToday && onSkipForToday && (
                        <button
                            onClick={handleSkipForToday}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                        >
                            Skip handwriting for today
                        </button>
                    )}
                </div>
            </div>

            {/* Spacer */}
            <div className="h-4" />
        </div>
    );
}
