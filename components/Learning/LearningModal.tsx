"use client";

import { Checkpoint, CHECKPOINTS, getNextCheckpointId } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { KANJI_DATA } from "@/lib/data";
import { X, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PhaseInfo } from "./PhaseInfo";
import { PhasePractice } from "./PhasePractice";
import { PhaseChallenge } from "./PhaseChallenge";

interface LearningModalProps {
    checkpointId: string;
    onClose: () => void;
}

type Phase = "info" | "practice" | "challenge";

export function LearningModal({ checkpointId, onClose }: LearningModalProps) {
    const checkpoint = CHECKPOINTS.find(c => c.id === checkpointId);

    // Store
    const { hearts, loseHeart, completeCheckpoint } = useProgressStore();

    // Local State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>("info");
    const [isCompleted, setIsCompleted] = useState(false);

    // Derived
    const currentChar = checkpoint?.kanji[currentIndex];
    const currentData = KANJI_DATA.find(k => k.char === currentChar);

    // Handlers
    const handleNextPhase = () => {
        if (phase === "info") setPhase("practice");
        else if (phase === "practice") setPhase("challenge");
    };

    const handleChallengeSuccess = () => {
        // Advance to next Kanji or Finish
        if (checkpoint && currentIndex < checkpoint.kanji.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setPhase("info");
        } else {
            // Checkpoint Complete!
            completeCheckpoint(checkpointId);
            setIsCompleted(true);
        }
    };

    const handleChallengeFail = () => {
        loseHeart();
        // If hearts 0, probably should show Game Over, but store handles the number.
        // We might want to shake or show visual feedback.
    };

    if (!checkpoint || !currentChar || !currentData) return null;

    if (hearts <= 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center max-w-sm w-full">
                    <Heart size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Out of Hearts!</h2>
                    <p className="text-zinc-400 mb-6">Rest up and try again tomorrow.</p>
                    <button onClick={onClose} className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200">
                        Close
                    </button>
                    {/* Dev backdoor to restore hearts? Or use store action elsewhere */}
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-[var(--n5)] p-8 rounded-2xl text-center max-w-sm w-full animate-in zoom-in-50 duration-300">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold mb-2 text-[var(--n5)]">Checkpoint Mastered!</h2>
                    <p className="text-zinc-400 mb-6">You've learned {checkpoint.kanji.length} new kanji.</p>
                    <button onClick={onClose} className="w-full py-3 bg-[var(--n5)] text-black font-bold rounded-lg hover:opacity-90">
                        Continue Path
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 max-w-3xl mx-auto w-full">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-sm text-zinc-400 font-medium">
                        {currentIndex + 1} / {checkpoint.kanji.length}
                    </span>
                    <div className="flex gap-1 mt-1">
                        {checkpoint.kanji.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 w-4 rounded-full transition-colors ${idx < currentIndex ? "bg-[var(--n5)]" :
                                        idx === currentIndex ? "bg-white" : "bg-zinc-800"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-1 text-rose-500 font-bold">
                    <Heart fill="currentColor" size={20} />
                    <span>{hearts}</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex items-center justify-center p-4 w-full max-w-md mx-auto relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentIndex}-${phase}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        {phase === "info" && (
                            <PhaseInfo data={currentData} onNext={handleNextPhase} />
                        )}
                        {phase === "practice" && (
                            <PhasePractice data={currentData} onNext={handleNextPhase} />
                        )}
                        {phase === "challenge" && (
                            <PhaseChallenge
                                data={currentData}
                                onSuccess={handleChallengeSuccess}
                                onFail={handleChallengeFail}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
