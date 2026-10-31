"use client";

import { cn } from "@/lib/utils";
import { SHADE_NAMES, type Shade } from "@/lib/ink";
import { useInkHydrated, useShade } from "@/lib/ink-store";

interface InkDotsProps {
    shade: Shade;
    /** Start of the accessible label, e.g. "Your ink for 海". Default "Ink". */
    label?: string;
    /** Show the shade name after the dots. Default true. */
    showName?: boolean;
    className?: string;
}

/**
 * Four dots filled up to the shade (0–4), plus its name. Dots use --c, so they
 * follow the theme in 夜 when inside a themeVars() container and turn
 * vermilion in 墨.
 *
 * @deprecated One Atlas: a kanji's shade shows only as its tile fill (components/ui/KanjiTile) or an InkSwatch in a Tag (rule 3).
 */
export function InkDots({ shade, label = "Ink", showName = true, className }: InkDotsProps) {
    return (
        <span role="img" aria-label={`${label}: ${SHADE_NAMES[shade]}`} className={cn("inline-flex items-center gap-2 text-sm text-ink-2", className)}>
            <Dots filled={shade} />
            {showName && <span>{SHADE_NAMES[shade]}</span>}
        </span>
    );
}

function Dots({ filled }: { filled: number }) {
    return (
        <span className="flex gap-[3px]" aria-hidden>
            {[1, 2, 3, 4].map((k) => (
                <i key={k} className={cn("block w-3.5 h-1.5 rounded-[3px]", k <= filled ? "bg-c" : "bg-line-2")} />
            ))}
        </span>
    );
}

/**
 * InkDots for one kanji from the ink store. Shows empty dots until the store hydrates.
 *
 * @deprecated One Atlas: a kanji's shade shows only as its tile fill (components/ui/KanjiTile) or an InkSwatch in a Tag (rule 3).
 */
export function KanjiInkDots({ char, label, showName = true, className }: { char: string; label?: string; showName?: boolean; className?: string }) {
    const hydrated = useInkHydrated();
    const shade = useShade(char);
    if (!hydrated) {
        return (
            <span className={cn("inline-flex items-center gap-2 text-sm text-ink-2", className)} aria-hidden>
                <Dots filled={0} />
                {showName && <span className="invisible">{SHADE_NAMES[0]}</span>}
            </span>
        );
    }
    return <InkDots shade={shade} label={label ?? `Your ink for ${char}`} showName={showName} className={className} />;
}
