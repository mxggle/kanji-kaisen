"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildMeaningOptions, type QuizCandidate } from "@/lib/atlas/quiz";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { buttonClass } from "@/components/ui/Button";
import { KanjiDetails } from "./KanjiDetails";
import { isTextEntry, isTypingTarget } from "./Flashcard";
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
        if (e.metaKey || e.ctrlKey || e.altKey || isTextEntry(e.target)) return;
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
        <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-card p-6 sm:p-8">
                <span lang="ja" className="font-jp text-[112px] font-extrabold leading-none text-ink sm:text-[136px]">
                    {entry.c}
                </span>
                <p className="text-sm text-ink-2">What does this kanji mean?</p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
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
                                    "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                                    !answered && "cursor-pointer border-line bg-card text-ink hover:border-ink-3",
                                    answered && isAnswer && "border-ok bg-ok/10 text-ink",
                                    answered && isPicked && !isAnswer && "border-dashed border-bad bg-card text-ink",
                                    answered && !isAnswer && !isPicked && "border-line text-ink-3",
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                                        answered && isAnswer ? "border-ok text-ok" : "border-line-2 text-ink-3",
                                    )}
                                >
                                    {answered && isAnswer ? <Check className="size-3.5" /> : i + 1}
                                </span>
                                <span className="min-w-0 break-words">
                                    {option}
                                    {answered && isAnswer && <span className="sr-only"> (the answer)</span>}
                                    {answered && isPicked && !isAnswer && <span className="block text-xs text-bad">Your answer</span>}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {answered && (
                <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-[22px] py-5" role="status">
                    <p className={cn("font-bold", correct ? "text-ok" : "text-ink")}>
                        {correct ? "Right." : <>Not quite: it means “{target.meaning}”. Nothing is lost.</>}
                    </p>
                    <KanjiDetails entry={entry} showMeanings={!correct} />
                </div>
            )}

            {answered && (
                <button ref={nextRef} type="button" onClick={onNext} className={cn(buttonClass({ variant: "primary", size: "lg" }), "w-full")}>
                    {isLast ? "See summary" : "Next"} <ArrowRight aria-hidden />
                </button>
            )}
        </div>
    );
}
