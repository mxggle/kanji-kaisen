import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLocalDateKey } from './handwriting-preferences';

export type TargetJlpt = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type LearningMode = 'standard' | 'light';
export type DailyGoalMinutes = 5 | 10 | 20;

export interface SettingsState {
    skipHandwritingGlobally: boolean;
    skipHandwritingTodayDate: string | null;
    soundEnabled: boolean;
    reduceMotion: boolean;
    dailyGoalMinutes: DailyGoalMinutes;
    learningMode: LearningMode;
    nickname: string;
    targetJlpt: TargetJlpt;

    setSkipHandwritingGlobally: (value: boolean) => void;
    setSkipHandwritingForToday: () => void;
    clearSkipHandwritingForToday: () => void;
    setSoundEnabled: (value: boolean) => void;
    setReduceMotion: (value: boolean) => void;
    setDailyGoalMinutes: (value: DailyGoalMinutes) => void;
    setLearningMode: (value: LearningMode) => void;
    setNickname: (value: string) => void;
    setTargetJlpt: (value: TargetJlpt) => void;
    resetSettings: () => void;
}

export const INITIAL_SETTINGS_STATE = {
    skipHandwritingGlobally: false,
    skipHandwritingTodayDate: null,
    soundEnabled: true,
    reduceMotion: false,
    dailyGoalMinutes: 10 as DailyGoalMinutes,
    learningMode: 'standard' as LearningMode,
    nickname: '',
    targetJlpt: 'N3' as TargetJlpt,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...INITIAL_SETTINGS_STATE,

            setSkipHandwritingGlobally: (value) =>
                set((state) => ({
                    skipHandwritingGlobally: value,
                    skipHandwritingTodayDate: value ? null : state.skipHandwritingTodayDate,
                })),
            setSkipHandwritingForToday: () => set({ skipHandwritingTodayDate: getLocalDateKey() }),
            clearSkipHandwritingForToday: () => set({ skipHandwritingTodayDate: null }),
            setSoundEnabled: (value) => set({ soundEnabled: value }),
            setReduceMotion: (value) => set({ reduceMotion: value }),
            setDailyGoalMinutes: (value) => set({ dailyGoalMinutes: value }),
            setLearningMode: (value) => set({ learningMode: value }),
            setNickname: (value) => set({ nickname: value.trimStart() }),
            setTargetJlpt: (value) => set({ targetJlpt: value }),
            resetSettings: () => set({ ...INITIAL_SETTINGS_STATE }),
        }),
        {
            name: 'kanji-settings-storage',
            version: 1,
            migrate: (persistedState: unknown) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return { ...INITIAL_SETTINGS_STATE };
                }

                return {
                    ...INITIAL_SETTINGS_STATE,
                    ...(persistedState as Partial<SettingsState>),
                };
            },
        }
    )
);
