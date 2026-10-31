import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getThemeColor } from "@/lib/atlas/categories";
import { SEAL_KANJI } from "@/lib/ink-paint";
import type { Shade } from "@/lib/ink";

export type SealSize = "sm" | "md" | "default" | "lg";

const ORB: Record<SealSize, string> = {
    sm: "size-7 text-[15px]",
    md: "size-11 text-[21px]",
    default: "size-15 text-[27px]",
    lg: "size-24 text-5xl",
};

interface RadicalSealProps {
    char: string;
    /** sm 28 · md 44 · default 60 · lg 96. */
    size?: SealSize;
    /** Caption under the seal (its meaning). */
    name?: ReactNode;
    /** Second caption, e.g. "123 kanji". */
    count?: ReactNode;
    /**
     * The radical's kanji, most common first. The first eight go in
     * data-radical-chars and the page's <InkPaint> fills the seal with their
     * rounded mean shade.
     */
    chars?: string | readonly string[];
    /** A fixed shade, for demos. Without `chars` or `shade` the seal is plain. */
    shade?: Shade;
    /** Theme name for the selected ring and fills; without one it inherits the page's. */
    category?: string | null;
    /** Renders a link. */
    href?: string;
    /** Renders a toggle button; true draws the selected ring in --c. */
    pressed?: boolean;
    onClick?: () => void;
    /** Accessible name when the captions don't say enough (e.g. "木 tree, 112 kanji"). */
    label?: string;
    className?: string;
    /** Extra classes for the circle. */
    orbClassName?: string;
}

/**
 * The one way a radical appears: a round seal, filled like its kanji (rule 3).
 * Server-safe; pass `onClick`/`pressed` only from a client component.
 */
export function RadicalSeal({
    char,
    size = "default",
    name,
    count,
    chars,
    shade,
    category,
    href,
    pressed,
    onClick,
    label,
    className,
    orbClassName,
}: RadicalSealProps) {
    const common = chars === undefined ? undefined : Array.from(chars).slice(0, SEAL_KANJI).join("");
    const orb = (
        <span
            lang="ja"
            data-radical-chars={shade === undefined ? common : undefined}
            data-ink={shade ?? (common !== undefined ? 0 : undefined)}
            className={cn(
                "flex flex-none items-center justify-center rounded-full border border-line-2 bg-card font-jp font-extrabold leading-none text-ink",
                "transition-shadow duration-200 group-hover:shadow-[0_0_0_1px_var(--ink-3)] motion-reduce:transition-none",
                "group-aria-pressed:shadow-[0_0_0_3px_var(--bg),0_0_0_5px_var(--c)]",
                ORB[size],
                orbClassName,
            )}
        >
            {char}
        </span>
    );
    const body = (
        <>
            {orb}
            {name && <span className="text-xs leading-tight text-ink-2">{name}</span>}
            {count && <span className="text-[11px] leading-tight text-ink-3">{count}</span>}
        </>
    );
    const style = category ? ({ "--tc": getThemeColor(category) } as CSSProperties) : undefined;
    const base = cn("group inline-flex min-w-0 flex-col items-center gap-2 text-center text-ink", className);

    if (href) {
        return (
            <Link href={href} aria-label={label} style={style} className={base}>
                {body}
            </Link>
        );
    }
    if (onClick || pressed !== undefined) {
        return (
            <button type="button" aria-pressed={pressed ?? false} aria-label={label} onClick={onClick} style={style} className={cn(base, "cursor-pointer")}>
                {body}
            </button>
        );
    }
    return (
        <span aria-label={label} role={label ? "img" : undefined} style={style} className={base}>
            {body}
        </span>
    );
}
