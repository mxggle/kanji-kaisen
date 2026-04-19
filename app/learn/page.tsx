"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { CHECKPOINTS, CATEGORIES } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { CategoryCard } from "@/components/Path/CategoryCard";
import { trackEvent } from "@/lib/analytics";

function subscribeHydration() {
    return () => {};
}

export default function LearnPage() {
    const { hearts, streak, completedCheckpoints, unlockedLevels, checkStreak } = useProgressStore();
    const hasTrackedPageView = useRef(false);

    const mounted = useSyncExternalStore(subscribeHydration, () => true, () => false);

    useEffect(() => {
        checkStreak();
    }, [checkStreak]);

    useEffect(() => {
        if (!mounted || hasTrackedPageView.current) return;

        hasTrackedPageView.current = true;
        trackEvent("learn_page_viewed", {
            hearts,
            streak,
            unlocked_levels: unlockedLevels.length,
            completed_checkpoints: Object.keys(completedCheckpoints).length,
        });
    }, [mounted, hearts, streak, unlockedLevels.length, completedCheckpoints]);

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-black text-white pb-20 relative overflow-y-auto pt-24 custom-scrollbar">
            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 max-w-7xl mx-auto pb-20">
                {CATEGORIES.map((category) => {
                    const categoryCheckpoints = CHECKPOINTS.filter(c => c.category === category);
                    const completedCount = categoryCheckpoints.filter(c => completedCheckpoints[c.id]).length;

                    return (
                        <CategoryCard
                            key={category}
                            title={category}
                            checkpoints={categoryCheckpoints}
                            completedCount={completedCount}
                        />
                    );
                })}
            </div>
        </main>
    );
}
