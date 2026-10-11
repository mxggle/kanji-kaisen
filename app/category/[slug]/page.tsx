
"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CHECKPOINTS, getCategoryFromSlug } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { RadicalCard } from "@/components/Path/RadicalCard";
import { ArrowLeft, BookOpen } from "lucide-react";
import { LearningModal } from "@/components/Learning/LearningModal";
import { CategoryStoryModal } from "@/components/Story/CategoryStoryModal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getCategoryTheme } from "@/lib/category-theme";

function subscribeHydration() {
    return () => {};
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { hearts, streak, completedCheckpoints, checkStreak } = useProgressStore();
    const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);
    const [showCategoryStory, setShowCategoryStory] = useState(false);
    const [slug, setSlug] = useState<string>("");
    const hasTrackedCategoryView = useRef(false);
    const mounted = useSyncExternalStore(subscribeHydration, () => true, () => false);

    useEffect(() => {
        params.then(p => setSlug(p.slug));
    }, [params]);

    useEffect(() => {
        checkStreak();
    }, [checkStreak]);

    const categoryName = getCategoryFromSlug(slug);
    const theme = getCategoryTheme(categoryName);

    // Filter Checkpoints
    const categoryCheckpoints = useMemo(() => {
        if (!categoryName) return [];
        return CHECKPOINTS.filter(c => c.category === categoryName);
    }, [categoryName]);

    useEffect(() => {
        if (!mounted || !categoryName || hasTrackedCategoryView.current) return;

        hasTrackedCategoryView.current = true;
        trackEvent("category_page_viewed", {
            category: categoryName,
            checkpoint_count: categoryCheckpoints.length,
            completed_checkpoints: categoryCheckpoints.filter(c => completedCheckpoints[c.id]).length,
            hearts,
            streak,
        });
    }, [mounted, categoryName, categoryCheckpoints, completedCheckpoints, hearts, streak]);

    if (!mounted || !slug) return null;
    if (!categoryName) return notFound();

    const handleCheckpointClick = (id: string) => {
        const checkpoint = categoryCheckpoints.find(item => item.id === id);
        trackEvent("checkpoint_opened", {
            checkpoint_id: id,
            checkpoint_title: checkpoint?.title,
            category: categoryName,
            kanji_count: checkpoint?.kanji.length,
        });
        setActiveCheckpointId(id);
    };

    return (
        <main className="min-h-screen bg-black text-white pb-20 pt-24 relative">
            {/* Header */}
            <div className="pt-8 pb-8 px-4 max-w-2xl mx-auto flex items-center gap-4">
                <Link href="/learn" className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex-1">
                    <h1 className={`text-3xl font-bold ${theme.text}`}>{categoryName}</h1>
                    <p className="text-white/40">{categoryCheckpoints.length} Radicals</p>
                </div>
                <button
                    onClick={() => {
                        trackEvent("category_story_opened", {
                            category: categoryName,
                        });
                        setShowCategoryStory(true);
                    }}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-white/5 hover:bg-white/10 transition-all duration-200
                        ${theme.text} border ${theme.border}
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
                {categoryCheckpoints.map((checkpoint) => {
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
                            theme={theme}
                        />
                    );
                })}
            </div>

            {/* Learning Modal */}
            {activeCheckpointId && (
                <LearningModal
                    key={activeCheckpointId}
                    checkpointId={activeCheckpointId}
                    onClose={() => setActiveCheckpointId(null)}
                />
            )}

            {/* Category Story Modal */}
            {showCategoryStory && categoryName && (
                <CategoryStoryModal
                    category={categoryName}
                    onClose={() => setShowCategoryStory(false)}
                    theme={theme}
                />
            )}
        </main>
    );
}
