import { KanjiReadingHeader } from "./KanjiReadingHeader";
import { KanjiData } from "@/types/kanji";
import { KANJI_DATA } from "@/lib/data";
import { CHECKPOINTS } from "@/lib/checkpoints";
import { trackEvent } from "@/lib/analytics";
import { ArrowRight, CircleHelp } from "lucide-react";
import { useMemo, useState } from "react";
import { buildQuizOptions } from "./quizDistractors";
import {
    canSelectQuizMeaning,
    getLockedQuizMeaning,
    shouldLoseHeartForQuizSelection,
} from "./phaseQuizState";

interface PhaseQuizProps {
    data: KanjiData;
    onNext: () => void;
    onFail: () => void;
    checkpointId: string;
    checkpointTitle: string;
    category: string;
    kanjiIndex: number;
}

const CHAR_TO_CATEGORY: Record<string, string> = CHECKPOINTS.reduce<Record<string, string>>((acc, checkpoint) => {
    checkpoint.kanji.forEach((char) => {
        if (!acc[char]) {
            acc[char] = checkpoint.category;
        }
    });
    return acc;
}, {});

export function PhaseQuiz({
    data,
    onNext,
    onFail,
    checkpointId,
    checkpointTitle,
    category,
    kanjiIndex,
}: PhaseQuizProps) {
    const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);

    const options = useMemo(() => {
        return buildQuizOptions(data, category, KANJI_DATA, CHAR_TO_CATEGORY);
    }, [data, category]);

    const isCorrect = selectedMeaning === data.meaning;

    const handleSelect = (meaning: string) => {
        if (!canSelectQuizMeaning(selectedMeaning)) return;

        const lockedMeaning = getLockedQuizMeaning(selectedMeaning, meaning);
        const shouldLoseHeart = shouldLoseHeartForQuizSelection(
            selectedMeaning,
            lockedMeaning,
            data.meaning
        );

        setSelectedMeaning(lockedMeaning);
        if (shouldLoseHeart) {
            onFail();
        }

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
                <KanjiReadingHeader data={data} hideMeaning={selectedMeaning === null} />
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
