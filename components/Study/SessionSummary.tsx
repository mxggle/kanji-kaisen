"use client";

import { BookmarkPlus } from "lucide-react";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import type { StudyEntries } from "@/lib/study-list";
import { Button } from "@/components/ui/Button";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { uniqueChars, type StudyMode } from "./session";

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
    /** Each kanji's theme, for its tile colour. */
    categoryOf?: (char: string) => string | null;
    onSave: (chars: string[]) => void;
    onAgain: () => void;
    onMissed: (chars: string[]) => void;
    onNext: (() => void) | null;
    nextLabel: string;
    onSetup: () => void;
    backHref: string;
    backLabel: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The end of a session: what went by, the kanji worth another look, and where to go next (one primary). */
export function SessionSummary(props: SessionSummaryProps) {
    const { mode, results, byChar, saved, categoryOf } = props;
    const quiz = mode === "quiz";
    const positive = results.filter((r) => r.outcome === "known" || r.outcome === "correct").length;
    const toReview = uniqueChars(results.filter((r) => r.outcome === "learning" || r.outcome === "missed").map((r) => r.char));
    const unsaved = toReview.filter((c) => !saved[c]);
    const endedEarly = results.length < props.total;
    const went = endedEarly ? `You went through ${results.length} of ${props.total} cards` : `You went through all ${plural(props.total, "card", "cards")}`;
    const split = quiz
        ? `${positive} right, ${results.length - positive} to look at again`
        : `${positive} you knew, ${results.length - positive} still learning`;

    // One primary: the next chunk, else the missed ones, else the same cards again.
    const primary = props.onNext ? "next" : toReview.length > 0 ? "missed" : "again";

    return (
        <div className="flex flex-col gap-10">
            <header className="flex flex-col gap-3">
                <KindLabel jp="了">
                    {props.title} · {props.label}
                </KindLabel>
                <h1 className="type-title">Session complete</h1>
                <p className="text-base leading-relaxed text-ink-2">
                    {went}: {split}. A miss costs nothing.
                </p>
            </header>

            {toReview.length > 0 ? (
                <section className="flex flex-col gap-4">
                    <SectionHeader jp="再訪" title={quiz ? "Worth another look" : "Still learning"} as="h2" />
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2.5">
                        {toReview.map((char) => {
                            const entry = byChar.get(char);
                            return (
                                <li key={char} className="min-w-0">
                                    <KanjiTile kanji={{ char, meanings: entry?.m, onyomi: entry?.on, kunyomi: entry?.kun, category: categoryOf?.(char) ?? null }} />
                                </li>
                            );
                        })}
                    </ul>
                    {unsaved.length > 0 && (
                        <Button size="sm" onClick={() => props.onSave(unsaved)} className="self-start">
                            <BookmarkPlus aria-hidden /> Save {unsaved.length === 1 ? "it" : `these ${unsaved.length}`} to My list
                        </Button>
                    )}
                </section>
            ) : (
                <p className="text-base text-ink-2">{quiz ? "Every answer right." : "You knew every card."}</p>
            )}

            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2.5">
                    {props.onNext && (
                        <Button variant="primary" onClick={props.onNext}>
                            {props.nextLabel}
                        </Button>
                    )}
                    {toReview.length > 0 && (
                        <Button variant={primary === "missed" ? "primary" : "secondary"} onClick={() => props.onMissed(toReview)}>
                            {quiz ? "Study missed ones" : "Study still-learning ones"} · {toReview.length}
                        </Button>
                    )}
                    <Button variant={primary === "again" ? "primary" : "secondary"} onClick={props.onAgain}>
                        Study again
                    </Button>
                    <Button onClick={props.onSetup}>Change mode</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                    <Button variant="quiet" href="/my-list">
                        Back to My list
                    </Button>
                    {props.backHref !== "/my-list" && (
                        <Button variant="quiet" href={props.backHref}>
                            {props.backLabel}
                        </Button>
                    )}
                    <Button variant="quiet" href="/study">
                        Choose another deck
                    </Button>
                </div>
            </div>
        </div>
    );
}
