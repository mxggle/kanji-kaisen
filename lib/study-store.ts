import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    sanitizeEntries,
    saveKanji,
    setStatus,
    toggleSaved,
    unsaveKanji,
    type StudyEntries,
    type StudyStatus,
} from './study-list';

// Saved kanji for the atlas study layer. Local only (not synced to Supabase).
export interface StudyState {
    entries: StudyEntries;

    save: (char: string) => void;
    unsave: (char: string) => void;
    toggle: (char: string) => void;
    setStatus: (char: string, status: StudyStatus) => void;
    clear: () => void;
}

export const useStudyStore = create<StudyState>()(
    persist(
        (set) => ({
            entries: {},

            save: (char) => set((state) => ({ entries: saveKanji(state.entries, char) })),
            unsave: (char) => set((state) => ({ entries: unsaveKanji(state.entries, char) })),
            toggle: (char) => set((state) => ({ entries: toggleSaved(state.entries, char) })),
            setStatus: (char, status) => set((state) => ({ entries: setStatus(state.entries, char, status) })),
            clear: () => set({ entries: {} }),
        }),
        {
            name: 'kanji-study-list',
            version: 1,
            partialize: (state) => ({ entries: state.entries }),
            merge: (persisted, current) => ({
                ...current,
                entries: sanitizeEntries((persisted as Partial<StudyState> | undefined)?.entries),
            }),
        }
    )
);

const subscribeHydration = (onChange: () => void) => useStudyStore.persist.onFinishHydration(onChange);

/** False during SSR and the first client render, so saved state never causes a hydration mismatch. */
export function useStudyStoreHydrated(): boolean {
    return useSyncExternalStore(subscribeHydration, () => useStudyStore.persist.hasHydrated(), () => false);
}
