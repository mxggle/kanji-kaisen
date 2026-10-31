"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ArrowLeft, RotateCcw, Settings2, MessageSquare, ArrowRight } from "lucide-react";
import { useSettingsStore } from "@/lib/settings-store";
import { useProgressStore } from "@/lib/store";
import { isDailyHandwritingSkipActive } from "@/lib/handwriting-preferences";
import { trackEvent } from "@/lib/analytics";
import { useStudyStore } from "@/lib/study-store";
import { SkinToggle } from "@/components/Skin/SkinToggle";

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
        <div className="flex items-center justify-between gap-4 py-4 group transition-colors hover:bg-ink/5 -mx-2 px-2 rounded-xl">
            <div className="flex-1">
                <p className="text-sm font-bold text-ink mb-0.5">{label}</p>
                <p className="text-xs text-ink-2 leading-normal">{description}</p>
            </div>
            <button
                onClick={onToggle}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                className={`relative inline-flex h-[26px] w-[48px] items-center rounded-full transition-all duration-300 focus:outline-none
                    ${enabled 
                        ? "bg-[var(--accent)] halo"
                        : "bg-ink/10 border border-line-2"
                    }`}
            >
                <span
                    className={`inline-block h-[22px] w-[22px] rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.3)] transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                        ${enabled 
                            ? "translate-x-[24px] bg-onacc scale-100"
                            : "translate-x-[2px] bg-ink-3 scale-90"
                        }`}
                />
            </button>
        </div>
    );
}

export default function SettingsPage() {
    const mounted = useSyncExternalStore(subscribeHydration, () => true, () => false);
    const router = useRouter();

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

    if (!mounted) return null;

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

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
            return;
        }

        router.push("/practice");
    };

    return (
        <main className="min-h-screen bg-bg text-ink pb-24 pt-8">
            <div className="max-w-3xl mx-auto px-4 space-y-5">
                <div className="pt-8 pb-2 flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-3 rounded-full bg-card hover:bg-ink/10 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Settings2 className="text-[var(--accent)]" size={22} aria-hidden /> Settings
                        </h1>
                        <p className="text-sm text-ink-2 mt-1">
                            Appearance, classic practice options, feedback and reset tools.
                        </p>
                    </div>
                </div>

                <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
                    <h2 className="text-base font-semibold mb-1">Appearance</h2>
                    <div className="flex items-center justify-between gap-4 py-2">
                        <p className="text-xs text-ink-2 leading-normal">
                            <span lang="ja">夜</span> Night is dark with full-colour art. <span lang="ja">墨</span> Ink is paper and ink wash, easier in daylight. Printing always uses Ink.
                        </p>
                        <SkinToggle size="md" />
                    </div>
                </section>

                <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
                    <h2 className="text-base font-semibold mb-1">Classic practice</h2>
                    <p className="text-xs text-ink-2 mb-2">These only affect the step-by-step practice path. Kanji pages always offer stroke animation and free tracing.</p>

                    <ToggleRow
                        label="Always Skip Handwriting"
                        description="Skip the trace and AI handwriting steps in classic practice."
                        enabled={skipHandwritingGlobally}
                        onToggle={() => setSkipHandwritingGlobally(!skipHandwritingGlobally)}
                    />

                    {!skipHandwritingGlobally && (
                        <div className="border-t border-line">
                            <ToggleRow
                                label="Skip Handwriting For Today"
                                description="Skip the trace and AI handwriting steps in classic practice until your local day resets."
                                enabled={skipHandwritingForTodayEnabled}
                                onToggle={() =>
                                    skipHandwritingForTodayEnabled
                                        ? clearSkipHandwritingForToday()
                                        : setSkipHandwritingForToday()
                                }
                            />
                        </div>
                    )}
                </section>
                
                <section className="px-1">
                    <h2 className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.2em] mb-2 ml-1">Community</h2>
                    <div className="space-y-1">
                        <a 
                            href="https://kanjikaisen.featurebase.app/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={() => trackEvent("feedback_clicked", { source: "settings_page" })}
                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-ink/5 transition-all text-ink-2 hover:text-ink group border border-transparent hover:border-line"
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-line text-ink-3 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/30 transition-all shadow-lg">
                                <MessageSquare size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-ink group-hover:text-ink transition-colors">Feedback & Support</p>
                                <p className="text-[11px] text-ink-3 group-hover:text-ink-2 transition-colors">Request features or report bugs on our board</p>
                            </div>
                            <ArrowRight size={16} className="text-ink-3 group-hover:text-ink-2 transition-all -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                        </a>
                    </div>
                </section>

                <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
                    <h2 className="text-base font-semibold mb-1">Actions</h2>
                    <p className="text-xs text-ink-2 mb-2">Maintenance and recovery tools.</p>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={handleResetAllSettings}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-line-2 text-sm hover:bg-ink/10 transition-colors"
                        >
                            <RotateCcw size={14} /> Reset Settings
                        </button>
                        <button
                            onClick={handleResetProgress}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-bad/50 text-bad text-sm hover:bg-bad/10 transition-colors"
                        >
                            <RotateCcw size={14} /> Reset Practice Progress
                        </button>
                        <button
                            onClick={handleClearStudyList}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-bad/50 text-bad text-sm hover:bg-bad/10 transition-colors"
                        >
                            <RotateCcw size={14} /> Clear My List
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
