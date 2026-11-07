"use client";

import Link from "next/link";
import { useId, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useStudyStore } from "@/lib/study-store";
import type { StudyStatus } from "@/lib/study-list";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { Button } from "@/components/ui/Button";
import { PaintedBar } from "@/components/ui/PaintedBar";
import { KindLabel } from "@/components/ui/SectionHeader";
import { Settle } from "@/components/Browse/Settle";
import { enterOrder } from "@/components/Motion/tokens";
import { Flashcard } from "./Flashcard";
import { QuizCard } from "./QuizCard";
import { SessionSummary, type CardResult } from "./SessionSummary";
import { Checkbox, SessionSkeleton, STUDY_COLUMN } from "./ui";
import { useSearchIndex } from "./useSearchIndex";
import { SESSION_SIZE, sessionRanges, shuffled, toQuizCandidate, type StudyMode } from "./session";

export type DeckSource = "list" | "learning" | "jlpt" | "radical" | "theme" | "chars" | "revisit";

interface StudySessionProps {
    source: DeckSource;
    title: string;
    chars: string[];
    backHref: string;
    backLabel: string;
    initialMode: StudyMode | null;
    categoryOf: (char: string) => string | null;
    /** A theme deck takes its theme's colour. */
    category?: string | null;
}

interface ActiveSession {
    cards: string[];
    /** "Cards 1–20 of 79", "Missed cards", … */
    label: string;
    /** Retry sessions (study again / missed) don't advance the deck position. */
    retry: boolean;
}

const MODES: { id: StudyMode; jp: string; label: string; hint: string }[] = [
    { id: "flashcards", jp: "札", label: "Flashcards", hint: "See the kanji, recall it, flip to check. Mark “Knew it” or “Still learning”." },
    { id: "quiz", jp: "問", label: "Meaning quiz", hint: "Pick the right meaning from four. A wrong answer costs nothing." },
];

/** A fresh shuffle seed per session (only called from event handlers). */
const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export function StudySession({ source, title, chars, backHref, backLabel, initialMode, categoryOf, category }: StudySessionProps) {
    const { entries: index, byChar, error, retry: retryIndex } = useSearchIndex();
    const saved = useStudyStore((s) => s.entries);
    const setStatus = useStudyStore((s) => s.setStatus);
    const save = useStudyStore((s) => s.save);
    const rangeId = useId();

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

    const shell = (children: ReactNode) => (
        <div className={STUDY_COLUMN} style={category ? themeVars(category) : undefined}>
            {children}
        </div>
    );

    if (!byChar && !error) return shell(<SessionSkeleton />);

    if (error) {
        return shell(
            <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-card px-[22px] py-5">
                <p className="text-ink">Couldn&apos;t load kanji details.</p>
                <Button size="sm" onClick={retryIndex}>
                    Try again
                </Button>
            </div>,
        );
    }

    if (phase === "summary" && session) {
        const nextRange = !session.retry && rangeIndex + 1 < ranges.length ? ranges[rangeIndex + 1] : null;
        return shell(
            <SessionSummary
                title={title}
                mode={mode}
                label={session.label}
                total={session.cards.length}
                results={results}
                byChar={byChar!}
                saved={saved}
                categoryOf={categoryOf}
                onSave={(list) => list.forEach((c) => save(c))}
                onAgain={() => begin(session.cards, session.label, true)}
                onMissed={(list) => begin(list, mode === "quiz" ? "Missed cards" : "Still-learning cards", true)}
                onNext={nextRange ? () => beginRange(rangeIndex + 1) : null}
                nextLabel={nextRange ? `Next ${nextRange.end - nextRange.start}` : ""}
                onSetup={() => setPhase("setup")}
                backHref={backHref}
                backLabel={backLabel}
            />,
        );
    }

    if (phase === "running" && session) {
        const char = session.cards[position];
        const entry = byChar!.get(char) as SearchIndexEntry;
        return shell(
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3" data-enter="fade">
                    <div className="min-w-0">
                        <p className="type-label truncate">
                            {title} · {mode === "quiz" ? "Meaning quiz" : "Flashcards"}
                        </p>
                        <p className="text-sm text-ink-2" aria-live="polite">
                            {/* The whole line is re-keyed, so the live region still reads it out in full. */}
                            <Settle value={position}>
                                Card {position + 1} of {session.cards.length}
                            </Settle>
                        </p>
                    </div>
                    <Button size="sm" onClick={() => finish(results)}>
                        <X aria-hidden /> End session
                    </Button>
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
            </div>,
        );
    }

    // Setup
    return shell(
        <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-3">
                <KindLabel jp="学習" data-enter="fade">
                    Study
                </KindLabel>
                <h1 className="type-title" data-enter="ink" style={enterOrder(1)}>
                    {title}
                </h1>
                <p className="text-base leading-relaxed text-ink-2" data-enter="" style={enterOrder(2)}>
                    {deck.length} kanji
                    {ranges.length > 1 && `, studied ${SESSION_SIZE} at a time`}.{" "}
                    <Link href={backHref} className="text-ink underline underline-offset-[3px] hover:text-ink-2">
                        {backLabel}
                    </Link>
                </p>
                <PaintedBar chars={deck} caption label="Your ink in this deck" className="max-w-md pt-1" />
            </header>

            <fieldset className="flex flex-col gap-3" data-enter="" style={enterOrder(3)}>
                <legend className="type-label mb-3">Mode</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            aria-pressed={mode === m.id}
                            onClick={() => setMode(m.id)}
                            className={cn(
                                "flex cursor-pointer items-start gap-3.5 rounded-2xl border px-5 py-4 text-left transition-colors",
                                mode === m.id ? "border-ink bg-raise" : "border-line bg-card hover:border-ink-3",
                            )}
                        >
                            <span
                                aria-hidden
                                lang="ja"
                                className={cn(
                                    "flex size-11 flex-none items-center justify-center rounded-full border font-jp text-[21px] font-extrabold leading-none",
                                    mode === m.id ? "border-ink bg-ink text-bg" : "border-line-2",
                                )}
                            >
                                {m.jp}
                            </span>
                            <span className="flex min-w-0 flex-col gap-1">
                                <span className="text-[17px] font-bold leading-snug">{m.label}</span>
                                <span className="text-sm text-ink-2">{m.hint}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-[22px] py-5" data-enter="" style={enterOrder(4)}>
                {ranges.length > 1 && (
                    <div className="flex max-w-xs flex-col gap-1.5">
                        <label htmlFor={rangeId} className="type-label">
                            Cards
                        </label>
                        <select
                            id={rangeId}
                            value={rangeIndex}
                            onChange={(e) => setRangeIndex(Number(e.target.value))}
                            className="h-11 w-full rounded-xl border border-line-2 bg-card px-3 text-sm text-ink focus:border-ink"
                        >
                            {ranges.map((r, i) => (
                                <option key={r.start} value={i}>
                                    {r.label} of {deck.length}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <Checkbox checked={shuffle} onChange={setShuffle} label="Shuffle cards" />
                {mode === "flashcards" && (
                    <Checkbox
                        checked={saveMarked}
                        onChange={setSaveMarked}
                        label="Save cards I mark to My list"
                        hint="Saved kanji always get their mark updated. Leave this off to study without saving anything new."
                    />
                )}
            </div>

            <Button variant="primary" size="lg" onClick={() => beginRange(rangeIndex)} disabled={deck.length === 0} className="self-start" data-enter="" style={enterOrder(5)}>
                Start{range ? ` · ${range.end - range.start} ${range.end - range.start === 1 ? "card" : "cards"}` : ""}
            </Button>
        </div>,
    );
}
