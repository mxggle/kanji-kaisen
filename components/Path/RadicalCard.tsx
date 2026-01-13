"use client";

import { useState } from "react";
import { Checkpoint } from "@/lib/checkpoints";
import { Lock, Check, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadicalStoryModal } from "@/components/Story/RadicalStoryModal";

interface RadicalCardProps {
    checkpoint: Checkpoint;
    isLocked: boolean;
    isCompleted: boolean;
    onClick: () => void;
    themeClass: string; // "text-emerald-400 border-emerald-800/50 bg-emerald-950/20"
}

export function RadicalCard({ checkpoint, isLocked, isCompleted, onClick, themeClass }: RadicalCardProps) {
    const [showStory, setShowStory] = useState(false);

    const handleInfoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowStory(true);
    };

    const handleCardClick = () => {
        if (!isLocked) {
            onClick();
        }
    };

    return (
        <>
            <button
                onClick={handleCardClick}
                disabled={isLocked}
                className={cn(
                    "relative w-full max-w-2xl h-32 rounded-3xl overflow-hidden border transition-all duration-300 group text-left",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isLocked
                        ? "bg-zinc-900/50 border-zinc-800 cursor-not-allowed opacity-60"
                        : `${themeClass} backdrop-blur-sm border-opacity-50 hover:border-opacity-100`
                )}
            >


                {/* Background Watermark Image (The Radical itself) */}
                <div className={cn(
                    "absolute -right-4 -bottom-8 text-9xl font-serif opacity-10 pointer-events-none select-none transition-transform duration-500",
                    !isLocked && "group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-20",
                    isCompleted && "text-amber-500 opacity-20"
                )}>
                    {checkpoint.radical}
                </div>

                {/* Content Container */}
                <div className="relative h-full px-8 py-6 flex items-center justify-between z-10">
                    <div className="flex flex-col h-full justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            {/* Icon/Status */}
                            {isLocked ? (
                                <Lock size={16} className="text-zinc-500" />
                            ) : isCompleted ? (
                                <div className="bg-amber-500 text-black p-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            ) : (
                                <div className={cn("w-2 h-2 rounded-full", themeClass.split(' ')[0].replace('text-', 'bg-'))} />
                            )}

                            <span className={cn(
                                "text-sm font-bold tracking-widest uppercase opacity-70",
                                isLocked ? "text-zinc-500" : isCompleted ? "text-amber-500" : "text-white/60"
                            )}>
                                {checkpoint.level}
                            </span>
                        </div>

                        <h3 className={cn(
                            "text-2xl font-bold tracking-tight",
                            isLocked ? "text-zinc-500" : isCompleted ? "text-amber-50" : "text-white"
                        )}>
                            {checkpoint.title}
                        </h3>

                        <p className={cn(
                            "text-sm mt-1",
                            isLocked ? "text-zinc-600" : isCompleted ? "text-amber-500/60" : "text-white/40"
                        )}>
                            {checkpoint.kanji.length} Kanji Unlocked
                        </p>
                    </div>

                    {/* Right Side: Info Button + Radical Display */}
                    <div className="flex items-center gap-3">
                        {/* Info Button */}
                        {!isLocked && (
                            <button
                                onClick={handleInfoClick}
                                className={cn(
                                    "p-3 rounded-xl bg-white/10 hover:bg-white/20",
                                    isCompleted ? "text-amber-500" : themeClass.split(' ')[0],
                                    "transition-all duration-200",
                                    "opacity-60 group-hover:opacity-100",
                                    "hover:scale-110 active:scale-95"
                                )}
                                title="Learn about this radical"
                            >
                                <BookOpen size={24} />
                            </button>
                        )}

                        {/* Radical Display */}
                        <div className={cn(
                            "flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-colors duration-300",
                            isLocked
                                ? "border-zinc-800 bg-zinc-800/50 text-zinc-600"
                                : isCompleted
                                    ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                                    : "border-white/10 bg-white/5 backdrop-blur-md"
                        )}>
                            <span className="text-3xl font-serif">{checkpoint.radical}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar for completed items */}
                {isCompleted && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 animate-shimmer bg-[length:200%_100%]" />
                )}
            </button>

            {/* Story Modal */}
            {showStory && (
                <RadicalStoryModal
                    radicalChar={checkpoint.radical}
                    onClose={() => setShowStory(false)}
                    themeClass={themeClass}
                />
            )}
        </>
    );
}

