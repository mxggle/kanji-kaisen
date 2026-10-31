"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { SHADE_JP, SHADE_NAMES, SHADES, type Shade } from "@/lib/ink";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";

// Swatches from the System board: blank paper, then darker ink, then the seal.
const SWATCH: Record<Shade, string> = {
    0: "border border-dashed border-line-2 text-ink-3",
    1: "bg-ink/[.09] text-ink",
    2: "bg-ink/[.22] text-ink",
    3: "bg-ink/[.48] text-bg",
    4: "bg-c text-onacc",
};

interface InkPickerProps {
    char: string;
    /** `source` of the `ink_changed` event. Default "self". */
    source?: string;
    /** Accessible name of the radio group. */
    label?: string;
    className?: string;
}

/** Self-marking: pick any of the five shades for one kanji (up or down). */
export function InkPicker({ char, source = "self", label, className }: InkPickerProps) {
    const hydrated = useInkHydrated();
    const stored = useInkStore((state) => state.entries[char]?.shade ?? 0);
    const setShade = useInkStore((state) => state.setShade);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const current: Shade = hydrated ? stored : 0;

    const choose = (shade: Shade, focus = false) => {
        setShade(char, shade, source);
        if (focus) refs.current[shade]?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const last = SHADES.length - 1;
        let next: number | null = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = current === last ? 0 : current + 1;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = current === 0 ? last : current - 1;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = last;
        if (next === null) return;
        e.preventDefault();
        choose(next as Shade, true);
    };

    return (
        <div
            role="radiogroup"
            aria-label={label ?? `Your ink for ${char}`}
            aria-disabled={!hydrated || undefined}
            onKeyDown={hydrated ? onKeyDown : undefined}
            className={cn("flex flex-wrap gap-2", className)}
        >
            {SHADES.map((shade) => {
                const checked = hydrated && shade === current;
                return (
                    <button
                        key={shade}
                        ref={(el) => { refs.current[shade] = el; }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        // Roving tab stop: only the checked shade is in the tab order.
                        tabIndex={shade === current ? 0 : -1}
                        disabled={!hydrated}
                        onClick={() => choose(shade)}
                        className={cn(
                            "group flex w-16 flex-col items-center gap-1.5 rounded-xl p-1.5 text-xs transition-colors",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
                            checked ? "text-ink font-bold" : "text-ink-2 hover:text-ink",
                            !hydrated && "opacity-60",
                        )}
                    >
                        <span
                            lang="ja"
                            aria-hidden
                            className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-[10px] font-jp text-[22px] font-extrabold leading-none",
                                SWATCH[shade],
                                checked && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-bg",
                                shade === 4 && "halo",
                            )}
                        >
                            {SHADE_JP[shade]}
                        </span>
                        <span>{SHADE_NAMES[shade]}</span>
                    </button>
                );
            })}
        </div>
    );
}
