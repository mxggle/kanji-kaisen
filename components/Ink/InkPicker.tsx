"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { SHADE_JP, SHADE_NAMES, SHADES, type Shade } from "@/lib/ink";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";

interface InkPickerProps {
    char: string;
    /** `source` of the `ink_changed` event. Default "self". */
    source?: string;
    /** Accessible name of the radio group. */
    label?: string;
    className?: string;
}

/**
 * Self-marking: the five shades as swatches, filled like a tile (rule 3), for
 * one kanji. Any shade, up or down. The colour follows the page's theme.
 */
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
        // Arrows stop at the ends: wrapping from 印 to 白 would wipe a kanji's ink.
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(current + 1, last);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(current - 1, 0);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = last;
        if (next === null) return;
        e.preventDefault();
        if (next !== current) choose(next as Shade, true);
    };

    return (
        <div
            role="radiogroup"
            aria-label={label ?? `Your ink for ${char}`}
            aria-disabled={!hydrated || undefined}
            onKeyDown={hydrated ? onKeyDown : undefined}
            className={cn("flex flex-wrap gap-1.5", className)}
        >
            {SHADES.map((shade) => {
                const checked = hydrated && shade === current;
                return (
                    <button
                        key={shade}
                        ref={(el) => {
                            refs.current[shade] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        // Roving tab stop: only the checked shade is in the tab order.
                        tabIndex={shade === current ? 0 : -1}
                        disabled={!hydrated}
                        onClick={() => choose(shade)}
                        className={cn(
                            "flex w-[60px] cursor-pointer flex-col items-center gap-1.5 rounded-xl px-0.5 py-1.5 text-xs transition-colors disabled:cursor-default",
                            checked ? "font-bold text-ink" : "text-ink-2 hover:text-ink",
                        )}
                    >
                        <span
                            lang="ja"
                            aria-hidden
                            data-ink={shade}
                            className={cn(
                                "flex size-11 items-center justify-center rounded-[10px] border font-jp text-[22px] font-extrabold leading-none",
                                checked && "outline-2 outline-offset-2 outline-ink",
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
