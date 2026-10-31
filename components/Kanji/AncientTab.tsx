import { JourneyPlayer } from "@/components/Story/JourneyPlayer";
import type { JourneyView } from "./types";

/** The specimen's Ancient tab: the sourced ancient forms, never redrawn, in the player's compact form. */
export function AncientTab({ char, journey, todayStrokes }: { char: string; journey: JourneyView; todayStrokes: string[] }) {
    return <JourneyPlayer variant="tab" char={char} stages={journey.stages} todayStrokes={todayStrokes} captions={journey.captions} analytics={false} emptyNote={null} />;
}
