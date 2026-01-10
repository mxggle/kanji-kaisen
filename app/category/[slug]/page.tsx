
"use client";

import { useEffect, useState, use } from "react";
import { CHECKPOINTS, getCategoryFromSlug, CategoryName } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { RadicalCard } from "@/components/Path/RadicalCard";
import { Heart, Flame, ArrowLeft } from "lucide-react";
import { LearningModal } from "@/components/Learning/LearningModal";
import Link from "next/link";
import { notFound } from "next/navigation";

// Use distinct themes mapping again matching CategorySection...
// Ideally we should export this theme map to share between components.
// For now, I'll inline a simplified version or reuse logic.
const THEME_COLORS: Record<string, string> = {
    "Nature & Elements": "text-emerald-400 border-emerald-800/50 bg-emerald-950/20",
    "Human Body & People": "text-blue-400 border-blue-800/50 bg-blue-950/20",
    "Action & Movement": "text-red-400 border-red-800/50 bg-red-950/20",
    "Structures & Home": "text-stone-400 border-stone-800/50 bg-stone-950/20",
    "Animals & Wildlife": "text-amber-400 border-amber-800/50 bg-amber-950/20",
    "Tools & Weapons": "text-slate-400 border-slate-800/50 bg-slate-950/20",
    "Communication & Thought": "text-purple-400 border-purple-800/50 bg-purple-950/20",
    "Textiles, Plants & Food": "text-lime-400 border-lime-800/50 bg-lime-950/20",
    "States & Attributes": "text-pink-400 border-pink-800/50 bg-pink-950/20",
    "Time & Sequence": "text-indigo-400 border-indigo-800/50 bg-indigo-950/20",
    "Others": "text-zinc-400 border-zinc-800/50 bg-zinc-950/20",
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { hearts, streak, completedCheckpoints, checkStreak } = useProgressStore();
    const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [slug, setSlug] = useState<string>("");

    useEffect(() => {
        params.then(p => setSlug(p.slug));
    }, [params]);

    useEffect(() => {
        setMounted(true);
        checkStreak();
    }, [checkStreak]);

    if (!mounted || !slug) return null;

    const categoryName = getCategoryFromSlug(slug);
    if (!categoryName) return notFound();

    const themeClass = THEME_COLORS[categoryName] || THEME_COLORS["Others"];

    // Filter Checkpoints
    const categoryCheckpoints = CHECKPOINTS.filter(c => (c as any).category === categoryName);

    const handleCheckpointClick = (id: string) => {
        setActiveCheckpointId(id);
    };

    return (
        <main className="min-h-screen bg-black text-white pb-20 pt-4 relative">
            {/* Status Bar */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
                <div className="flex items-center gap-6 pointer-events-auto bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                    <div className="flex items-center gap-1.5 text-rose-500">
                        <Heart size={20} fill="currentColor" className={hearts === 0 ? "text-gray-600" : ""} />
                        <span className="font-bold">{hearts}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-orange-500">
                        <Flame size={20} fill="currentColor" />
                        <span className="font-bold">{streak}</span>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="pt-8 pb-8 px-4 max-w-2xl mx-auto flex items-center gap-4">
                <Link href="/" className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className={`text-3xl font-bold ${themeClass.split(' ')[0]}`}>{categoryName}</h1>
                    <p className="text-white/40">{categoryCheckpoints.length} Radicals</p>
                </div>
            </div>

            {/* Path */}
            <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto px-4 pb-20 w-full">
                {categoryCheckpoints.map((checkpoint, index) => {
                    const isCompleted = !!completedCheckpoints[checkpoint.id];

                    // Category-specific check: first checkpoint in category is always unlocked,
                    // subsequent ones require the previous checkpoint in THIS category to be completed
                    const isUnlocked = index === 0 || !!completedCheckpoints[categoryCheckpoints[index - 1].id];

                    return (
                        <RadicalCard
                            key={checkpoint.id}
                            checkpoint={checkpoint}
                            isLocked={!isUnlocked}
                            isCompleted={isCompleted}
                            onClick={() => handleCheckpointClick(checkpoint.id)}
                            themeClass={themeClass}
                        />
                    );
                })}
            </div>

            {/* Learning Modal */}
            {activeCheckpointId && (
                <LearningModal
                    checkpointId={activeCheckpointId}
                    onClose={() => setActiveCheckpointId(null)}
                />
            )}
        </main>
    );
}
