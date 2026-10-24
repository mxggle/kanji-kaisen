"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Layers, ListChecks, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useStudyStore } from "@/lib/study-store";
import type { StudyStatus } from "@/lib/study-list";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { Flashcard } from "./Flashcard";
import { QuizCard } from "./QuizCard";
import { SessionSummary, type CardResult } from "./SessionSummary";
import { Checkbox, SessionSkeleton } from "./ui";
import { useSearchIndex } from "./useSearchIndex";
import { SESSION_SIZE, sessionRanges, shuffled, toQuizCandidate, type StudyMode } from "./session";

export type DeckSource = "list" | "learning" | "jlpt" | "radical" | "theme";

interface StudySessionProps {
    source: DeckSource;
    title: string;
    chars: string[];
    backHref: string;
    backLabel: string;
    initialMode: StudyMode | null;
    categoryOf: (char: string) => string | null;
}

interface ActiveSession {
    cards: string[];
    /** "Cards 1–20 of 79", "Missed cards", … */
    label: string;
    /** Retry sessions (study again / missed) don't advance the deck position. */
    retry: boolean;
}

const MODES: { id: StudyMode; label: string; hint: string }[] = [
    { id: "flashcards", label: "Flashcards", hint: "See the kanji, recall it, flip to check. Mark “Knew it” or “Still learning”." },
    { id: "quiz", label: "Meaning quiz", hint: "Pick the right meaning from four options. Wrong answers cost nothing." },
];

