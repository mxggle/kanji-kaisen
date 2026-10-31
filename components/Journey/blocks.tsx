// Hook-free blocks of the radical journey page (Story-Radical, M-Story).
// The sourced Origin (Wiktionary) and the Memory story (a mnemonic) are kept
// in separate, labelled blocks so a story is never read as etymology.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import type { GrowsItem, OriginView } from "./data";

/** Small uppercase label used as the heading of each block. */
const LABEL = "text-[11px] font-medium uppercase tracking-[.14em] text-ink-3";

export function RadicalHead({
    char,
    headline,
    counts,
    uses,
    className,
}: {
    char: string;
    /** "Ki · tree, wood". */
    headline: string;
    /** "Radical in 112 kanji · standalone, on the left …". */
    counts: string;
    /** What the radical adds to a kanji's meaning (from the story data). */
    uses?: string;
    className?: string;
}) {
    return (
        <div className={cn("min-w-0", className)}>
            <div className="flex items-center gap-3.5 lg:items-end lg:gap-5">
                <span
                    lang="ja"
                    aria-hidden
                    className="glow flex-none font-jp text-[52px] font-extrabold leading-none text-c lg:text-[112px] lg:leading-[.9]"
                >
                    {char}
                </span>
                <div className="min-w-0 lg:pb-2">
                    <h1 className="text-balance font-disp text-[26px] font-bold leading-none lg:text-[46px]">
                        <span className="sr-only">{char} </span>
                        {headline}
                    </h1>
                    <p className="mt-1.5 text-xs leading-snug text-ink-2 lg:mt-2 lg:text-sm">{counts}</p>
                </div>
            </div>
            {uses && <p className="mt-3 text-sm leading-relaxed text-ink-2 lg:mt-4 lg:text-base lg:leading-[1.65]">{uses}</p>}
        </div>
    );
}

/** The sourced glyph origin, only rendered when Wiktionary gave one. */
export function OriginBlock({ char, origin, className }: { char: string; origin: OriginView; className?: string }) {
    const components = origin.components;
    return (
        <section aria-labelledby="origin-title" className={cn("rounded-2xl border border-line-2 bg-card p-5", className)}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h2 id="origin-title" className={LABEL}>Origin</h2>
                {origin.formation && (
                    <span className="rounded-full border border-c/45 px-2.5 py-0.5 text-xs text-c">
                        {origin.formation.en}
                        {origin.formation.zh && (
                            <>
                                {" "}
                                <span lang="zh-Hant" className="font-jp">{origin.formation.zh}</span>
                            </>
                        )}
                    </span>
                )}
            </div>
            {origin.text && <p className="mt-3 text-[15px] leading-relaxed text-ink">{origin.text}</p>}
            {components.length > 0 && (
                <p className="mt-2.5 text-sm text-ink-2">
                    Built from{" "}
                    {components.map((c, i) => (
                        <span key={i}>
                            {i > 0 && " + "}
                            <span lang="ja" className="font-jp text-ink">{c.form ?? c.char}</span>
                            {c.gloss && <> “{c.gloss}”</>}
                            {c.role && <> ({c.role})</>}
                        </span>
                    ))}
                </p>
            )}
            <p className="mt-3 text-xs text-ink-3">
                Source:{" "}
                <a
                    href={origin.revisionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-line-2 underline-offset-2 hover:text-ink"
                >
                    Wiktionary{origin.page !== char ? <>, entry <span lang="ja">{origin.page}</span></> : null}
                </a>{" "}
                · CC BY-SA 4.0
            </p>
        </section>
    );
}

/** The radical's memory story, labelled as a mnemonic. */
export function MemoryStoryBlock({ story, picture, className }: { story: string; picture?: string; className?: string }) {
    if (!story && !picture) return null;
    return (
        <section aria-labelledby="story-title" className={cn("rounded-2xl border border-dashed border-line-2 p-5", className)}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 id="story-title" className={LABEL}>Memory story</h2>
                <span className="text-xs text-ink-3">A mnemonic to help you remember, not a history</span>
            </div>
            {story && (
                <blockquote className="mt-3 font-disp text-[19px] italic leading-[1.4] text-ink lg:text-[21px]">“{story}”</blockquote>
            )}
            {picture && <p className="mt-3 text-sm leading-relaxed text-ink-2">{picture}</p>}
        </section>
    );
}

/** "What 木 grows into": a few kanji with meaning, reading and a one-line note. */
export function GrowsIntoList({
    char,
    items,
    total,
    className,
}: {
    char: string;
    items: GrowsItem[];
    /** All the radical's kanji, for "All N →". */
    total: number;
    className?: string;
}) {
    if (items.length === 0) return null;
    const hasStory = items.some((i) => i.noteKind === "story");
    const hasParts = items.some((i) => i.noteKind === "parts");
    return (
        <section aria-labelledby="grows-title" className={cn("min-w-0", className)}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] text-ink-3 lg:mb-2">
                <h2 id="grows-title" className="font-normal">
                    What <span lang="ja" className="font-jp">{char}</span> grows into
                </h2>
                {total > items.length && (
                    <a href="#kanji" className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                        All {total} <span aria-hidden>→</span>
                    </a>
                )}
            </div>
            <ul className="flex flex-col lg:gap-2">
                {items.map((item) => (
                    <li key={item.char}>
                        <Link
                            href={kanjiPath(item.char)}
                            className={cn(
                                "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-line py-2 transition-colors",
                                "lg:gap-4 lg:rounded-xl lg:border lg:bg-card lg:px-4 lg:py-3 hover:border-c",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
                            )}
                        >
                            <span lang="ja" className="font-jp text-[28px] font-extrabold leading-none lg:text-[40px]">{item.char}</span>
                            <span className="min-w-0 text-[13px] leading-normal text-ink-2 lg:text-sm">
                                <b className="font-bold text-ink">{item.meaning}</b>
                                {item.reading && (
                                    <>
                                        {" · "}
                                        <span lang="ja" className="font-jp">{item.reading}</span>
                                    </>
                                )}
                                {item.note && (
                                    <span
                                        className={cn(
                                            "block max-lg:line-clamp-2",
                                            item.noteKind === "story" && "font-disp text-[15px] italic leading-snug lg:text-base",
                                        )}
                                    >
                                        {item.note}
                                    </span>
                                )}
                                {item.hasBuild && <span className="hidden text-c lg:inline">See how it was built →</span>}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            {(hasStory || hasParts) && (
                <p className="mt-2 text-xs text-ink-3">
                    {hasStory && "Italic notes are memory aids from the story."}
                    {hasStory && hasParts && " "}
                    {hasParts && "Parts from KanjiVG."}
                </p>
            )}
        </section>
    );
}
