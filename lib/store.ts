import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProgressState {
    hearts: number;
    maxHearts: number;
    streak: number;
    lastLoginDate: string | null;
    completedCheckpoints: Record<string, boolean>; // checkpointId -> true
    unlockedLevels: string[];

    // Actions
    loseHeart: () => void;
    restoreHearts: () => void;
    completeCheckpoint: (id: string) => void;
    checkStreak: () => void;
}

export const useProgressStore = create<UserProgressState>()(
    persist(
        (set, get) => ({
            hearts: 5,
            maxHearts: 5,
            streak: 0,
            lastLoginDate: null,
            completedCheckpoints: {},
            unlockedLevels: ['N5'],

            loseHeart: () => set((state) => ({
                hearts: Math.max(0, state.hearts - 1)
            })),

            restoreHearts: () => set((state) => ({
                hearts: state.maxHearts
            })),

            completeCheckpoint: (id) => set((state) => ({
                completedCheckpoints: {
                    ...state.completedCheckpoints,
                    [id]: true
                }
            })),

            checkStreak: () => {
                const today = new Date().toISOString().split('T')[0];
                const { lastLoginDate, streak } = get();

                if (lastLoginDate === today) return; // Already logged in today

                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayString = yesterday.toISOString().split('T')[0];

                if (lastLoginDate === yesterdayString) {
                    // Contine streak
                    set({ streak: streak + 1, lastLoginDate: today });
                } else {
                    // Break streak (or new user)
                    set({ streak: 1, lastLoginDate: today });
                }
            }
        }),
        {
            name: 'kanji-path-storage',
        }
    )
);
