import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ReadingWord {
    word: string;
    reading: string;
    meaning: string;
    href?: string;
}

interface ReadingBlockProps {
    /** The kanji, drawn in --c inside each word. */
    char: string;
    /** Kana before the okurigana dot (ふる of ふる.い). */
    stem: string;
    okurigana?: string;
    /** KANJIDIC affix dashes: prefix "ふる-", suffix "-か". */
    prefix?: boolean;
    suffix?: boolean;
    /** Right of the kana: "kyū · on'yomi · in compounds". */
    label: ReactNode;
    words: readonly ReadingWord[];
    /** Shown when `words` is empty. */
    empty?: ReactNode;
    className?: string;
}

function Highlight({ word, char }: { word: string; char: string }) {
    return (
        <>
            {Array.from(word).map((ch, i) =>
                ch === char ? (
                    <b key={i} className="font-extrabold text-c">
                        {ch}
                    </b>
                ) : (
                    ch
                ),
            )}
        </>
    );
}

/**
 * One reading with the words that use it: kana in Mincho, okurigana in ink-3,
 * and the kanji in --c inside each word. Server-safe.
 */
export function ReadingBlock({ char, stem, okurigana, prefix, suffix, label, words, empty, className }: ReadingBlockProps) {
    const row = "flex min-w-0 items-baseline gap-2.5 rounded-md py-[5px] text-sm text-ink-2";
    return (
        <div className={cn("flex flex-col gap-3 rounded-2xl border border-line bg-card px-5 py-[18px]", className)}>
            <p className="flex flex-wrap items-baseline gap-3">
                <span lang="ja" className="font-jp text-[30px] font-extrabold leading-none">
                    {suffix && <span className="text-ink-3">-</span>}
                    {stem}
                    {okurigana && (
                        <span className="text-ink-3">
                            <span aria-hidden>・</span>
                            {okurigana}
                        </span>
                    )}
                    {prefix && <span className="text-ink-3">-</span>}
                </span>
                <span className="text-[13px] text-ink-3">{label}</span>
            </p>
            {words.length > 0 ? (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-x-6 gap-y-0.5">
                    {words.map((w) => {
                        const inner = (
                            <>
                                <span lang="ja" className="whitespace-nowrap font-jp text-[19px] font-extrabold text-ink">
                                    <Highlight word={w.word} char={char} />
                                </span>
                                <span lang="ja" className="whitespace-nowrap text-[13px] text-ink-3">
                                    {w.reading}
                                </span>
                                <span className="min-w-0">{w.meaning}</span>
                            </>
                        );
                        return (
                            <li key={`${w.word}-${w.reading}`} className="min-w-0">
                                {w.href ? (
                                    <Link href={w.href} className={cn(row, "hover:text-ink")}>
                                        {inner}
                                    </Link>
                                ) : (
                                    <span className={row}>{inner}</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                empty && <p className="text-sm text-ink-3">{empty}</p>
            )}
        </div>
    );
}
