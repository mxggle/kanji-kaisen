import { Fragment, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { enterOrder } from "@/components/Motion/tokens";
import { ReadingBlock } from "@/components/ui/ReadingBlock";
import { readingsHeading, wordSegments, wordsCredit, type ReadingBlock as Reading, type ReadingLayout, type WordView } from "./readings";

import styles from "./kanji.module.css";

// Motion: the heading and the first three cards arrive with the page, just after
// the hero (after the specimen's tab row on phones); the rest rise as they
// scroll in. Each card's kana soaks in after it (styles.kana).
const ENTER = "[--delay:300ms] max-[959px]:[--delay:400ms]";
const ENTERING = 3;
function motion(index: number): { hook: { "data-enter"?: string; "data-reveal"?: string; style?: CSSProperties }; delay?: string } {
    return index < ENTERING ? { hook: { "data-enter": "", style: enterOrder(index + 1) }, delay: ENTER } : { hook: { "data-reveal": "" } };
}

const KIND = {
    on: { name: "on'yomi", note: "in compounds" },
    kun: { name: "kun'yomi", note: "on its own" },
} as const;

/** The kana of a reading inline: stem, okurigana after a dot in ink-3, affix dashes kept. */
export function ReadingKana({ block, className }: { block: Pick<Reading, "stem" | "okurigana" | "prefix" | "suffix">; className?: string }) {
    return (
        <span lang="ja" className={className}>
            {block.suffix && <span className="text-ink-3">-</span>}
            {block.stem}
            {block.okurigana && (
                <span className="text-ink-3">
                    <span aria-hidden>・</span>
                    {block.okurigana}
                </span>
            )}
            {block.prefix && <span className="text-ink-3">-</span>}
        </span>
    );
}

/** Irregular words (今日, 海老), read as a whole: a card like a reading's, without kana. */
function SpecialWords({ char, words, alone, index }: { char: string; words: WordView[]; alone: boolean; index: number }) {
    const { hook, delay } = motion(index);
    return (
        <div {...hook} className={cn("flex flex-col gap-3 rounded-2xl border border-dashed border-line-2 px-5 py-[18px]", delay)}>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[15px] font-bold text-ink">{alone ? `Words with ${char}` : "Special readings"}</span>
                <span className="text-[13px] text-ink-3">{alone ? "It is read as part of each word." : "These words are read as a whole, not from the readings above."}</span>
            </p>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-x-6 gap-y-0.5">
                {words.map((w) => (
                    <li key={`${w.word}-${w.reading}`} className="flex min-w-0 items-baseline gap-2.5 py-[5px] text-sm text-ink-2">
                        <span lang="ja" className="whitespace-nowrap font-jp text-[19px] font-extrabold text-ink">
                            {wordSegments(w.word, char).map((seg, i) =>
                                seg.hit ? (
                                    <b key={i} className="font-extrabold text-c">
                                        {seg.text}
                                    </b>
                                ) : (
                                    <Fragment key={i}>{seg.text}</Fragment>
                                ),
                            )}
                        </span>
                        <span lang="ja" className="whitespace-nowrap text-[13px] text-ink-3">
                            {w.reading}
                        </span>
                        <span className="min-w-0">{w.meaning}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Readings first: each reading beside the words that use it. Readings without
 * words fold into one "Also read" line with the words' credit; irregular words
 * get their own card.
 */
export function KanjiReadings({ char, layout }: { char: string; layout: ReadingLayout }) {
    const noReadings = layout.main.length === 0;
    const credit = wordsCredit([...layout.main.flatMap((b) => b.words), ...layout.special]);
    const seen = new Set<string>();

    return (
        <section aria-labelledby="readings-title" className="flex flex-col gap-2.5">
            <h2 id="readings-title" className={cn("type-label", ENTER)} data-enter="fade" style={enterOrder(0)}>
                {readingsHeading(char, layout)}
            </h2>

            {layout.main.map((block, index) => {
                const kind = KIND[block.kind];
                const first = !seen.has(block.kind);
                seen.add(block.kind);
                const { hook, delay } = motion(index);
                return (
                    <ReadingBlock
                        {...hook}
                        kanaClassName={styles.kana}
                        key={block.reading}
                        char={char}
                        stem={block.stem}
                        okurigana={block.okurigana}
                        prefix={block.prefix}
                        suffix={block.suffix}
                        label={[block.romaji, kind.name, first ? kind.note : null].filter(Boolean).join(" · ")}
                        words={block.words.map(({ word, reading, meaning }) => ({ word, reading, meaning }))}
                        empty="No common words use this reading."
                        className={cn("max-[959px]:gap-2 max-[959px]:px-4 max-[959px]:py-3.5", delay)}
                    />
                );
            })}

            {layout.special.length > 0 && <SpecialWords char={char} words={layout.special} alone={noReadings} index={layout.main.length} />}

            {noReadings && layout.special.length === 0 && (
                <p className={cn("text-sm text-ink-3", ENTER)} data-enter="fade" style={enterOrder(1)}>
                    No readings or example words are recorded for this character yet.
                </p>
            )}

            {(layout.more.length > 0 || credit) && (
                <p className="text-xs leading-normal text-ink-3" data-reveal="fade">
                    {layout.more.length > 0 && (
                        <>
                            Also read{" "}
                            {layout.more.map((block, i) => (
                                <Fragment key={block.reading}>
                                    {i > 0 && ", "}
                                    <ReadingKana block={block} className="text-ink-2" />
                                </Fragment>
                            ))}
                            , with no example words in our sources.{" "}
                        </>
                    )}
                    {credit && `${credit}.`}
                </p>
            )}
        </section>
    );
}
