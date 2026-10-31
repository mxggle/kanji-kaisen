// A kanji drawn from KanjiVG paths for screens: faint guide strokes, the
// strokes drawn so far in the theme colour (glowing in 夜, vermilion in 墨),
// and optional radical highlighting. Drawing uses a dash transition, which the
// global reduced-motion rule turns into an instant change.

import { cn } from "@/lib/utils";
import { KANJIVG_VIEWBOX } from "./strokes";

// Glow only in 夜: --glow-off is `none` in 墨.
const GLOW = { filter: "var(--glow-off, drop-shadow(0 0 .35vmin var(--c)) drop-shadow(0 0 1.6vmin color-mix(in oklab, var(--c) 55%, transparent)))" };

export interface StrokeGlyphProps {
    strokes: string[];
    /** Strokes drawn so far (defaults to all). */
    drawn?: number;
    /** Stroke indices to highlight in the theme colour, the rest in ink (used for the radical). */
    highlight?: readonly number[] | null;
    /** Show all strokes in plain ink (quiz question). */
    plain?: boolean;
    strokeWidth?: number;
    className?: string;
    label: string;
}

export function StrokeGlyph({ strokes, drawn = strokes.length, highlight = null, plain = false, strokeWidth = 4.4, className, label }: StrokeGlyphProps) {
    const common = { fill: "none", strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    const marked = highlight ? new Set(highlight) : null;

    return (
        <div role="img" aria-label={label} className={cn("relative", className)}>
            {/* Guide: the whole kanji, faint. */}
            <svg viewBox={KANJIVG_VIEWBOX} className="absolute inset-0 w-full h-full" aria-hidden>
                <g {...common} className={plain || marked ? "stroke-ink" : "stroke-line-2"}>
                    {strokes.map((d, i) => (
                        <path key={i} d={d} className={marked && !marked.has(i) ? "stroke-ink-3" : undefined} />
                    ))}
                </g>
            </svg>
            {!plain && (
                <svg viewBox={KANJIVG_VIEWBOX} className="absolute inset-0 w-full h-full" style={GLOW} aria-hidden>
                    <g {...common} className="stroke-c">
                        {strokes.map((d, i) =>
                            marked ? (
                                marked.has(i) && <path key={i} d={d} />
                            ) : (
                                <path
                                    key={i}
                                    d={d}
                                    pathLength={1}
                                    // The gap is longer than the stroke, so no round cap peeks out before it is drawn.
                                    strokeDasharray="1 1.2"
                                    strokeDashoffset={i < drawn ? 0 : 1.1}
                                    className="transition-[stroke-dashoffset] duration-700 ease-out"
                                />
                            ),
                        )}
                    </g>
                </svg>
            )}
        </div>
    );
}
