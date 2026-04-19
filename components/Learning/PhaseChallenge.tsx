import { KanjiCanvas, KanjiCanvasRef } from "./KanjiCanvas";
import { KanjiReadingHeader } from "./KanjiReadingHeader";
import { KanjiData } from "@/types/kanji";
import { Trash2, Eye, EyeOff, CheckCircle, Sparkles, ChevronDown, ChevronUp, ArrowUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface AIFeedback {
    isRecognizable: boolean;
    confidence: number;
    strokeOrderIssues: string[];
    strokeFormIssues: string[];
    shapeIssues: string[];
    suggestions: string[];
}

type AudioContextConstructor = typeof AudioContext & {
    new(): AudioContext;
};

interface WindowWithWebkitAudioContext extends Window {
    webkitAudioContext?: AudioContextConstructor;
}

interface PhaseChallengeProps {
    data: KanjiData;
    onSuccess: () => void;
    onFail: () => void;
    checkpointId: string;
    checkpointTitle: string;
    category: string;
    kanjiIndex: number;
}

export function PhaseChallenge({
    data,
    onSuccess,
    onFail,
    checkpointId,
    checkpointTitle,
    category,
    kanjiIndex,
}: PhaseChallengeProps) {
    const [status, setStatus] = useState<"drawing" | "checking" | "success" | "fail">("drawing");
    const [showPeek, setShowPeek] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [showAIFeedback, setShowAIFeedback] = useState(false);
    const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
    const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
    const [showJumpBackHint, setShowJumpBackHint] = useState(false);
    const canvasRef = useRef<KanjiCanvasRef>(null);

    // Auto-hide peek after 1 second
    useEffect(() => {
        if (showPeek) {
            const timer = setTimeout(() => setShowPeek(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [showPeek]);

    // Auto-hide guide after 1.5 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowGuide(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleCheck = async () => {
        trackEvent("challenge_submitted", {
            checkpoint_id: checkpointId,
            checkpoint_title: checkpointTitle,
            category,
            kanji: data.char,
            kanji_index: kanjiIndex,
        });
        setStatus("checking");
        setShowFeedbackOverlay(false);

        try {
            // Get canvas image using the writer's exportImage API
            const imageData = await canvasRef.current?.getCanvasImage();

            if (!imageData) {
                console.error("PhaseChallenge: No canvas image available");
                // Show user-friendly error message
                alert("Please draw some strokes on the canvas before checking.");
                setStatus("drawing");
                return;
            }

            const response = await fetch('/api/analyze-kanji', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData,
                    expectedKanji: data.char,
                }),
            });

            const result = await response.json();

            if (result.feedback) {
                const feedback = result.feedback;
                setAiFeedback(feedback);
                setShowAIFeedback(true);
                setShowFeedbackOverlay(true);

                // Check if correct based on AI confidence
                if (feedback.isRecognizable && feedback.confidence >= 60) {
                    trackEvent("challenge_passed", {
                        checkpoint_id: checkpointId,
                        checkpoint_title: checkpointTitle,
                        category,
                        kanji: data.char,
                        kanji_index: kanjiIndex,
                        confidence: Math.round(feedback.confidence),
                    });
                    setStatus("success");
                    playSuccessSound();
                    // Don't auto-progress - let user click next themselves
                } else {
                    trackEvent("challenge_failed", {
                        checkpoint_id: checkpointId,
                        checkpoint_title: checkpointTitle,
                        category,
                        kanji: data.char,
                        kanji_index: kanjiIndex,
                        confidence: Math.round(feedback.confidence),
                        recognizable: feedback.isRecognizable,
                    });
                    setStatus("fail");
                    playFailSound();
                    onFail(); // Lose a heart when user gets wrong answer
                    setShowJumpBackHint(true); // Show hint to jump back
                    // Auto-hide hint after 5 seconds
                    setTimeout(() => setShowJumpBackHint(false), 5000);
                    // User can try again or move on manually
                }
            } else {
                // If no feedback, fail
                trackEvent("challenge_failed", {
                    checkpoint_id: checkpointId,
                    checkpoint_title: checkpointTitle,
                    category,
                    kanji: data.char,
                    kanji_index: kanjiIndex,
                    failure_reason: "missing_feedback",
                });
                setStatus("fail");
                onFail();
                setShowFeedbackOverlay(true);
                // setTimeout(() => {
                //     setStatus("drawing");
                // }, 2000);
            }
        } catch (error) {
            console.error("Failed to analyze kanji:", error);
            trackEvent("challenge_failed", {
                checkpoint_id: checkpointId,
                checkpoint_title: checkpointTitle,
                category,
                kanji: data.char,
                kanji_index: kanjiIndex,
                failure_reason: "request_error",
            });
            setStatus("fail");
            onFail();
            setShowFeedbackOverlay(true);
            // setTimeout(() => {
            //     setStatus("drawing");
            // }, 2000);
        }
    };

    const handleClear = () => {
        trackEvent("challenge_canvas_cleared", {
            checkpoint_id: checkpointId,
            checkpoint_title: checkpointTitle,
            category,
            kanji: data.char,
            kanji_index: kanjiIndex,
            status,
        });
        canvasRef.current?.clear();
        setStatus("drawing");
        setAiFeedback(null);
        setShowAIFeedback(false);
        setShowFeedbackOverlay(false);
        setShowJumpBackHint(false);
    };

    const handlePeek = () => {
        trackEvent("challenge_peek_used", {
            checkpoint_id: checkpointId,
            checkpoint_title: checkpointTitle,
            category,
            kanji: data.char,
            kanji_index: kanjiIndex,
        });
        setShowPeek(true);
    };

    // Simple audio feedback using Web Audio
    const playSuccessSound = () => {
        try {
            const AudioCtor = window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
            if (!AudioCtor) return;

            const audioContext = new AudioCtor();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
            oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2); // E6

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        } catch {
            console.log("Audio not available");
        }
    };

    const playFailSound = () => {
        try {
            const AudioCtor = window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
            if (!AudioCtor) return;

            const audioContext = new AudioCtor();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Low buzz

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch {
            console.log("Audio not available");
        }
    };

    return (
        <div className={`flex flex-col items-center w-full animate-in fade-in slide-in-from-right-8 duration-500 ${showAIFeedback ? 'pb-64' : 'pb-8'}`}>
            {/* Jump Back Hint - Points to phase navigator */}
            {showJumpBackHint && (
                <div className="w-full mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-amber-300">
                            <ArrowUp className="w-5 h-5 animate-bounce" />
                            <p className="text-sm font-medium">
                                Need to review? Jump back to <span className="font-bold text-amber-200">Memorize</span> or <span className="font-bold text-amber-200">Trace</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Feedback Drawer - Fixed at bottom, doesn't affect layout */}
            {showAIFeedback && aiFeedback && (
                status === "fail" ||
                aiFeedback.suggestions.length > 0 ||
                aiFeedback.strokeOrderIssues.length > 0 ||
                aiFeedback.strokeFormIssues.length > 0 ||
                aiFeedback.shapeIssues.length > 0
            ) && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-purple-900/95 to-blue-900/95 border-t border-purple-500/30 backdrop-blur-lg shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="max-w-2xl mx-auto">
                            {/* Drawer Header - Clickable */}
                            <button
                                onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-lg font-bold text-white">AI Feedback</h3>
                                    <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                                        {aiFeedback.confidence.toFixed(0)}%
                                    </span>
                                </div>
                                {isDrawerExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-purple-400" />
                                ) : (
                                    <ChevronUp className="w-5 h-5 text-purple-400" />
                                )}
                            </button>

                            {/* Drawer Content - Collapsible */}
                            {isDrawerExpanded && (
                                <div className="px-4 pb-4 space-y-3 max-h-[50vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Suggestions - Most Important */}
                                    {aiFeedback.suggestions && aiFeedback.suggestions.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-purple-300">💡 Tips:</p>
                                            <ul className="space-y-1">
                                                {aiFeedback.suggestions.slice(0, 3).map((suggestion, idx) => (
                                                    <li key={idx} className="text-xs text-white/90 pl-3 border-l-2 border-purple-400/50">
                                                        {suggestion}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Issues - Compact Grid */}
                                    <div className="grid gap-2">
                                        {aiFeedback.strokeOrderIssues && aiFeedback.strokeOrderIssues.length > 0 && (
                                            <div className="bg-orange-500/10 rounded-lg p-2">
                                                <p className="text-xs font-semibold text-orange-300 mb-1">⚠️ Order</p>
                                                <p className="text-xs text-white/80">{aiFeedback.strokeOrderIssues[0]}</p>
                                            </div>
                                        )}

                                        {aiFeedback.strokeFormIssues && aiFeedback.strokeFormIssues.length > 0 && (
                                            <div className="bg-yellow-500/10 rounded-lg p-2">
                                                <p className="text-xs font-semibold text-yellow-300 mb-1">✏️ Form</p>
                                                <p className="text-xs text-white/80">{aiFeedback.strokeFormIssues[0]}</p>
                                            </div>
                                        )}

                                        {aiFeedback.shapeIssues && aiFeedback.shapeIssues.length > 0 && (
                                            <div className="bg-blue-500/10 rounded-lg p-2">
                                                <p className="text-xs font-semibold text-blue-300 mb-1">📐 Shape</p>
                                                <p className="text-xs text-white/80">{aiFeedback.shapeIssues[0]}</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setShowAIFeedback(false)}
                                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            <div className="mb-2 w-full flex justify-center relative z-50">
                <KanjiReadingHeader data={data} />
            </div>

            <div className="relative mb-2 border-2 border-dashed border-zinc-700 rounded-xl p-1 bg-black">
                {/* Peek overlay */}
                {showPeek && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 rounded-xl">
                        <span className="text-9xl text-white/80 font-bold font-japanese">{data.char}</span>
                    </div>
                )}

                {/* Feedback Overlay */}
                {(status === "success" || status === "fail") && showFeedbackOverlay && (
                    <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 ${status === "success"
                        ? "bg-black/60"
                        : "bg-black/60"
                        }`}>
                        {/* Close button */}
                        <button
                            onClick={() => setShowFeedbackOverlay(false)}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <div className={`p-6 rounded-2xl border backdrop-blur-xl shadow-2xl max-w-[80%] w-full text-center transform transition-all ${status === "success"
                            ? "bg-green-500/10 border-green-500/20 shadow-green-500/10"
                            : "bg-red-500/10 border-red-500/20 shadow-red-500/10"
                            }`}>
                            <div className="text-5xl mb-4 animate-bounce">
                                {status === "success" ? "✅" : "❌"}
                            </div>

                            <h4 className={`text-2xl font-bold mb-2 ${status === "success" ? "text-green-400" : "text-red-400"
                                }`}>
                                {status === "success" ? "Perfect!" : "Not quite!"}
                            </h4>

                            {aiFeedback && (
                                <div className="space-y-1">
                                    <p className={`font-mono text-sm ${status === "success" ? "text-green-300/80" : "text-red-300/80"
                                        }`}>
                                        AI Confidence: {aiFeedback.confidence.toFixed(0)}%
                                    </p>
                                    {status === "fail" && (
                                        <p className="text-xs text-white/40 mt-2">
                                            Tap below to try again
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className={status !== "drawing" ? "pointer-events-none" : ""}>
                    <KanjiCanvas
                        ref={canvasRef}
                        kanji={data.char}
                        mode="challenge"
                    />
                </div>
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-1000 ${showGuide ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10 animate-pulse">
                        <span className="text-lg font-medium text-white/90">Draw from memory</span>
                    </div>
                </div>

                {status === "checking" && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-blue-500/20 rounded-xl backdrop-blur-sm">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                            <p className="text-white text-sm">Checking...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Removed standalone KanjiInfoDisplay - content now in header */}
            <div className="flex-1" />



            {/* Control buttons */}
            <div className="flex gap-3 mb-4 w-full max-w-xs z-10">
                <button
                    onClick={handleClear}
                    className="flex-1 py-2 bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm disabled:opacity-50"
                    disabled={status === "checking"}
                >
                    <Trash2 size={16} />
                    Clear
                </button>
                <button
                    onClick={handlePeek}
                    className="flex-1 py-2 bg-zinc-800 text-amber-400 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors text-sm disabled:opacity-50"
                    disabled={status === "checking"}
                >
                    {showPeek ? <EyeOff size={16} /> : <Eye size={16} />}
                    Peek
                </button>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 left-0 right-0 w-[calc(100%+2rem)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/95 to-transparent pt-6 -mx-4 mt-auto z-40">
                {/* Check button - prominent */}
                {status === "drawing" && (
                    <button
                        onClick={handleCheck}
                        className="w-full max-w-md py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl flex items-center justify-center gap-2 hover:from-cyan-600 hover:to-blue-600 transition-all font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                    >
                        <CheckCircle size={24} />
                        Check Answer
                    </button>
                )}

                {/* Action buttons after check */}
                {status === "success" && (
                    <div className="w-full max-w-md space-y-3">
                        <button
                            onClick={() => {
                                // User manually proceeds to next kanji
                                trackEvent("challenge_continue_clicked", {
                                    checkpoint_id: checkpointId,
                                    checkpoint_title: checkpointTitle,
                                    category,
                                    kanji: data.char,
                                    kanji_index: kanjiIndex,
                                });
                                onSuccess();
                            }}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all font-bold text-lg shadow-lg shadow-green-500/20 active:scale-[0.98]"
                        >
                            Continue →
                        </button>
                        <button
                            onClick={() => {
                                trackEvent("challenge_practice_again_clicked", {
                                    checkpoint_id: checkpointId,
                                    checkpoint_title: checkpointTitle,
                                    category,
                                    kanji: data.char,
                                    kanji_index: kanjiIndex,
                                });
                                setStatus("drawing");
                                setAiFeedback(null);
                                setShowAIFeedback(false);
                                setShowFeedbackOverlay(false);
                                canvasRef.current?.clear();
                            }}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                        >
                            Practice Again
                        </button>
                    </div>
                )}

                {status === "fail" && (
                    <div className="w-full max-w-md space-y-3">
                        <button
                            onClick={() => {
                                trackEvent("challenge_retry_clicked", {
                                    checkpoint_id: checkpointId,
                                    checkpoint_title: checkpointTitle,
                                    category,
                                    kanji: data.char,
                                    kanji_index: kanjiIndex,
                                });
                                setStatus("drawing");
                                setAiFeedback(null);
                                setShowAIFeedback(false);
                                setShowFeedbackOverlay(false);
                                canvasRef.current?.clear();
                            }}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 transition-all font-bold text-lg shadow-lg shadow-red-500/20 active:scale-[0.98]"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => {
                                trackEvent("challenge_skipped", {
                                    checkpoint_id: checkpointId,
                                    checkpoint_title: checkpointTitle,
                                    category,
                                    kanji: data.char,
                                    kanji_index: kanjiIndex,
                                });
                                onSuccess(); // Move to next kanji (heart already lost)
                            }}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                        >
                            Skip to Next
                        </button>
                    </div>
                )}
            </div>


        </div>
    );
}
