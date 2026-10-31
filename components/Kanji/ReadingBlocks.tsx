import { Fragment } from "react";
import { ReadingBlock } from "@/components/ui/ReadingBlock";
import { readingsHeading, wordSegments, wordsCredit, type ReadingBlock as Reading, type ReadingLayout, type WordView } from "./readings";

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
function SpecialWords({ char, words, alone }: { char: string; words: WordView[]; alone: boolean }) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line-2 px-5 py-[18px]">
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
            <h2 id="readings-title" className="type-label">
                {readingsHeading(char, layout)}
            </h2>

            {layout.main.map((block) => {
                const kind = KIND[block.kind];
                const first = !seen.has(block.kind);
                seen.add(block.kind);
                return (
                    <ReadingBlock
                        key={block.reading}
                        char={char}
                        stem={block.stem}
                        okurigana={block.okurigana}
                        prefix={block.prefix}
                        suffix={block.suffix}
                        label={[block.romaji, kind.name, first ? kind.note : null].filter(Boolean).join(" · ")}
                        words={block.words.map(({ word, reading, meaning }) => ({ word, reading, meaning }))}
                        empty="No common words use this reading."
                        className="max-[959px]:gap-2 max-[959px]:px-4 max-[959px]:py-3.5"
                    />
                );
            })}

            {layout.special.length > 0 && <SpecialWords char={char} words={layout.special} alone={noReadings} />}

            {noReadings && layout.special.length === 0 && <p className="text-sm text-ink-3">No readings or example words are recorded for this character yet.</p>}

            {(layout.more.length > 0 || credit) && (
                <p className="text-xs leading-normal text-ink-3">
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
