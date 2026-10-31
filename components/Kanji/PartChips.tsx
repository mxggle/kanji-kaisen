import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { PartView } from "./types";
import styles from "./kanji.module.css";

/**
 * Inline style + classes that colour an element by its part (theme colour in 夜, vermilion or ink in 墨).
 * @deprecated One Atlas: parts take the page's --c and show their role by line (components/ui/PartChip); kept for the #learn layer.
 */
export function partStyle(part: Pick<PartView, "themeColor">): CSSProperties {
    return { "--tc": part.themeColor } as CSSProperties;
}

/** @deprecated One Atlas: see partStyle. */
export function partClass(part: Pick<PartView, "alt">): string {
    return cn(styles.part, part.alt && styles.alt);
}

/**
 * One chip: "氵 water · meaning". Links to the radical or the part's own kanji page.
 * @deprecated One Atlas: components/ui/PartChip (role by line, colour from the page's theme).
 */
export function PartChip({ part, size = "md" }: { part: PartView; size?: "sm" | "md" }) {
    const body = (
        <>
            <span lang="ja" className={cn("font-jp font-extrabold leading-none", size === "md" ? "text-lg" : "text-base")}>
                {part.char}
            </span>
            {part.gloss && <span className="text-ink">{part.gloss}</span>}
            <span className="text-ink-3 text-xs">
                <span aria-hidden>· </span>
                <span className="sr-only">(</span>
                {part.roleLabel}
                <span className="sr-only">)</span>
            </span>
        </>
    );
    const className = cn(
        partClass(part),
        styles.chip,
        "inline-flex items-center gap-1.5 rounded-full border bg-card transition-colors",
        size === "md" ? "min-h-9 px-3 py-1 text-sm" : "min-h-8 px-2.5 py-0.5 text-[13px]",
    );
    if (!part.href) {
        return (
            <span className={className} style={partStyle(part)}>
                {body}
            </span>
        );
    }
    return (
        <Link href={part.href} className={className} style={partStyle(part)}>
            {body}
        </Link>
    );
}

/**
 * Part chips joined with "+", as in "氵 water · meaning + 毎 · sound".
 * @deprecated One Atlas: components/ui/PartChip with PartPlus, as in components/Kanji/KanjiHero.
 */
export function PartChips({ parts, size = "md", className }: { parts: PartView[]; size?: "sm" | "md"; className?: string }) {
    if (!parts.length) return null;
    return (
        <ul aria-label="Parts" className={cn("flex flex-wrap items-center gap-x-2 gap-y-2", className)}>
            {parts.map((part, i) => (
                <li key={`${part.char}-${i}`} className="flex items-center gap-2">
                    {i > 0 && (
                        <span aria-hidden className="text-ink-3">
                            +
                        </span>
                    )}
                    <PartChip part={part} size={size} />
                </li>
            ))}
        </ul>
    );
}
