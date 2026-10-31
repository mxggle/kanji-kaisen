"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import type { LookAlikeView } from "./types";
import styles from "./kanji.module.css";

function Glyph({ char, paths, highlight }: { char: string; paths: string[]; highlight: number[] }) {
    if (!paths.length) {
        return (
            <span lang="ja" className="flex h-full w-full items-center justify-center font-jp text-7xl font-extrabold text-ink">
                {char}
            </span>
        );
    }
    const lit = new Set(highlight);
    return (
        <svg viewBox="0 0 109 109" aria-hidden className={styles.glyph} strokeWidth={4.6}>
            <g className={styles.part}>
                {paths.map((d, i) => (lit.has(i) ? null : <path key={i} d={d} className={styles.done} />))}
            </g>
            <g className={cn(styles.part, styles.glow)}>
                {paths.map((d, i) => (lit.has(i) ? <path key={i} d={d} className={styles.lit} /> : null))}
            </g>
        </svg>
    );
}

interface LookAlikeCompareProps {
    char: string;
    meaning: string;
    reading: string;
    paths: string[];
    items: LookAlikeView[];
}

/** Side-by-side compare with each look-alike; the parts that differ glow. */
export function LookAlikeCompare({ char, meaning, reading, paths, items }: LookAlikeCompareProps) {
    const [selected, setSelected] = useState(0);
    const tabs = useRef<(HTMLButtonElement | null)[]>([]);
    const id = useId();
    const other = items[selected];
    if (!other) return null;

    const onKeyDown = (e: KeyboardEvent) => {
        const last = items.length - 1;
        let next: number | null = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = selected === last ? 0 : selected + 1;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = selected === 0 ? last : selected - 1;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = last;
        if (next === null) return;
        e.preventDefault();
        setSelected(next);
        tabs.current[next]?.focus();
    };

    const side = (c: string, m: string, r: string, p: string[], highlight: number[], href: string | null) => (
        <figure className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="aspect-square w-full max-w-[180px] rounded-xl border border-line bg-card p-3">
                <Glyph char={c} paths={p} highlight={highlight} />
            </div>
            <figcaption className="text-center text-sm">
                {href ? (
                    <Link href={href} className="inline-flex items-center gap-1 text-ink hover:text-[var(--c)]">
                        <span lang="ja" className="font-jp text-lg font-bold">
                            {c}
                        </span>{" "}
                        {m} <ArrowRight size={13} aria-hidden />
                    </Link>
                ) : (
                    <span className="text-ink">
                        <span lang="ja" className="font-jp text-lg font-bold">
                            {c}
                        </span>{" "}
                        {m}
                    </span>
                )}
                {r && (
                    <span lang="ja" className="block text-ink-3">
                        {r}
                    </span>
                )}
            </figcaption>
        </figure>
    );

    return (
        <div className="flex flex-col gap-4">
            <div role="tablist" aria-label={`Look-alikes of ${char}`} className="flex flex-wrap gap-2" onKeyDown={onKeyDown}>
                {items.map((item, i) => (
                    <button
                        key={item.char}
                        ref={(el) => {
                            tabs.current[i] = el;
                        }}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${i}`}
                        aria-selected={i === selected}
                        aria-controls={`${id}-panel`}
                        tabIndex={i === selected ? 0 : -1}
                        onClick={() => setSelected(i)}
                        className={cn(
                            "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
                            i === selected ? "border-[var(--c)] text-ink" : "border-line text-ink-2 hover:text-ink",
                        )}
                    >
                        <span lang="ja" className="font-jp text-xl font-extrabold leading-none">
                            {item.char}
                        </span>
                        <span>{item.meaning}</span>
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${selected}`} className="flex flex-col gap-3">
                <div className="flex items-start gap-3 sm:gap-6">
                    {side(char, meaning, reading, paths, other.diff.highlightA, null)}
                    <span aria-hidden className="self-center pb-10 font-disp text-2xl italic text-ink-3">
                        vs
                    </span>
                    {side(other.char, other.meaning, other.reading, other.paths, other.diff.highlightB, kanjiPath(other.char))}
                </div>
                <p className="text-center font-disp text-lg italic text-ink">{other.diff.caption}</p>
            </div>

            {/* Every look-alike as a plain link, so all of them are in the page's HTML. */}
            <p className="text-sm text-ink-3">
                Open:{" "}
                {items.map((item, i) => (
                    <span key={item.char}>
                        {i > 0 && " · "}
                        <Link href={kanjiPath(item.char)} className="text-ink-2 hover:text-[var(--c)]">
                            <span lang="ja" className="font-jp">
                                {item.char}
                            </span>{" "}
                            {item.meaning}
                        </Link>
                    </span>
                ))}
            </p>
        </div>
    );
}
