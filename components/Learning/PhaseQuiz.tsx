import { KanjiReadingHeader } from "./KanjiReadingHeader";
import { KanjiData } from "@/types/kanji";
import { KANJI_DATA } from "@/lib/data";
import { CHECKPOINTS } from "@/lib/checkpoints";
import { trackEvent } from "@/lib/analytics";
import { ArrowRight, CircleHelp } from "lucide-react";
import { useMemo, useState } from "react";
import { canSelectQuizMeaning, getLockedQuizMeaning } from "./phaseQuizState";

interface PhaseQuizProps {
    data: KanjiData;
    onNext: () => void;
    checkpointId: string;
    checkpointTitle: string;
    category: string;
    kanjiIndex: number;
}

interface DistractorCandidate {
    char: string;
    meaning: string;
    score: number;
}

const CHAR_TO_CATEGORY: Record<string, string> = CHECKPOINTS.reduce<Record<string, string>>((acc, checkpoint) => {
    checkpoint.kanji.forEach((char) => {
        if (!acc[char]) {
            acc[char] = checkpoint.category;
        }
    });
    return acc;
}, {});

function stableHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function tokenizeMeaning(meaning: string): Set<string> {
    return new Set(
        meaning
            .toLowerCase()
            .replace(/[^a-z0-9,\s/-]/g, " ")
            .split(/[\s,/-]+/)
            .map((t) => t.trim())
            .filter((t) => t.length >= 2)
    );
}

function overlapCount(a: Set<string>, b: Set<string>): number {
    let count = 0;
    a.forEach((token) => {
        if (b.has(token)) count += 1;
    });
    return count;
}

function scoreDistractor(target: KanjiData, targetCategory: string, candidate: KanjiData): number {
    const candidateCategory = CHAR_TO_CATEGORY[candidate.char] || "Others";
    const targetTokens = tokenizeMeaning(target.meaning);
    const candidateTokens = tokenizeMeaning(candidate.meaning);

    let score = 0;

    // 1) Same category: strongest signal for semantically similar context.
    if (candidateCategory === targetCategory) score += 5;

    // 2) Same JLPT level: similar difficulty band.
    if (candidate.jlpt === target.jlpt) score += 3;

    // 3) Similar stroke complexity: keeps options feeling from same "family".
    const strokeDiff = Math.abs(candidate.strokeCount - target.strokeCount);
    if (strokeDiff <= 2) score += 2;
    else if (strokeDiff <= 4) score += 1;

    // 4) Meaning token overlap: direct semantic closeness.
    score += overlapCount(targetTokens, candidateTokens) * 4;

    return score;
}

function buildOptions(target: KanjiData, category: string): string[] {
    const ranked: DistractorCandidate[] = KANJI_DATA
        .filter((k) => k.char !== target.char && k.meaning !== target.meaning)
        .map((candidate) => ({
            char: candidate.char,
            meaning: candidate.meaning,
            score: scoreDistractor(target, category, candidate),
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return stableHash(a.meaning + a.char) - stableHash(b.meaning + b.char);
        });

    const chosen: string[] = [];
    const used = new Set<string>();

    // Priority pick: best-scoring unique meanings.
    for (const item of ranked) {
        if (!used.has(item.meaning)) {
            chosen.push(item.meaning);
            used.add(item.meaning);
        }
        if (chosen.length === 3) break;
    }

    // Safety fallback: if data is sparse, fill from the full pool.
    if (chosen.length < 3) {
        for (const fallback of KANJI_DATA) {
            if (fallback.char === target.char || fallback.meaning === target.meaning) continue;
            if (!used.has(fallback.meaning)) {
                chosen.push(fallback.meaning);
                used.add(fallback.meaning);
            }
            if (chosen.length === 3) break;
        }
    }

    const options = [target.meaning, ...chosen];

    // Stable order per kanji, but not always same position globally.
    return options.sort((a, b) => stableHash(a + target.char) - stableHash(b + target.char));
}

export function PhaseQuiz({
    data,
    onNext,
    checkpointId,
    checkpointTitle,
    category,
    kanjiIndex,
}: PhaseQuizProps) {
    const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);

    const options = useMemo(() => {
        return buildOptions(data, category);
    }, [data, category]);

    const isCorrect = selectedMeaning === data.meaning;

    const handleSelect = (meaning: string) => {
        if (!canSelectQuizMeaning(selectedMeaning)) return;

        const lockedMeaning = getLockedQuizMeaning(selectedMeaning, meaning);
        setSelectedMeaning(lockedMeaning);
        trackEvent("quiz_answered", {
            checkpoint_id: checkpointId,
            checkpoint_title: checkpointTitle,
            category,
            kanji: data.char,
            kanji_index: kanjiIndex,
            selected_meaning: lockedMeaning,
            expected_meaning: data.meaning,
            is_correct: lockedMeaning === data.meaning,
        });
    };

    const handleContinue = () => {
        trackEvent("quiz_completed", {
            checkpoint_id: checkpointId,
            checkpoint_title: checkpointTitle,
            category,
            kanji: data.char,
            kanji_index: kanjiIndex,
            is_correct: isCorrect,
            selected_meaning: selectedMeaning,
        });
        onNext();
    };

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-2 w-full flex justify-center relative z-50">
                <KanjiReadingHeader data={data} />
            </div>

            <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3 text-cyan-300">
                    <CircleHelp size={16} />
                    <span className="text-sm font-semibold">Quick Quiz</span>
                </div>

                <p className="text-white/80 text-sm mb-4">
                    What is the best meaning of <span className="font-bold text-xl align-middle">{data.char}</span> ?
                </p>

                <div className="space-y-2">
                    {options.map((meaning) => {
                        const selected = selectedMeaning === meaning;
                        const showResult = selectedMeaning !== null;
                        const isRightOption = meaning === data.meaning;

                        return (
                            <button
                                key={meaning}
                                onClick={() => handleSelect(meaning)}
                                disabled={showResult}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selected
                                    ? isCorrect
                                        ? "border-green-500 bg-green-500/10 text-green-200"
                                        : "border-red-500 bg-red-500/10 text-red-200"
                                    : showResult && isRightOption
                                        ? "border-green-500/60 bg-green-500/10 text-green-200"
                                        : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white"
                                    } disabled:cursor-not-allowed`}
                            >
                                {meaning}
                            </button>
                        );
                    })}
                </div>

                {selectedMeaning && (
                    <p className={`text-sm mt-3 ${isCorrect ? "text-green-300" : "text-amber-300"}`}>
                        {isCorrect ? "Nice. You got it right." : `Close. Correct answer: ${data.meaning}`}
                    </p>
                )}
            </div>

            <div className="flex-1" />

            <div className="sticky bottom-0 left-0 right-0 w-[calc(100%+2rem)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/95 to-transparent pt-6 -mx-4 mt-auto">
                <button
                    onClick={handleContinue}
                    disabled={!selectedMeaning}
                    className="w-full py-4 bg-cyan-400 text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Continue to Trace <ArrowRight />
                </button>
            </div>

            <div className="h-4" />
        </div>
    );
}
