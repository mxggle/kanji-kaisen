"use client";

import { useEffect, useState } from "react";
import { CHECKPOINTS, CATEGORIES } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { CategoryCard } from "@/components/Path/CategoryCard";
import { Heart, Flame } from "lucide-react";

export default function Home() {
  const { hearts, streak, completedCheckpoints, unlockedLevels } = useProgressStore();
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);

  // Hydration fix for zustand persist
  const [mounted, setMounted] = useState(false);
  const { checkStreak } = useProgressStore();

  useEffect(() => {
    setMounted(true);
    checkStreak();
  }, [checkStreak]);

  if (!mounted) return null;

  const handleCheckpointClick = (id: string) => {
    setActiveCheckpointId(id);
  };

  const handleCloseModal = () => {
    setActiveCheckpointId(null);
  };

  // Group Checkpoints
  const categories = [
    "Nature & Elements",
    "Human Body & People",
    "Action & Movement",
    "Structures & Home",
    "Animals & Wildlife",
    "Tools & Weapons",
    "Communication & Thought",
    "Textiles, Plants & Food",
    "States & Attributes",
    "Time & Sequence",
    "Others"
  ];
  const groupedCheckpoints: Record<string, typeof CHECKPOINTS> = {};
  return (
    <main className="min-h-screen bg-black text-white pb-20 relative overflow-y-auto pt-24 custom-scrollbar">
      {/* Status Bar */}
      <div className="fixed top-6 right-6 z-40 flex items-center gap-4 md:gap-6 pointer-events-auto bg-black/50 backdrop-blur-md px-4 md:px-6 py-2 rounded-full border border-white/10">
        <div className="flex items-center gap-2 text-rose-500">
          <Heart size={20} fill="currentColor" className={hearts === 0 ? "text-gray-600" : ""} />
          <span className="font-bold text-lg">{hearts}</span>
        </div>
        <div className="flex items-center gap-2 text-orange-500">
          <Flame size={20} fill="currentColor" />
          <span className="font-bold text-lg">{streak}</span>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 max-w-7xl mx-auto pb-20">
        {CATEGORIES.map((category) => {
          const categoryCheckpoints = CHECKPOINTS.filter(c => (c as any).category === category);
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
