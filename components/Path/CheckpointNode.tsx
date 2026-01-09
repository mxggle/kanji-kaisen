import { Checkpoint } from "@/lib/checkpoints";
import { Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckpointNodeProps {
    checkpoint: Checkpoint;
    isLocked: boolean;
    isCompleted: boolean;
    onClick: () => void;
    index: number;
}

export function CheckpointNode({ checkpoint, isLocked, isCompleted, onClick, index }: CheckpointNodeProps) {
    // Generate a sin wave pattern for the path
    const offset = Math.sin(index) * 60; // 60px amplitude

    return (
        <div
            className={cn(
                "relative flex items-center justify-center w-full py-8",
                "transition-all duration-300"
            )}
            style={{ transform: `translateX(${offset}px)` }}
        >
            <button
                onClick={onClick}
                disabled={isLocked}
                className={cn(
                    "relative w-24 h-24 rounded-full flex flex-col items-center justify-center",
                    "border-4 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95",
                    isLocked
                        ? "bg-zinc-800 border-zinc-700 text-zinc-600 grayscale"
                        : isCompleted
                            ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-amber-500/20"
                            : "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)] shadow-[var(--accent)]/20"
                )}
            >
                {isCompleted && (
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-black p-1 rounded-full shadow-lg animate-bounce">
                        <Star size={16} fill="currentColor" />
                    </div>
                )}

                {isLocked ? (
                    <Lock size={32} />
                ) : (
                    <span className="text-4xl font-bold mb-1">{checkpoint.radical}</span>
                )}

                <span className="text-xs font-medium max-w-[80px] truncate px-1">
                    {checkpoint.title}
                </span>
            </button>

            {/* Connector Line Logic would go here in parent, or we can use pseudo-elements */}
        </div>
    );
}
