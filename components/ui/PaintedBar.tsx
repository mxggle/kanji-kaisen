import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { paintedPercent } from "@/lib/ink";
import { paintCaption } from "@/lib/ink-paint";

interface PaintedBarProps {
    /**
     * The group's kanji. The page's <InkPaint> paints the bar and its caption
     * from them after hydration (0 until then).
     */
    chars?: string | readonly string[];
    /** A fixed share from 0 to 1, for client parents that already know it, and demos. */
    painted?: number;
    /** Known kanji (濃 or 印) when `painted` is fixed, for the caption. */
    known?: number;
    /** Distinct kanji when `painted` is fixed, for the caption. */
    total?: number;
    /** Shows "N% painted · M of T familiar" above the bar (otherwise it is only read out). */
    caption?: boolean;
    /** Left side of the caption row, e.g. the theme's name. */
    label?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

/**
 * The one way a group (theme, radical, deck) shows progress (rule 3): a 4px
 * bar in --c, optionally with "N% painted · M of T familiar". Server-safe.
 */
export function PaintedBar({ chars, painted, known = 0, total, caption = false, label, className, style }: PaintedBarProps) {
    const list = chars === undefined ? undefined : Array.from(new Set(Array.from(chars)));
    const fixed = painted !== undefined;
    const pct = fixed ? paintedPercent(painted) : 0;
    const text = paintCaption({ painted: fixed ? painted : 0, known: fixed ? known : 0, total: total ?? list?.length ?? 0 });

    return (
        <div
            data-paint-chars={!fixed && list ? list.join("") : undefined}
            className={cn("flex min-w-0 flex-col gap-2.5", className)}
            style={{ "--painted": `${pct}%`, ...style } as CSSProperties}
        >
            {caption ? (
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[13px]">
                    {label && <span className="min-w-0 truncate">{label}</span>}
                    <span data-paint-caption="" className="ml-auto shrink-0 text-ink-3">
                        {text}
                    </span>
                </div>
            ) : (
                <span data-paint-caption="" className="sr-only">
                    {text}
                </span>
            )}
            <span aria-hidden className="block h-1 overflow-hidden rounded-sm bg-line-2">
                <i className="block h-full w-[var(--painted)] rounded-sm bg-c transition-[width] duration-500 motion-reduce:transition-none" />
            </span>
        </div>
    );
}
