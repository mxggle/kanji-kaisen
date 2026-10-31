"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import { SHADE_NAMES } from "@/lib/ink";
import { nextKanji, nextLabel, type NextKanji } from "@/components/Theme/order";
import { cellClass, FOCUS_RING, InkLegend } from "@/components/Theme/parts";
import { shadeReader, useChars, useInkEntries } from "@/components/Theme/useInk";

interface RadicalKanjiGridProps {
    /** The radical's kanji, most common first, concatenated. */
    chars: string;
    /** First meaning of each kanji, same order. */
    meanings: string[];
    /** "/study?radical=ki". */
    studyHref: string;
}

/**
 * Every kanji of a radical as links, darkened by the learner's ink once the
 * store hydrates (all "not met" on the server), with "Start with X" pointing
 * at the next kanji to learn.
 */
export function RadicalKanjiGrid({ chars, meanings, studyHref }: RadicalKanjiGridProps) {
    const list = useChars(chars);
    const entries = useInkEntries();
    const shadeOf = useMemo(() => (entries ? shadeReader(entries) : null), [entries]);
    const next: NextKanji | null = shadeOf ? nextKanji(list, shadeOf) : list[0] ? { char: list[0], mode: "start" } : null;

    return (
        <>
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
                {next && (
                    <Link
                        href={`${kanjiPath(next.char)}#learn`}
                        className={cn(
                            "inline-flex h-11 items-center gap-2 rounded-full bg-c px-5 text-sm font-bold text-onacc transition-colors hover:bg-ink hover:text-bg",
                            FOCUS_RING,
                        )}
                    >
                        {nextLabel(next)} <span aria-hidden>→</span>
                    </Link>
                )}
                <Link
                    href={studyHref}
                    className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-full border border-line-2 px-4 text-sm font-medium transition-colors hover:border-ink-2",
                        FOCUS_RING,
                    )}
                >
                    <GraduationCap size={17} aria-hidden /> Study these
                </Link>
                <span className="ml-auto inline-flex items-center gap-2 text-[13px] text-ink-3">
                    <InkLegend /> darker = better known
                </span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(76px,1fr))]">
                {list.map((char, i) => {
                    const shade = shadeOf ? shadeOf(char) : 0;
                    const meaning = meanings[i] ?? "";
                    return (
                        <li key={char}>
                            <Link
                                href={kanjiPath(char)}
                                prefetch={false}
                                title={meaning}
                                aria-label={`${char}${meaning ? `, ${meaning}` : ""}${shadeOf ? `, ${SHADE_NAMES[shade]}` : ""}`}
                                className={cellClass(
                                    shade,
                                    cn("flex flex-col items-center rounded-lg px-1 pt-2 pb-1.5", FOCUS_RING, "focus-visible:outline-offset-2"),
                                )}
                            >
                                <span lang="ja" aria-hidden className="font-jp text-2xl font-extrabold leading-none">{char}</span>
                                <span aria-hidden className="mt-1 w-full truncate text-center text-[11px] opacity-90">{meaning}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
