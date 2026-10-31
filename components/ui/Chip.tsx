import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getThemeColor } from "@/lib/atlas/categories";

interface ChipProps {
    children: ReactNode;
    /** A toggle (filter): aria-pressed, solid ink when on. */
    pressed?: boolean;
    onClick?: () => void;
    /** A chip that navigates instead of toggling. */
    href?: string;
    /** Small count after the label ("N5 80"). */
    count?: ReactNode;
    /** Only a chip that names a theme shows a coloured dot (rule 1). */
    theme?: string;
    disabled?: boolean;
    className?: string;
    "aria-label"?: string;
}

/** Chip classes, for toggles that can't be a <Chip> (e.g. a styled <label>). */
export const CHIP_CLASS =
    "group inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-line-2 bg-transparent px-3.5 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg disabled:cursor-not-allowed disabled:opacity-50";

/** A filter or quick link. Server-safe; pass `onClick` only from a client component. */
export function Chip({ children, pressed, onClick, href, count, theme, disabled, className, ...aria }: ChipProps) {
    const style = theme ? ({ "--tc": getThemeColor(theme) } as CSSProperties) : undefined;
    const body = (
        <>
            {theme && <span aria-hidden className="size-2 flex-none rounded-full bg-c" />}
            {children}
            {count !== undefined && <span className="text-xs text-ink-3 group-aria-pressed:text-bg">{count}</span>}
        </>
    );
    if (href) {
        return (
            <Link href={href} style={style} className={cn(CHIP_CLASS, className)} {...aria}>
                {body}
            </Link>
        );
    }
    return (
        <button type="button" aria-pressed={pressed} onClick={onClick} disabled={disabled} style={style} className={cn(CHIP_CLASS, className)} {...aria}>
            {body}
        </button>
    );
}