/** A fresh shuffle seed per session (only called from event handlers). */
const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export function StudySession({ source, title, chars, backHref, backLabel, initialMode, categoryOf }: StudySessionProps) {
    const { entries: index, byChar, error, retry: retryIndex } = useSearchIndex();
    const saved = useStudyStore((s) => s.entries);
    const setStatus = useStudyStore((s) => s.setStatus);
    const save = useStudyStore((s) => s.save);

    const [phase, setPhase] = useState<"setup" | "running" | "summary">("setup");
    const [mode, setMode] = useState<StudyMode>(initialMode ?? "flashcards");
    const [rangeIndex, setRangeIndex] = useState(0);
    const [shuffle, setShuffle] = useState(false);
    const [saveMarked, setSaveMarked] = useState(false);
    const [session, setSession] = useState<ActiveSession | null>(null);
    const [position, setPosition] = useState(0);
    const [results, setResults] = useState<CardResult[]>([]);

    // Kanji missing from the slim index can't be shown, so they're left out.
    const deck = useMemo(() => (byChar ? chars.filter((c) => byChar.has(c)) : chars), [chars, byChar]);
    const ranges = sessionRanges(deck.length);
    const range = ranges[Math.min(rangeIndex, ranges.length - 1)];

    const pool = useMemo(() => (index ? index.map((e) => toQuizCandidate(e, categoryOf(e.c))) : []), [index, categoryOf]);

    function begin(cards: string[], label: string, retry: boolean, sessionMode = mode) {
        setSession({ cards, label, retry });
        setPosition(0);
        setResults([]);
        setMode(sessionMode);
        setPhase("running");
        window.scrollTo({ top: 0 });
        trackEvent("study_started", { source: retry ? `${source}_retry` : source, mode: sessionMode, deck_size: cards.length });
    }

    function beginRange(i: number) {
        const r = ranges[i];
        if (!r) return;
        setRangeIndex(i);
        const slice = deck.slice(r.start, r.end);
        const cards = shuffle ? shuffled(slice, randomSeed()) : slice;
        begin(cards, ranges.length > 1 ? `Cards ${r.label} of ${deck.length}` : `${deck.length} ${deck.length === 1 ? "card" : "cards"}`, false);
    }

    function finish(finalResults: CardResult[]) {
        if (!session) return;
        if (finalResults.length === 0) {
            setPhase("setup");
            return;
        }
        setResults(finalResults);
        setPhase("summary");
        window.scrollTo({ top: 0 });
        const positive = finalResults.filter((r) => r.outcome === "known" || r.outcome === "correct").length;
        trackEvent("study_completed", {
            source: session.retry ? `${source}_retry` : source,
            mode,
            deck_size: session.cards.length,
            answered: finalResults.length,
            ended_early: finalResults.length < session.cards.length,
            ...(mode === "flashcards" ? { known_count: positive } : { correct_count: positive }),
        });
    }

    function advance(current: CardResult[]) {
        if (!session) return;
        if (position + 1 >= session.cards.length) finish(current);
        else setPosition(position + 1);
    }

    function markFlashcard(char: string, status: StudyStatus) {
        // Saved kanji get their status updated; unsaved ones only when the learner opted in.
        if (saved[char] || saveMarked) setStatus(char, status);
        const next = [...results, { char, outcome: status }];
        setResults(next);
        advance(next);
    }

    function answerQuiz(char: string, correct: boolean) {
        setResults((r) => [...r, { char, outcome: correct ? "correct" : "missed" }]);
    }

    if (!byChar && !error) return <SessionSkeleton />;

    if (error) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
                <p className="font-medium text-white">Couldn’t load kanji details.</p>
                <button type="button" onClick={retryIndex} className="mt-3 text-[var(--accent)] hover:underline">Try again</button>
            </div>
        );
    }

    if (phase === "summary" && session) {
        const nextRange = !session.retry && rangeIndex + 1 < ranges.length ? ranges[rangeIndex + 1] : null;
        return (
            <SessionSummary
                title={title}
                mode={mode}
                label={session.label}
                total={session.cards.length}
                results={results}
                byChar={byChar!}
                saved={saved}
                onSave={(list) => list.forEach((c) => save(c))}
                onAgain={() => begin(session.cards, session.label, true)}
                onMissed={(list) => begin(list, mode === "quiz" ? "Missed cards" : "Still-learning cards", true)}
                onNext={nextRange ? () => beginRange(rangeIndex + 1) : null}
                nextLabel={nextRange ? `Next ${nextRange.end - nextRange.start}` : ""}
                onSetup={() => setPhase("setup")}
                backHref={backHref}
                backLabel={backLabel}
            />
        );
    }

    if (phase === "running" && session) {
        const char = session.cards[position];
        const entry = byChar!.get(char) as SearchIndexEntry;
        const answeredCurrent = results.length > position;
        return (
            <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <p className="text-xs text-white/50 truncate">{title} · {mode === "quiz" ? "Meaning quiz" : "Flashcards"}</p>
                        <p className="text-sm font-medium" aria-live="polite">
                            Card {position + 1} of {session.cards.length}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => finish(results)}
                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-white/20 text-sm text-white/80 hover:border-white/50 transition-colors"
                    >
                        <X className="w-4 h-4" aria-hidden /> End session
                    </button>
                </div>
                <div className="h-1 rounded-full bg-white/10 mb-6 overflow-hidden" aria-hidden>
                    <div
                        className="h-full bg-[var(--accent)] transition-[width]"
                        style={{ width: `${((position + (answeredCurrent ? 1 : 0)) / session.cards.length) * 100}%` }}
                    />
                </div>

                {mode === "flashcards" ? (
                    <Flashcard
                        key={`${position}-${char}`}
                        entry={entry}
                        status={saved[char]?.status ?? null}
                        saveMarked={saveMarked}
                        onSaveMarkedChange={setSaveMarked}
                        onSave={() => save(char)}
                        onMark={(status) => markFlashcard(char, status)}
                    />
                ) : (
                    <QuizCard
                        key={`${position}-${char}`}
                        entry={entry}
                        pool={pool}
                        category={categoryOf(char)}
                        isLast={position + 1 >= session.cards.length}
                        onAnswer={(correct) => answerQuiz(char, correct)}
                        onNext={() => advance(results)}
                    />
                )}
            </div>
        );
    }

    // Setup
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-white/60 text-sm mb-6">
                {deck.length} kanji
                {ranges.length > 1 && ` · studied ${SESSION_SIZE} at a time`}.{" "}
                <Link href={backHref} className="text-[var(--accent)] hover:underline">{backLabel}</Link>
            </p>

            <fieldset className="mb-6">
                <legend className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Mode</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            aria-pressed={mode === m.id}
                            onClick={() => setMode(m.id)}
                            className={cn(
                                "text-left rounded-xl border p-4 transition-colors",
                                mode === m.id ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-white/10 bg-white/5 hover:border-white/30",
                            )}
                        >
                            <span className="flex items-center gap-2 font-bold">
                                {m.id === "flashcards" ? <Layers className="w-4 h-4" aria-hidden /> : <ListChecks className="w-4 h-4" aria-hidden />}
                                {m.label}
                            </span>
                            <span className="block mt-1 text-sm text-white/60">{m.hint}</span>
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4 mb-6">
                {ranges.length > 1 && (
                    <label className="block max-w-xs">
                        <span className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Cards</span>
                        <select
                            value={rangeIndex}
                            onChange={(e) => setRangeIndex(Number(e.target.value))}
                            className="w-full h-10 rounded-md bg-neutral-900 border border-white/15 px-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                        >
                            {ranges.map((r, i) => (
                                <option key={r.start} value={i}>{r.label} of {deck.length}</option>
                            ))}
                        </select>
                    </label>
                )}
                <Checkbox checked={shuffle} onChange={setShuffle} label="Shuffle cards" />
                {mode === "flashcards" && (
                    <Checkbox
                        checked={saveMarked}
                        onChange={setSaveMarked}
                        label="Save cards I mark to My list"
                        hint="Saved kanji always get their status updated. Leave this off to study without saving anything new."
                    />
                )}
            </div>

            <button
                type="button"
                onClick={() => beginRange(rangeIndex)}
                disabled={deck.length === 0}
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[var(--accent)] text-black font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
                Start {range ? `(${range.end - range.start} cards)` : ""}
            </button>
        </div>
    );
}
