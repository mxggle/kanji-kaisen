"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildMeaningOptions, type QuizCandidate } from "@/lib/atlas/quiz";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { buttonClass } from "@/components/ui/Button";
import { enterOrder } from "@/components/Motion/tokens";
import { KanjiDetails } from "./KanjiDetails";
import { isTextEntry, isTypingTarget } from "./Flashcard";
import { toQuizCandidate } from "./session";

/** Marks inside an option play the moment the answer is given (not after the options' entrance delay). */
const AT_ONCE = { "--i": 0, "--delay": "0ms" } as React.CSSProperties;

interface QuizCardProps {
    entry: SearchIndexEntry;
    pool: QuizCandidate[];
    category: string | null;
    isLast: boolean;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
}

/**
 * One question. Motion: the glyph is laid down, then the four options rise in
 * order. An answer is marked, not dramatised: the right option fills softly and
 * its check is stamped, a wrong pick turns dashed and quiet (no shake), the
 * others step back; then the note and Next rise in.
 */
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
            <div
                className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-card p-6 sm:p-8"
                data-enter=""
                style={enterOrder(0, 0, { "--rise": "14px" } as React.CSSProperties)}
            >
                <span lang="ja" className="font-jp text-[112px] font-extrabold leading-none text-ink sm:text-[136px]">
                    {entry.c}
                </span>
                <p className="text-sm text-ink-2">What does this kanji mean?</p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2" data-enter-group="" style={{ "--rise": "10px", "--delay": "90ms" } as React.CSSProperties}>
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
                                // The same pill as the learn layer's Recall options.
                                className={cn(
                                    "flex min-h-[52px] w-full items-center gap-3 rounded-full border py-2.5 pr-5 pl-3 text-left text-base leading-snug transition-[color,background-color,border-color,scale] duration-300 active:scale-[.98] motion-reduce:active:scale-100",
                                    !answered && "cursor-pointer border-line-2 text-ink hover:border-ink",
                                    answered && isAnswer && "border-c bg-c/15 text-ink",
                                    answered && isPicked && !isAnswer && "border-dashed border-ink-3 text-ink-2",
                                    answered && !isAnswer && !isPicked && "border-line-2 text-ink-3",
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-300",
                                        answered && isAnswer ? "border-c bg-c text-onacc" : "border-line-2 text-ink-3",
                                    )}
                                >
                                    {answered && isAnswer ? <Check className="size-3.5" data-enter="stamp" style={AT_ONCE} /> : i + 1}
                                </span>
                                <span className="min-w-0 break-words">
                                    {option}
                                    {answered && isAnswer && <span className="sr-only"> (the answer)</span>}
                                    {answered && isPicked && !isAnswer && (
                                        <span className="block text-xs text-ink-3" data-enter="fade" style={AT_ONCE}>
                                            Your answer
                                        </span>
                                    )}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {answered && (
                <div
                    className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-[22px] py-5"
                    role="status"
                    data-enter=""
                    style={enterOrder(0, 120, { "--rise": "10px" } as React.CSSProperties)}
                >
                    <p className="font-bold text-ink">
                        {correct ? "Right." : <>Not quite: it means “{target.meaning}”. Nothing is lost.</>}
                    </p>
                    <KanjiDetails entry={entry} showMeanings={!correct} />
                </div>
            )}

            {answered && (
                <button
                    ref={nextRef}
                    type="button"
                    onClick={onNext}
                    className={cn(buttonClass({ variant: "primary", size: "lg" }), "w-full")}
                    data-enter=""
                    style={enterOrder(1, 120, { "--rise": "10px" } as React.CSSProperties)}
                >
                    {isLast ? "See summary" : "Next"} <ArrowRight aria-hidden />
                </button>
            )}
        </div>
    );
}
