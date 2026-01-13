
"use client";

import { useEffect, useState, use } from "react";
import { CHECKPOINTS, getCategoryFromSlug, CategoryName } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { RadicalCard } from "@/components/Path/RadicalCard";
import { ArrowLeft, BookOpen } from "lucide-react";
import { LearningModal } from "@/components/Learning/LearningModal";
import { CategoryStoryModal } from "@/components/Story/CategoryStoryModal";
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
    const [showCategoryStory, setShowCategoryStory] = useState(false);
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
        <main className="min-h-screen bg-black text-white pb-20 pt-24 relative">
            {/* Header */}
            <div className="pt-8 pb-8 px-4 max-w-2xl mx-auto flex items-center gap-4">
                <Link href="/" className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex-1">
                    <h1 className={`text-3xl font-bold ${themeClass.split(' ')[0]}`}>{categoryName}</h1>
                    <p className="text-white/40">{categoryCheckpoints.length} Radicals</p>
                </div>
                <button
                    onClick={() => setShowCategoryStory(true)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-white/5 hover:bg-white/10 transition-all duration-200
                        ${themeClass.split(' ')[0]} border ${themeClass.split(' ')[1]}
                        hover:scale-105 active:scale-95
                    `}
                    title="Learn about this category"
                >
                    <BookOpen size={18} />
                    <span className="text-sm font-medium hidden sm:inline">About</span>
                </button>
            </div>

            {/* Path */}
            <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto px-4 pb-20 w-full">
                {categoryCheckpoints.map((checkpoint, index) => {
                    const isCompleted = !!completedCheckpoints[checkpoint.id];

                    // All checkpoints unlocked for now
                    const isUnlocked = true;

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

            {/* Category Story Modal */}
            {showCategoryStory && categoryName && (
                <CategoryStoryModal
                    category={categoryName}
                    onClose={() => setShowCategoryStory(false)}
                    themeClass={themeClass}
                />
            )}
        </main>
    );
}
