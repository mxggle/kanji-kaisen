"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { JourneyPlayer } from "@/components/Story/JourneyPlayer";
import { BuildPlayer } from "./BuildPlayer";
import type { BuildView, JourneyView } from "./types";

interface KanjiStoryProps {
    char: string;
    build: BuildView | null;
    journey: JourneyView | null;
    todayStrokes: string[];
    title: ReactNode;
}

/**
 * "How it was built": the KanjiVG parts (BuildPlayer) and, where sourced ancient
 * forms exist, the journey through them to today (JourneyPlayer). Play runs
 * parts → together → oracle bone/bronze/seal → today. Fires `build_played`
 * once per Play, from either player.
 */
export function KanjiStory({ char, build, journey, todayStrokes, title }: KanjiStoryProps) {
    const [view, setView] = useState<"parts" | "time">(build ? "parts" : "time");
    const [autoPlay, setAutoPlay] = useState(false);
    const journeyRef = useRef<HTMLDivElement>(null);
    const autoClick = useRef(false);

    // After the parts hand over, start the journey's own Play.
    useEffect(() => {
        if (view !== "time" || !autoPlay) return;
        const button = journeyRef.current?.querySelector<HTMLButtonElement>(".kkj-play");
        if (!button) return;
        autoClick.current = true;
        button.click();
        autoClick.current = false;
    }, [view, autoPlay]);

    // JourneyPlayer's Play would log `journey_played` (a radical event); log the kanji's build instead.
    const onJourneyClick = (e: MouseEvent) => {
        const button = (e.target as Element).closest?.(".kkj-play");
        if (!button || autoClick.current || button.getAttribute("aria-pressed") === "true") return;
        trackEvent("build_played", { kanji: char });
    };

    if (view === "parts" && build) {
        return (
            <BuildPlayer
                build={build}
                title={title}
                handOver={
                    journey
                        ? () => {
                              setAutoPlay(true);
                              setView("time");
                          }
                        : undefined
                }
                handOverLabel={journey ? "Through time" : undefined}
            />
        );
    }

    if (!journey) return null;
    return (
        <div ref={journeyRef} onClickCapture={onJourneyClick} className="flex flex-col gap-3">
            <JourneyPlayer
                char={char}
                stages={journey.stages}
                todayStrokes={todayStrokes}
                captions={journey.captions}
                analytics={false}
                emptyNote={null}
                title={title}
            />
            {build && (
                <button
                    type="button"
                    onClick={() => {
                        setAutoPlay(false);
                        setView("parts");
                    }}
                    className="inline-flex h-11 items-center gap-2 self-start rounded-full px-3 text-sm text-ink-2 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                    <ArrowLeft size={15} aria-hidden /> Back to the parts
                </button>
            )}
        </div>
    );
}
