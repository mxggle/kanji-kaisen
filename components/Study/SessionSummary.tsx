"use client";

import Link from "next/link";
import { BookmarkPlus } from "lucide-react";
import { kanjiPath } from "@/lib/atlas/paths";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import type { StudyEntries } from "@/lib/study-list";
import { jlptColor } from "@/components/Atlas/JlptBadge";
import { jlptLevelOf, uniqueChars, type StudyMode } from "./session";

export interface CardResult {
    char: string;
    outcome: "known" | "learning" | "correct" | "missed";
}

interface SessionSummaryProps {
    title: string;
    mode: StudyMode;
    label: string;
    total: number;
    results: CardResult[];
    byChar: Map<string, SearchIndexEntry>;
    saved: StudyEntries;
    onSave: (chars: string[]) => void;
    onAgain: () => void;
    onMissed: (chars: string[]) => void;
    onNext: (() => void) | null;
    nextLabel: string;
    onSetup: () => void;
    backHref: string;
    backLabel: string;
}

const PRIMARY = "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[var(--accent)] text-black font-bold text-sm hover:opacity-90 transition-opacity";
const SECONDARY = "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-white/20 hover:border-[var(--accent)] text-sm font-medium transition-colors";

export function SessionSummary(props: SessionSummaryProps) {
    const { mode, results, byChar, saved } = props;
    const quiz = mode === "quiz";
    const positive = results.filter((r) => r.outcome === "known" || r.outcome === "correct").length;
    const toReview = uniqueChars(results.filter((r) => r.outcome === "learning" || r.outcome === "missed").map((r) => r.char));
    const unsaved = toReview.filter((c) => !saved[c]);
    const endedEarly = results.length < props.total;

    return (
        <div>
            <p className="text-xs text-white/50 mb-1">{props.title} · {props.label}</p>
            <h1 className="text-3xl font-bold mb-2">Session complete</h1>
            <p className="text-white/60 text-sm mb-6">
                {endedEarly ? `You went through ${results.length} of ${props.total} cards.` : `You went through all ${props.total} cards.`}
            </p>

            <dl className="grid grid-cols-2 gap-3 mb-8 max-w-md">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <dt className="text-xs text-white/50 uppercase tracking-wider">{quiz ? "Correct" : "Knew it"}</dt>
                    <dd className="text-3xl font-bold text-[var(--accent)]" data-testid="summary-positive">{positive}</dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <dt className="text-xs text-white/50 uppercase tracking-wider">{quiz ? "To review" : "Still learning"}</dt>
                    <dd className="text-3xl font-bold" data-testid="summary-review">{results.length - positive}</dd>
                </div>
            </dl>

            {toReview.length > 0 ? (
                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-3">{quiz ? "Worth another look" : "Still learning"}</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {toReview.map((char) => {
                            const entry = byChar.get(char);
                            return (
                                <li key={char}>
                                    <Link
                                        href={kanjiPath(char)}
                                        className="flex items-center gap-3 rounded-lg border border-white/10 border-l-4 bg-white/5 px-3 py-2 hover:border-[var(--accent)] transition-colors"
                                        style={entry ? { borderLeftColor: jlptColor(jlptLevelOf(entry.j)) } : undefined}
                                    >
                                        <span className="font-japanese text-3xl font-bold">{char}</span>
                                        <span className="min-w-0 text-sm text-white/70 truncate">{entry?.m.slice(0, 3).join(", ")}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    {unsaved.length > 0 && (
                        <button type="button" onClick={() => props.onSave(unsaved)} className={`${SECONDARY} mt-3`}>
                            <BookmarkPlus className="w-4 h-4" aria-hidden /> Save {unsaved.length === 1 ? "it" : `these ${unsaved.length}`} to My list
                        </button>
                    )}
                </section>
            ) : (
                <p className="mb-8 text-white/70">{quiz ? "Every answer right." : "You knew every card."} Nice work!</p>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                {props.onNext && (
                    <button type="button" onClick={props.onNext} className={PRIMARY}>{props.nextLabel}</button>
                )}
                {toReview.length > 0 && (
                    <button type="button" onClick={() => props.onMissed(toReview)} className={props.onNext ? SECONDARY : PRIMARY}>
                        {quiz ? "Study missed ones" : "Study still-learning ones"} ({toReview.length})
                    </button>
                )}
                <button type="button" onClick={props.onAgain} className={SECONDARY}>Study again</button>
                <button type="button" onClick={props.onSetup} className={SECONDARY}>Change mode</button>
                <Link href="/my-list" className={SECONDARY}>Back to My list</Link>
                {props.backHref !== "/my-list" && <Link href={props.backHref} className={SECONDARY}>{props.backLabel}</Link>}
                <Link href="/study" className={SECONDARY}>Choose another deck</Link>
            </div>
        </div>
    );
}
