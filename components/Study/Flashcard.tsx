"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { BookmarkPlus, Check, RotateCcw } from "lucide-react";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import type { StudyStatus } from "@/lib/study-list";
import { KanjiDetails } from "./KanjiDetails";
import { Checkbox } from "./ui";

interface FlashcardProps {
    entry: SearchIndexEntry;
    /** Status in My list, or null when not saved. */
    status: StudyStatus | null;
    saveMarked: boolean;
    onSaveMarkedChange: (value: boolean) => void;
    onSave: () => void;
    onMark: (status: StudyStatus) => void;
}

/** True when a key press belongs to a focused control rather than the card shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName);
}

export function Flashcard({ entry, status, saveMarked, onSaveMarkedChange, onSave, onMark }: FlashcardProps) {
    const [flipped, setFlipped] = useState(false);

    const onKey = useEffectEvent((e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if ((e.key === " " || e.key === "Enter") && !isTypingTarget(e.target)) {
            e.preventDefault();
            setFlipped((f) => !f);
        } else if (flipped && (e.key === "1" || e.key === "ArrowLeft")) {
            onMark("learning");
        } else if (flipped && (e.key === "2" || e.key === "ArrowRight")) {
            onMark("known");
        }
    });

    useEffect(() => {
        const handler = (e: KeyboardEvent) => onKey(e);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div>
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 min-h-64">
                <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    aria-label={flipped ? `Hide answer for ${entry.c}` : `Show answer for ${entry.c}`}
                    className="font-japanese font-bold text-8xl sm:text-9xl leading-none text-white shrink-0 rounded-lg px-2 hover:text-[var(--accent)] transition-colors"
                >
                    {entry.c}
                </button>
                {flipped ? (
                    <div className="w-full sm:flex-1 min-w-0" data-testid="flashcard-back">
                        <KanjiDetails entry={entry} />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setFlipped(true)}
                        className="sm:flex-1 text-white/50 text-sm inline-flex items-center justify-center gap-2 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" aria-hidden /> Recall the meaning, then tap or press Space to flip
                    </button>
                )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm min-h-9">
                {status ? (
                    <span className="text-white/50">
                        In My list · {status === "known" ? "Known" : "Still learning"}
                    </span>
                ) : saveMarked ? (
                    <span className="text-white/50">Not saved yet · marking it will save it</span>
                ) : (
                    <button
                        type="button"
                        onClick={onSave}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-white/20 text-white/80 hover:border-[var(--accent)] transition-colors"
                    >
                        <BookmarkPlus className="w-4 h-4" aria-hidden /> Save to My list
                    </button>
                )}
                <Checkbox checked={saveMarked} onChange={onSaveMarkedChange} label="Save cards I mark" />
            </div>

            {flipped ? (
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => onMark("learning")}
                        className="h-14 rounded-xl border border-white/20 bg-white/5 font-bold hover:border-white/50 transition-colors"
                    >
                        Still learning <kbd className="hidden sm:inline text-xs text-white/40 font-normal ml-1">1</kbd>
                    </button>
                    <button
                        type="button"
                        onClick={() => onMark("known")}
                        className="h-14 rounded-xl bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" aria-hidden /> Knew it <kbd className="hidden sm:inline text-xs text-black/50 font-normal">2</kbd>
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    className="mt-6 w-full h-14 rounded-xl border border-white/20 bg-white/5 font-bold hover:border-[var(--accent)] transition-colors"
                >
                    Show answer
                </button>
            )}
        </div>
    );
}
