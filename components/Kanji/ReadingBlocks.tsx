import { cn } from "@/lib/utils";
import type { ReadingBlock, ReadingLayout, WordView } from "./readings";
import { wordSegments } from "./readings";
import styles from "./kanji.module.css";

const KIND_LABEL = {
    on: { short: "on", long: "on'yomi · in compounds" },
    kun: { short: "kun", long: "kun'yomi · on its own" },
} as const;

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);

/** The kana of a reading: stem large, okurigana faded after a dot, affix dashes kept. */
export function ReadingKana({ block, className }: { block: Pick<ReadingBlock, "stem" | "okurigana" | "prefix" | "suffix">; className?: string }) {
    return (
        <span lang="ja" className={cn("font-jp font-extrabold leading-none", className)}>
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

function Word({ word, char }: { word: WordView; char: string }) {
    return (
        <li className="flex flex-wrap items-baseline gap-x-2 min-w-0">
            <span lang="ja" className="font-jp font-bold text-lg text-ink">
                {wordSegments(word.word, char).map((seg, i) =>
                    seg.hit ? (
                        <span key={i} className={styles.hit}>
                            {seg.text}
                        </span>
                    ) : (
                        <span key={i}>{seg.text}</span>
                    ),
                )}
            </span>
            <span lang="ja" className="text-sm text-ink-2">
                {word.reading}
            </span>
            <span className="text-sm text-ink-2">{word.meaning}</span>
        </li>
    );
}

function WordList({ words, char }: { words: WordView[]; char: string }) {
    return (
        <ul className="grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
            {words.map((w) => (
                <Word key={`${w.word}-${w.reading}`} word={w} char={char} />
            ))}
        </ul>
    );
}

function Block({ block, char }: { block: ReadingBlock; char: string }) {
    const label = KIND_LABEL[block.kind];
    return (
        <li className="rounded-xl border border-line bg-card px-4 py-3.5">
            <p className="mb-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <ReadingKana block={block} className="text-[28px]" />
                <span className="text-sm text-ink-3">
                    {block.romaji} · {label.long}
                </span>
            </p>
            {block.words.length > 0 ? (
                <WordList words={block.words} char={char} />
            ) : (
                <p className="text-sm text-ink-3">No common words use this reading.</p>
            )}
        </li>
    );
}

function sourcesCredit(words: WordView[]): string | null {
    const sources = new Set(words.map((w) => w.source));
    const credits = [];
    if (sources.has("kanjialive")) credits.push("Kanji alive (CC BY 4.0)");
    if (sources.has("jmdict")) credits.push("JMdict, EDRDG (CC BY-SA 4.0)");
    return credits.length ? `Words: ${credits.join(" · ")}` : null;
}

/**
 * Readings first: one block per reading with the words that use it, readings
 * without words collapsed, irregular words under "Special readings".
 */
export function ReadingBlocks({ char, layout, id }: { char: string; layout: ReadingLayout; id?: string }) {
    const withWords = layout.main.filter((b) => b.words.length > 0).length;
    const allWords = [...layout.main.flatMap((b) => b.words), ...layout.special];
    const credit = sourcesCredit(allWords);
    const noReadings = layout.main.length === 0;

    return (
        <section id={id} aria-labelledby="readings-title" className="flex flex-col gap-2.5">
            <h2 id="readings-title" className="text-sm text-ink-3">
                {noReadings
                    ? `${char} has no reading of its own`
                    : withWords > 0
                      ? `${countWord(withWords)} reading${withWords === 1 ? "" : "s"}, and the words that use ${withWords === 1 ? "it" : "each"}`
                      : `${countWord(layout.main.length)} reading${layout.main.length === 1 ? "" : "s"}`}
            </h2>

            {!noReadings && (
                <ul className="flex flex-col gap-2.5">
                    {layout.main.map((block) => (
                        <Block key={block.reading} block={block} char={char} />
                    ))}
                </ul>
            )}

            {layout.more.length > 0 && (
                <details className="group rounded-xl border border-line px-4 py-2.5 text-sm">
                    <summary className="cursor-pointer text-ink-2 hover:text-ink marker:text-ink-3">
                        {layout.more.length} more reading{layout.more.length === 1 ? "" : "s"}, without common words
                    </summary>
                    <ul className="mt-3 mb-1 flex flex-wrap gap-x-5 gap-y-2.5">
                        {layout.more.map((block) => (
                            <li key={block.reading} className="flex items-baseline gap-2">
                                <ReadingKana block={block} className="text-xl" />
                                <span className="text-xs text-ink-3">
                                    {block.romaji} · {KIND_LABEL[block.kind].short}
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            {layout.special.length > 0 && (
                <div className="rounded-xl border border-dashed border-line-2 px-4 py-3.5">
                    <h3 className="mb-1 text-sm font-bold text-ink">{noReadings ? "Words with " + char : "Special readings"}</h3>
                    <p className="mb-2.5 text-xs text-ink-3">
                        {noReadings
                            ? "It is read as part of each word."
                            : "These words are read as a whole, not from the readings above."}
                    </p>
                    <WordList words={layout.special} char={char} />
                </div>
            )}

            {noReadings && layout.special.length === 0 && (
                <p className="text-sm text-ink-3">No readings or example words are recorded for this character yet.</p>
            )}

            {credit && <p className="text-xs text-ink-3">{credit}</p>}
        </section>
    );
}
