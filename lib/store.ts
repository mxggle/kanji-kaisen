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
    resetProgress: () => void;
}

const INITIAL_PROGRESS_STATE = {
    hearts: 10,
    maxHearts: 10,
    streak: 0,
    lastLoginDate: null,
    completedCheckpoints: {} as Record<string, boolean>,
    unlockedLevels: ['N5'],
};

export const useProgressStore = create<UserProgressState>()(
    persist(
        (set, get) => ({
            ...INITIAL_PROGRESS_STATE,

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
            },

            resetProgress: () => set({ ...INITIAL_PROGRESS_STATE }),
        }),
        {
            name: 'kanji-path-storage',
            version: 2,
            migrate: (persistedState: unknown, version) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return { ...INITIAL_PROGRESS_STATE };
                }

                const state = persistedState as Partial<UserProgressState>;

                if (version < 1) {
                    state.hearts = 10;
                    state.maxHearts = 10;
                }

                if (version < 2 && typeof state.unlockedLevels === 'undefined') {
                    state.unlockedLevels = ['N5'];
                }

                return {
                    ...INITIAL_PROGRESS_STATE,
                    ...state,
                };
            },
        }
    )
);
