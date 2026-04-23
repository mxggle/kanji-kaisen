"use client";

import {
    INITIAL_PROGRESS_STATE,
    useProgressStore,
    type UserProgressState,
} from "@/lib/store";
import {
    INITIAL_SETTINGS_STATE,
    useSettingsStore,
    type SettingsState,
} from "@/lib/settings-store";
import type { AppSnapshot, ProgressSnapshot, SettingsSnapshot } from "./types";

function pickProgressSnapshot(state: UserProgressState): ProgressSnapshot {
    return {
        hearts: state.hearts,
        maxHearts: state.maxHearts,
        streak: state.streak,
        lastLoginDate: state.lastLoginDate,
        completedCheckpoints: state.completedCheckpoints,
        unlockedLevels: state.unlockedLevels,
    };
}

function pickSettingsSnapshot(state: SettingsState): SettingsSnapshot {
    return {
        skipHandwritingGlobally: state.skipHandwritingGlobally,
        skipHandwritingTodayDate: state.skipHandwritingTodayDate,
        soundEnabled: state.soundEnabled,
        reduceMotion: state.reduceMotion,
        dailyGoalMinutes: state.dailyGoalMinutes,
        learningMode: state.learningMode,
        nickname: state.nickname,
        targetJlpt: state.targetJlpt,
    };
}

export function getLocalSnapshot(): AppSnapshot {
    return {
        progress: pickProgressSnapshot(useProgressStore.getState()),
        settings: pickSettingsSnapshot(useSettingsStore.getState()),
    };
}

export function applySnapshot(snapshot: AppSnapshot) {
    useProgressStore.setState({
        ...INITIAL_PROGRESS_STATE,
        ...snapshot.progress,
    });
    useSettingsStore.setState({
        ...INITIAL_SETTINGS_STATE,
        ...snapshot.settings,
    });
}
