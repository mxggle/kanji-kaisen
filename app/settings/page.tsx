"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/settings-store";
import { useProgressStore } from "@/lib/store";
import { isDailyHandwritingSkipActive } from "@/lib/handwriting-preferences";
import { trackEvent } from "@/lib/analytics";
import { useStudyStore } from "@/lib/study-store";
import { SkinToggle } from "@/components/Skin/SkinToggle";
import { DocumentPage, DocumentSection, PROSE_LINK } from "@/components/Layout/Document";
import { Button } from "@/components/ui/Button";

function subscribeHydration() {
    return () => { };
}

function ToggleRow({
    label,
    description,
    enabled,
    onToggle,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex-1">
                <p className="text-[15px] font-bold text-ink">{label}</p>
                <p className="text-sm text-ink-2">{description}</p>
            </div>
            <button
                type="button"
                onClick={onToggle}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                className={cn(
                    "relative inline-flex h-[26px] w-12 flex-none items-center rounded-full border transition-colors",
                    enabled ? "border-ink bg-ink" : "border-line-2 bg-transparent",
                )}
            >
                <span
                    aria-hidden
                    className={cn(
                        "inline-block size-5 rounded-full transition-transform duration-200",
                        enabled ? "translate-x-[24px] bg-bg" : "translate-x-[2px] bg-ink-3",
                    )}
                />
            </button>
        </div>
    );
}

export default function SettingsPage() {
    const mounted = useSyncExternalStore(subscribeHydration, () => true, () => false);

    const {
        skipHandwritingGlobally,
        skipHandwritingTodayDate,
        setSkipHandwritingGlobally,
        setSkipHandwritingForToday,
        clearSkipHandwritingForToday,
        resetSettings,
    } = useSettingsStore();

    const resetProgress = useProgressStore((state) => state.resetProgress);
    const clearStudyList = useStudyStore((state) => state.clear);
    const skipHandwritingForTodayEnabled = isDailyHandwritingSkipActive(skipHandwritingTodayDate);

    const handleResetProgress = () => {
        const confirmed = window.confirm(
            "Reset classic practice progress (completed checkpoints)? This action cannot be undone."
        );
        if (confirmed) {
            resetProgress();
        }
    };

    const handleClearStudyList = () => {
        const confirmed = window.confirm("Remove every kanji from My list? This action cannot be undone.");
        if (confirmed) {
            clearStudyList();
        }
    };

    const handleResetAllSettings = () => {
        const confirmed = window.confirm("Reset all settings to default values?");
        if (confirmed) {
            resetSettings();
        }
    };

    return (
        <DocumentPage jp="設定" kind="Settings" title="Settings" lede={<p>Appearance, classic practice options, feedback and reset tools.</p>}>
            <DocumentSection jp="外観" title="Appearance">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card px-5 py-4">
                    <p className="min-w-0 flex-1 basis-60 text-sm">
                        <span lang="ja">夜</span> Night is dark with full-colour art. <span lang="ja">墨</span> Ink is paper and ink wash, easier in
                        daylight. Printing always uses Ink.
                    </p>
                    <SkinToggle size="md" />
                </div>
            </DocumentSection>

            <DocumentSection jp="練習" title="Classic practice">
                <p className="text-sm">These only affect the step-by-step practice path. Kanji pages always offer stroke animation and free tracing.</p>
                {mounted && (
                    <div className="divide-y divide-line rounded-2xl border border-line bg-card px-5">
                        <ToggleRow
                            label="Always skip handwriting"
                            description="Skip the trace and AI handwriting steps in classic practice."
                            enabled={skipHandwritingGlobally}
                            onToggle={() => setSkipHandwritingGlobally(!skipHandwritingGlobally)}
                        />
                        {!skipHandwritingGlobally && (
                            <ToggleRow
                                label="Skip handwriting for today"
                                description="Skip the trace and AI handwriting steps in classic practice until your local day resets."
                                enabled={skipHandwritingForTodayEnabled}
                                onToggle={() =>
                                    skipHandwritingForTodayEnabled
                                        ? clearSkipHandwritingForToday()
                                        : setSkipHandwritingForToday()
                                }
                            />
                        )}
                    </div>
                )}
            </DocumentSection>

            <DocumentSection jp="意見" title="Feedback">
                <p>
                    Request a feature or report a bug on the{" "}
                    <a
                        href="https://kanjikaisen.featurebase.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("feedback_clicked", { source: "settings_page" })}
                        className={PROSE_LINK}
                    >
                        feedback board
                    </a>
                    .
                </p>
            </DocumentSection>

            <DocumentSection jp="管理" title="Reset">
                <p className="text-sm">Everything is stored in this browser. Each of these asks before it changes anything, and none can be undone.</p>
                <div className="flex flex-wrap gap-2.5">
                    <Button size="sm" onClick={handleResetAllSettings} disabled={!mounted}>
                        Reset settings
                    </Button>
                    <Button size="sm" onClick={handleResetProgress} disabled={!mounted}>
                        Reset practice progress
                    </Button>
                    <Button size="sm" onClick={handleClearStudyList} disabled={!mounted}>
                        Clear My list
                    </Button>
                </div>
            </DocumentSection>
        </DocumentPage>
    );
}
