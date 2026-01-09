import { KanjiCanvas } from "./KanjiCanvas";
import { KanjiData } from "@/types/kanji";
import { ArrowRight, RefreshCw } from "lucide-react";

interface PhasePracticeProps {
    data: KanjiData;
    onNext: () => void;
}

export function PhasePractice({ data, onNext }: PhasePracticeProps) {
    return (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-xl font-bold mb-4 text-zinc-400">Phase 2: Trace</h3>

            <div className="mb-6 scale-110 relative">
                <KanjiCanvas
                    kanji={data.char}
                    mode="practice"
                // In a real app we'd auto-advance on complete
                // onComplete={onNext} 
                />
            </div>

            <div className="text-center mb-8">
                <p className="text-zinc-400 max-w-xs">
                    Trace the strokes carefully. Follow the guide.
                </p>
            </div>

            <button
                onClick={onNext}
                className="w-full py-4 bg-[var(--accent)] text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-[#1eeeee] transition-colors"
            >
                I'm Ready <ArrowRight />
            </button>
        </div>
    );
}
