"use client";

import { useEffect, useState } from "react";
import { CHECKPOINTS, getNextCheckpointId } from "@/lib/checkpoints";
import { useProgressStore } from "@/lib/store";
import { CheckpointNode } from "@/components/Path/CheckpointNode";
import { Heart, Flame, Search } from "lucide-react";
import { LearningModal } from "@/components/Learning/LearningModal";

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

  return (
    <main className="min-h-screen bg-black text-white pb-20 relative overflow-hidden pt-4">
      {/* Status Bar (Hearts/Streak) */}
      <div className="fixed top-16 left-0 right-0 z-40 px-4 h-12 flex items-center justify-between pointer-events-none">
        {/* Spacer for branding */}
        <div />

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

      {/* Search / Level Select (Placeholder) */}
      <div className="pt-24 px-4 mb-4">
        <div className="relative w-full max-w-md mx-auto">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search kanji..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--n5)] transition-colors"
          />
        </div>
      </div>

      {/* The Path */}
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto px-4 py-8">
        {CHECKPOINTS.map((checkpoint, index) => {
          const isCompleted = !!completedCheckpoints[checkpoint.id];
          // Unlock logic: 
          // 1. First one is always unlocked? 
          // 2. Or is it unlocked if previous is completed?
          // For this prototype, let's say first is unlocked, or previous one is completed.
          // Simple logic: if index 0, unlocked. If index > 0, unlocked if index-1 is completed.

          const isUnlocked = index === 0 || !!completedCheckpoints[CHECKPOINTS[index - 1].id];
          // Also respect level locking (not fully implemented yet)

          const isLocked = !isUnlocked;

          return (
            <CheckpointNode
              key={checkpoint.id}
              index={index}
              checkpoint={checkpoint}
              isLocked={isLocked}
              isCompleted={isCompleted}
              onClick={() => handleCheckpointClick(checkpoint.id)}
            />
          );
        })}
      </div>

      {/* Learning Modal */}
      {activeCheckpointId && (
        <LearningModal
          checkpointId={activeCheckpointId}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}
