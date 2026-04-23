"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ArrowLeft, RotateCcw, Settings2, MessageSquare, ArrowRight } from "lucide-react";
import { useSettingsStore } from "@/lib/settings-store";
import { useProgressStore } from "@/lib/store";
import { isDailyHandwritingSkipActive } from "@/lib/handwriting-preferences";
import { trackEvent } from "@/lib/analytics";
import { AccountPanel } from "@/components/Auth/AccountPanel";

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
        <div className="flex items-center justify-between gap-4 py-4 group transition-colors hover:bg-white/[0.02] -mx-2 px-2 rounded-xl">
            <div className="flex-1">
                <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                <p className="text-xs text-zinc-400 leading-normal">{description}</p>
            </div>
            <button
                onClick={onToggle}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                className={`relative inline-flex h-[26px] w-[48px] items-center rounded-full transition-all duration-300 focus:outline-none
                    ${enabled 
                        ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]" 
                        : "bg-zinc-800 border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                    }`}
            >
                <span
                    className={`inline-block h-[22px] w-[22px] rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.3)] transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                        ${enabled 
                            ? "translate-x-[24px] bg-white scale-100" 
                            : "translate-x-[2px] bg-zinc-500 scale-90"
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
    const skipHandwritingForTodayEnabled = isDailyHandwritingSkipActive(skipHandwritingTodayDate);

    if (!mounted) return null;

    const handleResetProgress = () => {
        const confirmed = window.confirm(
            "Reset all learning progress? This action cannot be undone."
        );
        if (confirmed) {
            resetProgress();
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

        router.push("/learn");
    };

    return (
        <main className="min-h-screen bg-black text-white pb-24 pt-24">
            <div className="max-w-3xl mx-auto px-4 space-y-5">
                <div className="pt-8 pb-2 flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Settings2 className="text-cyan-300" size={22} /> Settings
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            Tune your learning flow and app behavior.
                        </p>
                    </div>
                </div>

                <AccountPanel />

                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-5">
                    <h2 className="text-base font-semibold mb-1">Learning</h2>
                    <p className="text-xs text-zinc-400 mb-2">Customize how lessons run.</p>

                    <ToggleRow
                        label="Always Skip Handwriting"
                        description="Skip trace and handwriting challenge for all kanji every day."
                        enabled={skipHandwritingGlobally}
                        onToggle={() => setSkipHandwritingGlobally(!skipHandwritingGlobally)}
                    />

                    {!skipHandwritingGlobally && (
                        <div className="border-t border-zinc-800">
                            <ToggleRow
                                label="Skip Handwriting For Today"
                                description="Skip trace and handwriting challenge across the app until your local day resets."
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
                    <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2 ml-1">Community</h2>
                    <div className="space-y-1">
                        <a 
                            href="https://kanjikaisen.featurebase.app/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={() => trackEvent("feedback_clicked", { source: "settings_page" })}
                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-all text-zinc-400 hover:text-white group border border-transparent hover:border-white/10"
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 group-hover:text-cyan-400 group-hover:border-cyan-400/30 transition-all shadow-lg">
                                <MessageSquare size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Feedback & Support</p>
                                <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">Request features or report bugs on our board</p>
                            </div>
                            <ArrowRight size={16} className="text-zinc-800 group-hover:text-zinc-500 transition-all -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                        </a>
                    </div>
                </section>

                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-5">
                    <h2 className="text-base font-semibold mb-1">Actions</h2>
                    <p className="text-xs text-zinc-400 mb-2">Maintenance and recovery tools.</p>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={handleResetAllSettings}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800 transition-colors"
                        >
                            <RotateCcw size={14} /> Reset Settings
                        </button>
                        <button
                            onClick={handleResetProgress}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/50 text-red-300 text-sm hover:bg-red-500/10 transition-colors"
                        >
                            <RotateCcw size={14} /> Reset Progress
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
