import { useMemo, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackEvent } from './analytics';
import {
    getShade as shadeOf,
    migrateFromStudyList,
    recordStep as applyStep,
    sanitizeInk,
    setShade as applyShade,
    studyEntriesFromJson,
    themeProgress as progressOf,
    type InkEntries,
    type InkStep,
    type Shade,
    type ThemeProgress,
} from './ink';

export type { InkEntries, InkStep, Shade, ThemeProgress } from './ink';

const STUDY_LIST_KEY = 'kanji-study-list';

// Ink per kanji. Local only (not synced to Supabase). Saving to My list stays
// in lib/study-store.ts; this store only migrates its statuses once.
export interface InkState {
    entries: InkEntries;
    /** True once the one-time migration from `kanji-study-list` has run. */
    migrated: boolean;

    getShade: (char: string) => Shade;
    /** Self-marking: any shade, up or down. `source` goes to the `ink_changed` event. */
    setShade: (char: string, shade: Shade, source: string) => void;
    /** One step of the four-step loop. Never lowers a shade. */
    recordStep: (char: string, step: InkStep, ok: boolean) => void;
    themeProgress: (chars: Iterable<string>) => ThemeProgress;
    clear: () => void;
    migrateOnce: () => void;
}

function reportChange(before: InkEntries, after: InkEntries, char: string, source: string) {
    const from = shadeOf(before, char);
    const to = shadeOf(after, char);
    if (from !== to) trackEvent('ink_changed', { kanji: char, from, to, source });
}

function readStudyList(): unknown {
    try {
        return studyEntriesFromJson(window.localStorage.getItem(STUDY_LIST_KEY));
    } catch {
        return null;
    }
}

export const useInkStore = create<InkState>()(
    persist(
        (set, get) => ({
            entries: {},
            migrated: false,

            getShade: (char) => shadeOf(get().entries, char),
            setShade: (char, shade, source) => {
                const before = get().entries;
                const after = applyShade(before, char, shade);
                if (after === before) return;
                set({ entries: after });
                reportChange(before, after, char, source);
            },
            recordStep: (char, step, ok) => {
                const before = get().entries;
                const after = applyStep(before, char, step, ok);
                if (after === before) return;
                set({ entries: after });
                reportChange(before, after, char, step);
            },
            themeProgress: (chars) => progressOf(get().entries, chars),
            clear: () => set({ entries: {} }),
            migrateOnce: () => {
                if (get().migrated) return;
                set((state) => ({ entries: migrateFromStudyList(state.entries, readStudyList()), migrated: true }));
            },
        }),
        {
            name: 'kanji-ink',
            version: 1,
            partialize: (state) => ({ entries: state.entries, migrated: state.migrated }),
            merge: (persisted, current) => {
                const p = persisted as Partial<InkState> | undefined;
                return { ...current, entries: sanitizeInk(p?.entries), migrated: p?.migrated === true };
            },
            // Runs right after hydration; the set() inside persists the result.
            onRehydrateStorage: () => (state) => state?.migrateOnce(),
        }
    )
);

const subscribeHydration = (onChange: () => void) => useInkStore.persist.onFinishHydration(onChange);

/** False during SSR and the first client render, so ink never causes a hydration mismatch. */
export function useInkHydrated(): boolean {
    return useSyncExternalStore(subscribeHydration, () => useInkStore.persist.hasHydrated(), () => false);
}

/** The shade of one kanji (0 until hydrated). */
export function useShade(char: string): Shade {
    const hydrated = useInkHydrated();
    const shade = useInkStore((state) => state.entries[char]?.shade ?? 0);
    return hydrated ? shade : 0;
}

/** Live progress over a set of kanji (all zero until hydrated). */
export function useThemeProgress(chars: readonly string[]): ThemeProgress & { hydrated: boolean } {
    const hydrated = useInkHydrated();
    const entries = useInkStore((state) => state.entries);
    return useMemo(
        () => ({ ...progressOf(hydrated ? entries : {}, chars), hydrated }),
        [entries, chars, hydrated],
    );
}
