import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A plain fact: N5, 6 strokes, Grade 1. Never coloured (rule 1); `solid` marks
 * a state such as "Saved". Server-safe.
 */
export function Tag({
    children,
    solid,
    className,
    ...rest
}: {
    children: ReactNode;
    solid?: boolean;
    className?: string;
    style?: CSSProperties;
    /** Motion hooks (data-enter…) pass through. */
    [data: `data-${string}`]: string | undefined;
}) {
    return (
        <span
            {...rest}
            className={cn(
                "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[13px] leading-none",
                solid ? "border-ink bg-ink text-bg" : "border-line-2 text-ink-2",
                className,
            )}
        >
            {children}
        </span>
    );
}
