import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    /** sm 36px (beside a chip row); md 44px (a form field). */
    size?: "sm" | "md";
    /** Classes for the wrapper, e.g. a width. */
    className?: string;
}

/**
 * A native <select> drawn like the system's pill fields (line-2 border, card
 * fill, ink chevron) instead of the browser's own control. Server-safe; pass
 * onChange only from a client component.
 */
export function Select({ size = "sm", className, children, ...props }: SelectProps) {
    return (
        <span className={cn("relative inline-flex min-w-0", className)}>
            <select
                {...props}
                className={cn(
                    "w-full min-w-0 cursor-pointer appearance-none rounded-full border border-line-2 bg-card text-ink transition-colors hover:border-ink-3",
                    size === "sm" ? "h-9 pr-9 pl-3.5 text-sm" : "h-11 pr-10 pl-4 text-[15px]",
                )}
            >
                {children}
            </select>
            <ChevronDown
                aria-hidden
                className={cn("pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-ink-2", size === "sm" ? "right-3" : "right-3.5")}
            />
        </span>
    );
}
