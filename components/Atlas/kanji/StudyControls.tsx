"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import type { StudyStatus } from "@/lib/study-list";

const STATUSES: { value: StudyStatus; label: string }[] = [
    { value: "learning", label: "Still learning" },
    { value: "known", label: "Known" },
];

/** Save toggle plus a learning/known switch for one kanji. State is local to this browser. */
export function StudyControls({ char }: { char: string }) {
    const hydrated = useStudyStoreHydrated();
    const entry = useStudyStore((state) => state.entries[char]);
    const toggle = useStudyStore((state) => state.toggle);
    const setStatus = useStudyStore((state) => state.setStatus);

    if (!hydrated) {
        return <div className="mt-4 h-9 w-40 rounded-full bg-white/5 animate-pulse" aria-hidden />;
    }

    const saved = Boolean(entry);

    const handleToggle = () => {
        toggle(char);
        trackEvent("kanji_saved", { kanji: char, saved: !saved, source: "kanji_page" });
    };

    const handleStatus = (status: StudyStatus) => {
        if (entry?.status === status) return;
        setStatus(char, status);
        trackEvent("kanji_status_changed", { kanji: char, status, source: "kanji_page" });
    };

    return (
        <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={handleToggle}
                aria-pressed={saved}
                className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors",
                    saved
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
                        : "bg-white/5 border-white/15 text-white hover:border-[var(--accent)]"
                )}
            >
                {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {saved ? "Saved to My list" : "Save to My list"}
            </button>

            {saved && (
                <div role="radiogroup" aria-label="Study status" className="inline-flex rounded-full border border-white/15 bg-white/5 p-0.5">
                    {STATUSES.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            role="radio"
                            aria-checked={entry?.status === s.value}
                            onClick={() => handleStatus(s.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                entry?.status === s.value ? "bg-white text-black" : "text-white/70 hover:text-white"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
