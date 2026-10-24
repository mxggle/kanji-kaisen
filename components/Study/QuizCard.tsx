"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildMeaningOptions, type QuizCandidate } from "@/lib/atlas/quiz";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { KanjiDetails } from "./KanjiDetails";
import { isTypingTarget } from "./Flashcard";
import { toQuizCandidate } from "./session";

interface QuizCardProps {
    entry: SearchIndexEntry;
    pool: QuizCandidate[];
    category: string | null;
    isLast: boolean;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

export function QuizCard({ entry, pool, category, isLast, onAnswer, onNext }: QuizCardProps) {
    const target = useMemo(() => toQuizCandidate(entry, category), [entry, category]);
    const options = useMemo(() => buildMeaningOptions(target, pool), [target, pool]);
    const [selected, setSelected] = useState<string | null>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const answered = selected !== null;
    const correct = selected === target.meaning;

    function choose(option: string) {
        if (answered) return;
        setSelected(option);
        onAnswer(option === target.meaning);
    }

    useEffect(() => {
        if (answered) nextRef.current?.focus();
    }, [answered]);

    const onKey = useEffectEvent((e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const n = Number(e.key);
        if (!answered && n >= 1 && n <= options.length) choose(options[n - 1]);
        else if (answered && (e.key === "Enter" || e.key === " ") && !isTypingTarget(e.target)) {
            e.preventDefault();
            onNext();
        }
    });

    useEffect(() => {
        const handler = (e: KeyboardEvent) => onKey(e);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col items-center">
                <span className="font-japanese font-bold text-8xl sm:text-9xl leading-none text-white">{entry.c}</span>
                <p className="mt-4 text-sm text-white/50">What does this kanji mean?</p>
            </div>

            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((option, i) => {
                    const isAnswer = option === target.meaning;
                    const isPicked = option === selected;
                    return (
                        <li key={option}>
                            <button
                                type="button"
                                onClick={() => choose(option)}
                                disabled={answered}
                                aria-pressed={isPicked}
                                className={cn(
                                    "w-full min-h-14 text-left rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors",
                                    !answered && "border-white/15 bg-white/5 hover:border-[var(--accent)]",
                                    answered && isAnswer && "border-[var(--accent)] bg-[var(--accent)]/15 text-white",
                                    answered && isPicked && !isAnswer && "border-white/50 border-dashed bg-white/10 text-white/80",
                                    answered && !isAnswer && !isPicked && "border-white/10 text-white/40",
                                )}
                            >
                                <span className="shrink-0 w-6 h-6 rounded-full border border-current text-xs flex items-center justify-center opacity-60">
                                    {answered && isAnswer ? <Check className="w-3.5 h-3.5" aria-hidden /> : i + 1}
                                </span>
                                <span className="min-w-0 break-words">
                                    {option}
                                    {answered && isPicked && !isAnswer && <span className="block text-xs text-white/50">Your answer</span>}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {answered && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4" role="status">
                    <p className={cn("font-bold mb-3", correct ? "text-[var(--accent)]" : "text-white")}>
                        {correct ? "Correct!" : <>Not quite — it means “{target.meaning}”.</>}
                    </p>
                    <KanjiDetails entry={entry} showMeanings={!correct} />
                </div>
            )}

            {answered && (
                <button
                    ref={nextRef}
                    type="button"
                    onClick={onNext}
                    className="mt-4 w-full h-14 rounded-xl bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                >
                    {isLast ? "See summary" : "Next"} <ArrowRight className="w-5 h-5" aria-hidden />
                </button>
            )}
        </div>
    );
}
