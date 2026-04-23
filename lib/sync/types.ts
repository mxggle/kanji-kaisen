import type { DailyGoalMinutes, LearningMode, TargetJlpt } from "@/lib/settings-store";

export type CompletedCheckpoints = Record<string, boolean>;

export interface ProgressSnapshot {
    hearts: number;
    maxHearts: number;
    streak: number;
    lastLoginDate: string | null;
    completedCheckpoints: CompletedCheckpoints;
    unlockedLevels: string[];
}

export interface SettingsSnapshot {
    skipHandwritingGlobally: boolean;
    skipHandwritingTodayDate: string | null;
    soundEnabled: boolean;
    reduceMotion: boolean;
    dailyGoalMinutes: DailyGoalMinutes;
    learningMode: LearningMode;
    nickname: string;
    targetJlpt: TargetJlpt;
}

export interface AppSnapshot {
    progress: ProgressSnapshot;
    settings: SettingsSnapshot;
}

export interface RemoteAppStateRow {
    user_id: string;
    progress: ProgressSnapshot;
    settings: SettingsSnapshot;
    schema_version: number;
    migrated_at: string | null;
    updated_at: string;
}

export interface MergeOptions {
    preferLocalSettings: boolean;
}
