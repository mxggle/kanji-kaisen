"use client";

import type { MouseEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import { JourneyPlayer } from "@/components/Story/JourneyPlayer";
import type { JourneyView } from "./types";

/**
 * The specimen's Ancient tab: the sourced ancient forms, never redrawn.
 * JourneyPlayer's own Play would log `journey_played` (a radical event), so
 * the kanji page logs `build_played` instead, as before.
 */
export function AncientTab({ char, journey, todayStrokes }: { char: string; journey: JourneyView; todayStrokes: string[] }) {
    const onClick = (e: MouseEvent) => {
        const button = (e.target as Element).closest?.(".kkj-play");
        if (!button || button.getAttribute("aria-pressed") === "true") return;
        trackEvent("build_played", { kanji: char });
    };
    return (
        <div onClickCapture={onClick}>
            <JourneyPlayer char={char} stages={journey.stages} todayStrokes={todayStrokes} captions={journey.captions} analytics={false} emptyNote={null} />
        </div>
    );
}
