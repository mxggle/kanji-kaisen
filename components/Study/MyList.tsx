"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Check, Layers, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { countByStatus, listSaved, type StudyEntry, type StudyStatus } from "@/lib/study-list";
import { browsePath, kanjiPath } from "@/lib/atlas/paths";
import { KanjiTile } from "@/components/Atlas/KanjiTile";
import { jlptLevelOf, studyPath } from "./session";
import { useSearchIndex } from "./useSearchIndex";

type Filter = "all" | StudyStatus;

const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "learning", label: "Still learning" },
    { id: "known", label: "Known" },
];

const GRID = "grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2";

export function MyList() {
    const hydrated = useStudyStoreHydrated();
    return (
        <>
            <h1 className="text-3xl font-bold mb-2">My list</h1>
            <p className="text-white/60 text-sm mb-6">
                Kanji you saved, stored in this browser only. Mark them “Known” when they stick, or study them as flashcards or a quiz.
            </p>
            {hydrated ? <MyListContent /> : <MyListSkeleton />}
        </>
    );
}

export function MyListSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading your list">
            <div className="flex gap-2 mb-6">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-9 w-24 rounded-full bg-white/5 animate-pulse" />
                ))}
            </div>
            <ul className={GRID}>
                {Array.from({ length: 8 }, (_, i) => (
                    <li key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10 animate-pulse" />
                ))}
            </ul>
        </div>
    );
}

function MyListContent() {
    const entries = useStudyStore((s) => s.entries);
    const setStatus = useStudyStore((s) => s.setStatus);
    const unsave = useStudyStore((s) => s.unsave);
    const { byChar, error, retry } = useSearchIndex();
    const [filter, setFilter] = useState<Filter>("all");
    const restore = useStudyStore((s) => s.restore);
    const [removed, setRemoved] = useState<{ char: string; entry: StudyEntry } | null>(null);

    const counts = countByStatus(entries);
    const chars = listSaved(entries, filter === "all" ? undefined : filter);

    if (counts.all === 0) {
        return (
            <>
                {removed && <UndoBar removed={removed} onUndo={() => { restore(removed.char, removed.entry); setRemoved(null); }} />}
                <EmptyState />
            </>
        );
    }

    const remove = (char: string) => {
        const entry = entries[char];
        if (!entry) return;
        unsave(char);
        setRemoved({ char, entry });
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <Link
                    href={studyPath({ kind: "list" })}
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[var(--accent)] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    <Layers className="w-4 h-4" aria-hidden /> Study these ({counts.all})
                </Link>
                {counts.learning > 0 && (
                    <Link
                        href={studyPath({ kind: "learning" })}
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-white/20 hover:border-[var(--accent)] text-sm font-medium transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" aria-hidden /> Review {counts.learning} still-learning kanji
                    </Link>
                )}
            </div>

            <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-2 mb-4">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        role="tab"
                        aria-selected={filter === f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                            "h-9 px-3 rounded-full text-sm font-medium border transition-colors",
                            filter === f.id ? "bg-white text-black border-white" : "border-white/20 text-white/60 hover:border-white/50",
                        )}
                    >
                        {f.label} <span className={filter === f.id ? "text-black/60" : "text-white/40"}>{counts[f.id]}</span>
                    </button>
                ))}
            </div>

            {removed && <UndoBar removed={removed} onUndo={() => { restore(removed.char, removed.entry); setRemoved(null); }} />}

            {error && (
                <p className="mb-4 text-sm text-white/60">
                    Couldn’t load kanji details.{" "}
                    <button type="button" onClick={retry} className="text-[var(--accent)] hover:underline">Try again</button>
                </p>
            )}

            {chars.length === 0 ? (
                <p className="text-white/50 text-sm py-6">
                    {filter === "known"
                        ? "Nothing marked as known yet. Use the status buttons below a kanji, or “Knew it” in flashcards."
                        : "Nothing still learning. Nice work!"}
                </p>
            ) : (
                <ul className={GRID}>
                    {chars.map((char) => {
                        const status = entries[char].status;
                        const entry = byChar?.get(char);
                        return (
                            <li key={char} className="flex flex-col gap-1">
                                {entry ? (
                                    <KanjiTile kanji={{ char, meanings: entry.m, jlpt: jlptLevelOf(entry.j), onyomi: entry.on, kunyomi: entry.kun }} />
                                ) : (
                                    <Link
                                        href={kanjiPath(char)}
                                        className={cn(
                                            "flex items-center justify-center aspect-square rounded-lg bg-white/5 border border-white/10 border-b-4 text-3xl sm:text-4xl font-bold font-japanese hover:border-[var(--accent)]",
                                            !byChar && !error && "animate-pulse",
                                        )}
                                    >
                                        {char}
                                    </Link>
                                )}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setStatus(char, status === "known" ? "learning" : "known")}
                                        aria-label={`${char}: ${status === "known" ? "Known" : "Still learning"}. Mark as ${status === "known" ? "still learning" : "known"}`}
                                        title={status === "known" ? "Known — click to mark as still learning" : "Still learning — click to mark as known"}
                                        className={cn(
                                            "flex-1 min-w-0 inline-flex items-center justify-center gap-1 h-8 rounded-md text-[11px] font-medium border transition-colors",
                                            status === "known"
                                                ? "border-[var(--accent)]/50 text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20"
                                                : "border-white/15 text-white/70 hover:border-white/40",
                                        )}
                                    >
                                        {status === "known" ? <Check className="w-3 h-3 shrink-0" aria-hidden /> : <BookOpen className="w-3 h-3 shrink-0" aria-hidden />}
                                        <span className="truncate">{status === "known" ? "Known" : "Learning"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(char)}
                                        aria-label={`Remove ${char} from My list`}
                                        title="Remove from My list"
                                        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-white/15 text-white/50 hover:text-white hover:border-white/40 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" aria-hidden />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}

function UndoBar({ removed, onUndo }: { removed: { char: string }; onUndo: () => void }) {
    return (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
            <span className="text-white/70">
                Removed <span className="font-japanese text-white">{removed.char}</span> from My list.
            </span>
            <button type="button" onClick={onUndo} className="text-[var(--accent)] font-medium hover:underline">Undo</button>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8 text-white/70">
            <p className="text-lg font-medium text-white">Your list is empty.</p>
            <p className="mt-2 text-sm">
                Open any kanji and press Save to add it here. A good place to start is the JLPT N5 kanji.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link
                    href={browsePath({ jlpt: "N5" })}
                    className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[var(--accent)] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Browse N5 kanji
                </Link>
                <Link
                    href={browsePath()}
                    className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-white/20 hover:border-[var(--accent)] text-sm font-medium transition-colors"
                >
                    Browse all kanji
                </Link>
                <Link
                    href={studyPath({ kind: "jlpt", level: "N5" })}
                    className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-white/20 hover:border-[var(--accent)] text-sm font-medium transition-colors"
                >
                    Study N5 without saving
                </Link>
            </div>
        </div>
    );
}
