"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { BookmarkPlus, Check, RotateCcw } from "lucide-react";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import type { StudyStatus } from "@/lib/study-list";
import { Button } from "@/components/ui/Button";
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

/** Text fields (e.g. the header search box) own every key, so shortcuts stay off there. */
export function isTextEntry(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/** True when a key press belongs to a focused control rather than the card shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName);
}

export function Flashcard({ entry, status, saveMarked, onSaveMarkedChange, onSave, onMark }: FlashcardProps) {
    const [flipped, setFlipped] = useState(false);

    const onKey = useEffectEvent((e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey || isTextEntry(e.target)) return;
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
        <div className="flex flex-col gap-4">
            <div className="flex min-h-64 w-full flex-col items-center gap-6 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:p-8">
                <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    aria-label={flipped ? `Hide answer for ${entry.c}` : `Show answer for ${entry.c}`}
                    className="shrink-0 cursor-pointer rounded-xl px-2 font-jp text-[112px] font-extrabold leading-none text-ink transition-colors hover:text-ink-2 sm:text-[136px]"
                >
                    <span lang="ja">{entry.c}</span>
                </button>
                {flipped ? (
                    <div className="w-full min-w-0 sm:flex-1" data-testid="flashcard-back">
                        <KanjiDetails entry={entry} />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setFlipped(true)}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 text-sm text-ink-3 transition-colors hover:text-ink sm:flex-1"
                    >
                        <RotateCcw className="size-4" aria-hidden /> Recall the meaning, then tap or press Space to flip
                    </button>
                )}
            </div>

            <div className="flex min-h-9 flex-wrap items-center justify-between gap-3 text-sm">
                {status ? (
                    <span className="text-ink-3">In My list · {status === "known" ? "Knew it" : "Still learning"}</span>
                ) : saveMarked ? (
                    <span className="text-ink-3">Not saved yet · marking it will save it</span>
                ) : (
                    <Button size="sm" onClick={onSave}>
                        <BookmarkPlus aria-hidden /> Save to My list
                    </Button>
                )}
                <Checkbox checked={saveMarked} onChange={onSaveMarkedChange} label="Save cards I mark" />
            </div>

            {flipped ? (
                <div className="grid grid-cols-2 gap-3">
                    <Button size="lg" onClick={() => onMark("learning")} className="w-full">
                        Still learning <kbd className="text-xs font-normal text-ink-3 max-sm:hidden">1</kbd>
                    </Button>
                    <Button variant="primary" size="lg" onClick={() => onMark("known")} className="w-full">
                        <Check aria-hidden /> Knew it <kbd className="text-xs font-normal opacity-70 max-sm:hidden">2</kbd>
                    </Button>
                </div>
            ) : (
                <Button variant="primary" size="lg" onClick={() => setFlipped(true)} className="w-full">
                    Show answer
                </Button>
            )}
        </div>
    );
}
