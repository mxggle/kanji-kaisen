"use client";

import { KanjiData } from "@/types/kanji";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface KanjiCardProps {
    data: KanjiData;
    maxFreq: number; // To normalize the heat
}

export function KanjiCard({ data, maxFreq }: KanjiCardProps) {
    // Calculate heat intensity (0 to 1)
    // Higher rank (lower number) = Hotter (1.0)
    // Lower rank (higher number) = Colder (0.0)
    const heatIntensity = useMemo(() => {
        const intensity = 1 - (data.frequency / maxFreq);
        return Math.max(0, Math.min(1, intensity));
    }, [data.frequency, maxFreq]);

    // Determine border color based on JLPT
    const borderColorClass = {
        N1: "border-[var(--n1)]",
        N2: "border-[var(--n2)]",
        N3: "border-[var(--n3)]",
        N4: "border-[var(--n4)]",
        N5: "border-[var(--n5)]",
    }[data.jlpt];

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center aspect-square p-2",
                "border-b-4 transition-all duration-200 cursor-pointer overflow-hidden",
                "hover:scale-105 hover:z-10 hover:border-b-[6px] hover:border-[var(--accent)]",
                "group"
            )}
            style={{
                // Interpolate between heat-min and heat-max
                backgroundColor: `color-mix(in oklab, var(--heat-max) ${heatIntensity * 100}%, var(--heat-min))`,
                borderColor: `var(--${data.jlpt.toLowerCase()})` // This is a fallback/helper if needed, but we use tailwind classes for borders usually. 
                // Actually, the site uses full border for JLPT. Let's try that.
            }}
        >
            {/* Top: On/Kun reading (simplified) */}
            <div className="text-[10px] text-white/70 truncate w-full text-center opacity-80 group-hover:opacity-100">
                {data.onyomi[0] || data.kunyomi[0]}
            </div>

            {/* Center: Kanji */}
            <div className="text-4xl font-bold text-white drop-shadow-md my-1">
                {data.char}
            </div>

            {/* Bottom: Meaning */}
            <div className="text-[11px] font-medium text-white/90 truncate w-full text-center leading-tight">
                {data.meaning.split(",")[0]}
            </div>

            {/* JLPT Indicator (Border is done via style/class, avoiding complex arbitrary values in class strings for now) */}
            <div
                className={cn(
                    "absolute inset-0 border-[3px] border-b-[6px] rounded-sm pointer-events-none transition-colors duration-200",
                    "group-hover:border-[var(--accent)]"
                )}
                style={{ borderColor: "inherit" }}
            />
        </div>
    );
}
