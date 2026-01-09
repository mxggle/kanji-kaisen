import { KanjiCanvas } from "./KanjiCanvas";
import { KanjiData } from "@/types/kanji";
import { ArrowRight } from "lucide-react";

interface PhaseInfoProps {
    data: KanjiData;
    onNext: () => void;
}

export function PhaseInfo({ data, onNext }: PhaseInfoProps) {
    return (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold mb-4 text-zinc-400">Phase 1: Memorize</h3>

            <div className="mb-6 scale-110">
                <KanjiCanvas kanji={data.char} mode="view" animateOnLoad={true} />
            </div>

            <div className="text-center mb-8 space-y-2">
                <h2 className="text-4xl font-bold text-white">{data.meaning}</h2>
                <div className="flex flex-col gap-1 text-zinc-400">
                    <p><span className="text-[var(--n5)]">Onyomi:</span> {data.onyomi.join(", ")}</p>
                    <p><span className="text-[var(--accent)]">Kunyomi:</span> {data.kunyomi.join(", ")}</p>
                </div>
            </div>

            <button
                onClick={onNext}
                className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
            >
                Start Practice <ArrowRight />
            </button>
        </div>
    );
}
