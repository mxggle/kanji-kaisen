"use client";

import { CHECKPOINTS } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { KANJI_DATA } from "@/lib/data";
import { X, Heart, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

import { PhaseInfo } from "./PhaseInfo";
import { PhasePractice } from "./PhasePractice";
import { PhaseChallenge } from "./PhaseChallenge";
import { PhaseNavigator } from "./PhaseNavigator";

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
    const hasTrackedOpen = useRef(false);
    const hasTrackedOutOfHearts = useRef(false);
    const trackedPhaseViews = useRef(new Set<string>());
    const previousHearts = useRef(hearts);

    // Derived
    const currentChar = checkpoint?.kanji[currentIndex];
    const currentData = KANJI_DATA.find(k => k.char === currentChar);

    // Disable body scroll when modal is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    useEffect(() => {
        if (!checkpoint || hasTrackedOpen.current) return;

        hasTrackedOpen.current = true;
        trackEvent("learning_modal_opened", {
            checkpoint_id: checkpoint.id,
            checkpoint_title: checkpoint.title,
            category: checkpoint.category,
            kanji_count: checkpoint.kanji.length,
            hearts,
        });
    }, [checkpoint, hearts]);

    useEffect(() => {
        if (!checkpoint || !currentChar) return;

        const key = `${checkpoint.id}:${currentChar}:${phase}`;
        if (trackedPhaseViews.current.has(key)) return;

        trackedPhaseViews.current.add(key);
        trackEvent("learning_phase_viewed", {
            checkpoint_id: checkpoint.id,
            checkpoint_title: checkpoint.title,
            category: checkpoint.category,
            kanji: currentChar,
            kanji_index: currentIndex + 1,
            phase,
            hearts,
        });

        if (phase === "practice") {
            trackEvent("practice_started", {
                checkpoint_id: checkpoint.id,
                checkpoint_title: checkpoint.title,
                category: checkpoint.category,
                kanji: currentChar,
                kanji_index: currentIndex + 1,
            });
        }
    }, [checkpoint, currentChar, currentIndex, phase, hearts]);

    useEffect(() => {
        if (!checkpoint) return;

        if (hearts < previousHearts.current) {
            trackEvent("heart_lost", {
                checkpoint_id: checkpoint.id,
                checkpoint_title: checkpoint.title,
                category: checkpoint.category,
                kanji: currentChar,
                hearts_remaining: hearts,
            });
        }

        previousHearts.current = hearts;
    }, [checkpoint, currentChar, hearts]);

    useEffect(() => {
        if (!checkpoint || hearts > 0 || hasTrackedOutOfHearts.current) return;

        hasTrackedOutOfHearts.current = true;
        trackEvent("out_of_hearts", {
            checkpoint_id: checkpoint.id,
            checkpoint_title: checkpoint.title,
            category: checkpoint.category,
        });
    }, [checkpoint, hearts]);

    // Handlers
    const handleNextPhase = () => {
        if (phase === "info") setPhase("practice");
        else if (phase === "practice") setPhase("challenge");
    };

    const handleChallengeSuccess = () => {
        if (!checkpoint) return;

        // Advance to next Kanji or Finish
        if (currentIndex < checkpoint.kanji.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setPhase("info");
        } else {
            // Checkpoint Complete!
            completeCheckpoint(checkpointId);
            trackEvent("checkpoint_completed", {
                checkpoint_id: checkpoint.id,
                checkpoint_title: checkpoint.title,
                category: checkpoint.category,
                kanji_count: checkpoint.kanji.length,
                hearts_remaining: hearts,
            });
            setIsCompleted(true);
        }
    };

    const handleChallengeFail = () => {
        loseHeart();
        // If hearts 0, probably should show Game Over, but store handles the number.
        // We might want to shake or show visual feedback.
    };

    const handlePhaseChange = (newPhase: Phase) => {
        setPhase(newPhase);
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
                    <p className="text-zinc-400 mb-6">You&apos;ve learned {checkpoint.kanji.length} new kanji.</p>
                    <button onClick={onClose} className="w-full py-3 bg-[var(--n5)] text-black font-bold rounded-lg hover:opacity-90">
                        Continue Path
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black backdrop-blur-md flex flex-col w-full h-full">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-2 max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                        <X size={20} />
                    </button>
                    <a 
                        href="https://kanjikaisen.featurebase.app/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={() => trackEvent("feedback_clicked", {
                            source: "learning_modal_topbar",
                            checkpoint_id: checkpoint.id,
                            checkpoint_title: checkpoint.title,
                            category: checkpoint.category,
                        })}
                        className="p-2 bg-white/5 rounded-full hover:bg-white/20 text-zinc-400 hover:text-white transition-colors"
                        title="Give Feedback or Report a Bug"
                    >
                        <MessageSquare size={18} />
                    </a>
                </div>

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
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 w-full max-w-md mx-auto">
                {/* Phase Navigator */}
                <PhaseNavigator currentPhase={phase} onPhaseChange={handlePhaseChange} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentIndex}-${phase}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full min-h-full flex items-start justify-center py-4"
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
                                checkpointId={checkpoint.id}
                                checkpointTitle={checkpoint.title}
                                category={checkpoint.category}
                                kanjiIndex={currentIndex + 1}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Form/Feedback Link */}
            <div className="py-2 text-center pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <a 
                    href="https://kanjikaisen.featurebase.app/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => trackEvent("feedback_clicked", {
                        source: "learning_modal_footer",
                        checkpoint_id: checkpoint.id,
                        checkpoint_title: checkpoint.title,
                        category: checkpoint.category,
                    })}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <MessageSquare size={12} />
                    Have feedback or found a bug?
                </a>
            </div>
        </div>
    );
}
