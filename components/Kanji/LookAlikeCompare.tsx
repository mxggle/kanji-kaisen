import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import { Chip } from "@/components/ui/Chip";
import type { LookAlikeView } from "./types";
import styles from "./kanji.module.css";

/**
 * A glyph drawn from its strokes: the parts only it has in full ink, the shared
 * ones faint. No accent, since the accent marks a part's role (rule 2).
 */
function Glyph({ char, paths, highlight }: { char: string; paths: string[]; highlight: number[] }) {
    if (!paths.length) {
        return (
            <span lang="ja" aria-hidden className="font-jp text-[88px] font-extrabold leading-none">
                {char}
            </span>
        );
    }
    const lit = new Set(highlight);
    // Motion: when the comparison scrolls in, the strokes that differ are drawn in order (styles.diff).
    const order = [...lit].sort((a, b) => a - b);
    return (
        <svg viewBox="0 0 109 109" aria-hidden className="size-24 overflow-visible fill-none [stroke-linecap:round] [stroke-linejoin:round] sm:size-[104px]" strokeWidth={5}>
            {paths.map((d, i) => (
                <path
                    key={i}
                    d={d}
                    pathLength={lit.has(i) ? 1 : undefined}
                    className={cn(lit.has(i) || lit.size === 0 ? "stroke-ink" : "stroke-ink-3", lit.has(i) && styles.diff)}
                    style={lit.has(i) ? ({ "--n": order.indexOf(i) } as CSSProperties) : undefined}
                />
            ))}
        </svg>
    );
}

interface Side {
    char: string;
    meaning: string;
    paths: string[];
    highlight: number[];
    /** Parts only this side has. */
    own: string[];
    href?: string;
}

function SideView({ side }: { side: Side }) {
    const body = (
        <>
            <Glyph char={side.char} paths={side.paths} highlight={side.highlight} />
            <span className="text-center text-sm text-ink-2">
                <span className="sr-only" lang="ja">
                    {side.char}{" "}
                </span>
                <b className="font-bold text-ink">{side.meaning}</b>
                {side.own.length > 0 && (
                    <>
                        {" · "}
                        <span lang="ja" className="font-jp">
                            {side.own.join(" + ")}
                        </span>
                    </>
                )}
            </span>
        </>
    );
    const cls = "flex min-w-0 flex-col items-center gap-1.5";
    return side.href ? (
        <Link href={side.href} className={cn(cls, "rounded-xl transition-colors hover:text-ink [&:hover_b]:underline")}>
            {body}
        </Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

interface LookAlikeCompareProps {
    char: string;
    meaning: string;
    paths: string[];
    items: LookAlikeView[];
    className?: string;
}

/**
 * "Easy to confuse": this kanji beside its closest look-alike, the strokes of
 * the parts that differ in full ink, and the other look-alikes as chips.
 */
export function LookAlikeCompare({ char, meaning, paths, items, className }: LookAlikeCompareProps) {
    const [first, ...rest] = items;
    if (!first) return null;
    return (
        <div className={cn("flex flex-col gap-3.5", className)}>
            <div data-reveal="" className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <h3 className="text-[17px] font-bold leading-snug">Easy to confuse</h3>
                <span className="text-sm text-ink-3">The difference, side by side</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] items-start gap-6">
                <figure data-reveal="fade" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-line bg-card px-[22px] py-5">
                    <SideView side={{ char, meaning, paths, highlight: first.diff.highlightA, own: first.diff.onlyA }} />
                    <span className="text-xs text-ink-3">vs</span>
                    <SideView
                        side={{ char: first.char, meaning: first.meaning, paths: first.paths, highlight: first.diff.highlightB, own: first.diff.onlyB, href: kanjiPath(first.char) }}
                    />
                    <figcaption className="col-span-full text-center text-sm text-ink-2">{first.diff.caption}</figcaption>
                </figure>
                {rest.length > 0 && (
                    <ul aria-label={`More look-alikes of ${char}`} data-reveal-group="" className="flex flex-wrap gap-2">
                        {rest.map((item) => (
                            <li key={item.char}>
                                <Chip href={kanjiPath(item.char)} className={styles.press}>
                                    <span lang="ja" className="font-jp font-extrabold text-ink">
                                        {item.char}
                                    </span>
                                    {item.meaning}
                                </Chip>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
