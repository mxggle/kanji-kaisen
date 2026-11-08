import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Rule 2, line = role: solid carries meaning, dashed carries sound, grey is form only. */
export type PartRole = "meaning" | "sound" | "form";

const ROLE: Record<PartRole, { chip: string; orb: string }> = {
    meaning: { chip: "border border-c bg-c/10", orb: "bg-c text-onacc" },
    sound: { chip: "border border-dashed border-c", orb: "border border-dashed border-c text-c" },
    form: { chip: "border border-line-2", orb: "border border-line-2" },
};

interface PartChipProps {
    /** The part (氵). */
    char: string;
    role: PartRole;
    /** What it means or how it reads ("water", "マイ→カイ"). */
    label?: ReactNode;
    /** The small grey word after it; defaults to the role ("meaning", "sound", "form"). */
    note?: ReactNode;
    /** Links to the radical (or the part's own kanji page). */
    href?: string;
    /** md 44px; sm 40px for phones. */
    size?: "md" | "sm";
    className?: string;
    style?: CSSProperties;
    /** Motion hooks (data-enter, data-reveal…) pass through. */
    [data: `data-${string}`]: string | undefined;
}

/**
 * A part of a kanji, drawn by its role. The colour is the page's theme (an
 * ancestor's --tc), never the part's own theme. Server-safe.
 */
export function PartChip({ char, role, label, note, href, size = "md", className, ...rest }: PartChipProps) {
    const r = ROLE[role];
    const body = (
        <>
            <span
                lang="ja"
                className={cn(
                    "flex flex-none items-center justify-center rounded-full font-jp font-extrabold leading-none",
                    size === "md" ? "size-8 text-[19px]" : "size-7 text-[17px]",
                    r.orb,
                )}
            >
                {char}
            </span>
            {label}
            <span className="text-xs text-ink-2">
                <span className="sr-only">(</span>
                {note ?? role}
                <span className="sr-only">)</span>
            </span>
        </>
    );
    const cls = cn(
        "inline-flex items-center gap-2.5 whitespace-nowrap rounded-full pr-4 pl-1.5 text-[15px] text-ink",
        size === "md" ? "h-11" : "h-10",
        r.chip,
        // Press: a linked chip gives under the finger (docs/design/motion.md).
        href && "transition-[color,background-color,border-color,scale] duration-[140ms] ease-(--ease-out) hover:bg-c/15 active:scale-[.97]",
        className,
    );
    return href ? (
        <Link href={href} className={cls} {...rest}>
            {body}
        </Link>
    ) : (
        <span className={cls} {...rest}>
            {body}
        </span>
    );
}

/** The "+" between part chips. */
export function PartPlus(props: { style?: CSSProperties; [data: `data-${string}`]: string | undefined }) {
    return (
        <span aria-hidden className="text-lg text-ink-3" {...props}>
            +
        </span>
    );
}
