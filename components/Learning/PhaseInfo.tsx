import { KanjiCanvas, KanjiCanvasRef } from "./KanjiCanvas";
import { KanjiReadingHeader } from "./KanjiReadingHeader";
import { KanjiData } from "@/types/kanji";
import { ArrowRight, Play } from "lucide-react";
import { useRef } from "react";

interface PhaseInfoProps {
    data: KanjiData;
    onNext: () => void;
}

export function PhaseInfo({ data, onNext }: PhaseInfoProps) {
    const canvasRef = useRef<KanjiCanvasRef>(null);

    const handleReplay = () => {
        canvasRef.current?.animate();
    };

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-2 w-full flex justify-center relative z-50">
                <KanjiReadingHeader data={data} />
            </div>

            <div className="mb-6 relative">
                <KanjiCanvas
                    ref={canvasRef}
                    kanji={data.char}
                    mode="view"
                    animateOnLoad={true}
                />
                {/* Replay button */}
                <button
                    onClick={handleReplay}
                    className="absolute bottom-2 right-2 p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                    title="Replay animation"
                >
                    <Play size={16} />
                </button>
            </div>

            {/* Removed standalone KanjiInfoDisplay - content now in header */}
            <div className="flex-1" />

            <div className="sticky bottom-0 left-0 right-0 w-[calc(100%+2rem)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/95 to-transparent pt-12 -mx-4 mt-auto">
                <button
                    onClick={onNext}
                    className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98] transition-all"
                >
                    Start Practice <ArrowRight />
                </button>
            </div>

            {/* Spacer to allow scrolling content above sticky footer */}
            <div className="h-8" />
        </div>
    );
}
