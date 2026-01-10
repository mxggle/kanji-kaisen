import { KanjiCanvas, KanjiCanvasRef } from "./KanjiCanvas";
import { KanjiData } from "@/types/kanji";
import { Trash2, Undo2, Eye, EyeOff, CheckCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AIFeedback {
    isRecognizable: boolean;
    confidence: number;
    strokeOrderIssues: string[];
    strokeFormIssues: string[];
    shapeIssues: string[];
    suggestions: string[];
}

interface PhaseChallengeProps {
    data: KanjiData;
    onSuccess: () => void;
    onFail: () => void;
}

export function PhaseChallenge({ data, onSuccess, onFail }: PhaseChallengeProps) {
    const [status, setStatus] = useState<"drawing" | "checking" | "success" | "fail">("drawing");
    const [showPeek, setShowPeek] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [showAIFeedback, setShowAIFeedback] = useState(false);
    const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
    const canvasRef = useRef<KanjiCanvasRef>(null);

    // Auto-hide peek after 1 second
    useEffect(() => {
        if (showPeek) {
            const timer = setTimeout(() => setShowPeek(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [showPeek]);

    const handleCheck = async () => {
        setStatus("checking");

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

                // Check if correct based on AI confidence
                if (feedback.isRecognizable && feedback.confidence >= 60) {
                    setStatus("success");
                    playSuccessSound();
                    // Don't auto-progress - let user click next themselves
                } else {
                    setStatus("fail");
                    playFailSound();
                    onFail(); // Lose a heart when user gets wrong answer
                    // User can try again or move on manually
                }
            } else {
                // If no feedback, fail
                setStatus("fail");
                onFail();
                setTimeout(() => {
                    setStatus("drawing");
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to analyze kanji:", error);
            setStatus("fail");
            onFail();
            setTimeout(() => {
                setStatus("drawing");
            }, 2000);
        }
    };

    const handleClear = () => {
        canvasRef.current?.clear();
        setStatus("drawing");
        setAiFeedback(null);
        setShowAIFeedback(false);
    };

    const handleUndo = () => {
        // KanjiCanvas doesn't have undo in challenge mode, just use clear
        canvasRef.current?.clear();
    };

    const handlePeek = () => {
        setShowPeek(true);
    };

    // Simple audio feedback using Web Audio
    const playSuccessSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        } catch (e) {
            console.log("Audio not available");
        }
    };

    const playFailSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Low buzz

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log("Audio not available");
        }
    };

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-xl font-bold mb-2 text-zinc-400">Phase 3: Recall</h3>
            <p className="text-sm text-zinc-500 mb-4">Draw the kanji from memory, then check</p>

            {/* AI Feedback Drawer - Always show on failure, hide on success if no issues */}
            {showAIFeedback && aiFeedback && (
                status === "fail" ||
                aiFeedback.suggestions.length > 0 ||
                aiFeedback.strokeOrderIssues.length > 0 ||
                aiFeedback.strokeFormIssues.length > 0 ||
                aiFeedback.shapeIssues.length > 0
            ) && (
                    <div className="w-full max-w-md mb-4 bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                <ChevronUp className="w-5 h-5 text-purple-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-purple-400" />
                            )}
                        </button>

                        {/* Drawer Content - Collapsible */}
                        {isDrawerExpanded && (
                            <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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
                )}

            <div className="relative mb-6 border-2 border-dashed border-zinc-700 rounded-xl p-1 bg-black">
                {/* Peek overlay */}
                {showPeek && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 rounded-xl">
                        <span className="text-9xl text-white/80 font-bold font-japanese">{data.char}</span>
                    </div>
                )}

                <KanjiCanvas
                    ref={canvasRef}
                    kanji={data.char}
                    mode="challenge"
                />

                {status === "success" && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-green-500/20 rounded-xl backdrop-blur-sm">
                        <div className="text-center">
                            <span className="text-6xl">✅</span>
                            <p className="text-white text-lg font-bold mt-2">Perfect!</p>
                            {aiFeedback && (
                                <p className="text-green-400 text-sm mt-1">
                                    AI Confidence: {aiFeedback.confidence.toFixed(0)}%
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {status === "fail" && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm">
                        <div className="text-center">
                            <span className="text-6xl">❌</span>
                            <p className="text-white text-lg font-bold mt-2">Not quite!</p>
                            {aiFeedback && (
                                <>
                                    <p className="text-white/70 text-sm mt-1">
                                        AI Confidence: {aiFeedback.confidence.toFixed(0)}%
                                    </p>
                                    <p className="text-white/50 text-xs mt-1">
                                        Check the feedback above
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {status === "checking" && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-blue-500/20 rounded-xl backdrop-blur-sm">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                            <p className="text-white text-sm">Checking...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">{data.meaning}</h2>
                <div className="flex flex-col gap-0.5 text-sm text-zinc-500">
                    <span><span className="text-[var(--n5)]">On:</span> {data.onyomi.join(", ")}</span>
                    <span><span className="text-[var(--accent)]">Kun:</span> {data.kunyomi.join(", ")}</span>
                </div>
            </div>



            {/* Check button - prominent */}
            {status === "drawing" && (
                <button
                    onClick={handleCheck}
                    className="w-full max-w-md py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl flex items-center justify-center gap-2 hover:from-cyan-600 hover:to-blue-600 transition-all font-bold text-lg shadow-lg"
                >
                    <CheckCircle size={24} />
                    Check Answer
                </button>
            )}

            {/* Action buttons after check */}
            {status === "success" && (
                <div className="w-full max-w-md space-y-3 mt-4">
                    <button
                        onClick={() => {
                            // User manually proceeds to next kanji
                            onSuccess();
                        }}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all font-bold text-lg shadow-lg"
                    >
                        Continue →
                    </button>
                    <button
                        onClick={() => {
                            setStatus("drawing");
                            setAiFeedback(null);
                            setShowAIFeedback(false);
                            canvasRef.current?.clear();
                        }}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                        Practice Again
                    </button>
                </div>
            )}

            {status === "fail" && (
                <div className="w-full max-w-md space-y-3 mt-4">
                    <button
                        onClick={() => {
                            setStatus("drawing");
                            setAiFeedback(null);
                            setShowAIFeedback(false);
                            canvasRef.current?.clear();
                        }}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 transition-all font-bold text-lg shadow-lg"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => {
                            onSuccess(); // Move to next kanji (heart already lost)
                        }}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                        Skip to Next
                    </button>
                </div>
            )}
            {/* Control buttons */}
            <div className="flex gap-3 w-full max-w-md mt-4">
                <button
                    onClick={handleClear}
                    className="flex-1 py-3 bg-zinc-800 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    disabled={status === "checking"}
                >
                    <Trash2 size={18} />
                    Clear
                </button>
                <button
                    onClick={handlePeek}
                    className="flex-1 py-3 bg-zinc-800 text-amber-400 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    disabled={status === "checking"}
                >
                    {showPeek ? <EyeOff size={18} /> : <Eye size={18} />}
                    Peek
                </button>
            </div>
        </div>
    );
}
