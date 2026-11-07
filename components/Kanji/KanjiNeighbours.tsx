import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import type { SiblingView } from "./types";
import styles from "./kanji.module.css";

// Motion: as they scroll in, previous drifts in from the left and next from
// the right (the way each one points); both give under the finger. No shared
// glyph flight: a neighbour can also be a tile on the page you came from, and
// two copies of a name cancel the transition.
const FROM_LEFT = { "--drift": "-16px" } as CSSProperties;
const FROM_RIGHT = { "--drift": "16px" } as CSSProperties;

const card = "flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-card px-4 py-4 transition-colors hover:border-line-2 sm:gap-4 sm:px-[22px] sm:py-5";

/** ‹ previous / next › in the same radical, most common first. */
export function KanjiNeighbours({
    prev,
    next,
    radical,
    className,
}: {
    prev: SiblingView | null;
    next: SiblingView | null;
    /** "亻" and "person", for "Previous in 亻 person". */
    radical: { char: string; label: string };
    className?: string;
}) {
    if (!prev && !next) return null;
    const where = (
        <>
            {" in "}
            <span lang="ja" className="font-jp">
                {radical.char}
            </span>
            <span className="max-sm:hidden"> {radical.label}</span>
        </>
    );
    return (
        <nav aria-label={`Kanji next to this one in ${radical.char} ${radical.label}`} className={cn("grid grid-cols-2 gap-3 sm:gap-4", className)}>
            {prev ? (
                <Link href={prev.href} className={cn(card, styles.press)} data-reveal="drift" style={FROM_LEFT}>
                    <span aria-hidden className="text-sm text-ink-2">
                        ‹
                    </span>
                    <span lang="ja" className="font-jp text-3xl font-extrabold sm:text-4xl">
                        {prev.char}
                    </span>
                    <span className="flex min-w-0 flex-col">
                        <span className="text-xs text-ink-3">Previous{where}</span>
                        <span className="truncate">{prev.meaning}</span>
                    </span>
                </Link>
            ) : (
                <span />
            )}
            {next ? (
                <Link href={next.href} className={cn(card, "justify-end text-right", styles.press)} data-reveal="drift" style={FROM_RIGHT}>
                    <span className="flex min-w-0 flex-col">
                        <span className="text-xs text-ink-3">Next{where}</span>
                        <span className="truncate">{next.meaning}</span>
                    </span>
                    <span lang="ja" className="font-jp text-3xl font-extrabold sm:text-4xl">
                        {next.char}
                    </span>
                    <span aria-hidden className="text-sm text-ink-2">
                        ›
                    </span>
                </Link>
            ) : (
                <span />
            )}
        </nav>
    );
}
