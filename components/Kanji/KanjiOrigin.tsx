import { Fragment } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OriginCard } from "@/components/ui/OriginCard";
import { MemoryStory } from "@/components/ui/MemoryStory";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import type { EtymologyView, MemoryStoryView } from "./types";

/** "水 water, as 氵 (meaning) + 每 (sound)", from Wiktionary's components. */
function EtymologyParts({ etymology }: { etymology: EtymologyView }) {
    const { lang } = etymology;
    return (
        <span className="text-sm text-ink-2">
            {etymology.parts.map((part, i) => (
                <Fragment key={`${part.char}-${i}`}>
                    {i > 0 && " + "}
                    <span lang={lang} className="font-jp font-extrabold text-ink">
                        {part.char}
                    </span>
                    {part.gloss && ` ${part.gloss}`}
                    {part.form && (
                        <>
                            , as{" "}
                            <span lang={lang} className="font-jp">
                                {part.form}
                            </span>
                        </>
                    )}
                    {part.role && ` (${part.role === "semantic" ? "meaning" : "sound"})`}
                </Fragment>
            ))}
        </span>
    );
}

/**
 * 成り立ち: the sourced origin (Wiktionary, roman, with its source and licence)
 * beside the memory story (the radical's line, labelled as made up). Either
 * may be missing; nothing renders without both.
 */
export function KanjiOrigin({ etymology, memory, className }: { etymology: EtymologyView | null; memory: MemoryStoryView | null; className?: string }) {
    if (!etymology && !memory) return null;
    const both = Boolean(etymology && memory);
    return (
        <section aria-labelledby="origin-title" className={cn("flex flex-col gap-[22px]", className)}>
            <SectionHeader jp="成り立ち" title="Where it comes from" id="origin-title" />
            <div className={cn("grid gap-5", both ? "grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))]" : "max-w-2xl")}>
                {etymology && (
                    <OriginCard
                        lead={
                            (etymology.formation || etymology.parts.length > 0) && (
                                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                                    {etymology.formation && <Tag>{etymology.formation}</Tag>}
                                    {etymology.parts.length > 0 && <EtymologyParts etymology={etymology} />}
                                </p>
                            )
                        }
                        source={
                            <>
                                Source:{" "}
                                <a href={etymology.url} rel="noopener">
                                    Wiktionary,{" "}
                                    <span lang={etymology.lang} className="font-jp">
                                        {etymology.page}
                                    </span>
                                </a>{" "}
                                (<a href={`https://en.wiktionary.org/w/index.php?oldid=${etymology.revid}`} rel="noopener">rev. {etymology.revid}</a>), CC BY-SA 4.0
                            </>
                        }
                    >
                        {etymology.text && (
                            <p lang="en" className="text-lg leading-normal">
                                {etymology.text}
                            </p>
                        )}
                    </OriginCard>
                )}
                {memory && (
                    <MemoryStory
                        footer={
                            <Link href={memory.radical.href} className="transition-colors hover:text-ink">
                                {memory.specific ? "From" : "More in"} the{" "}
                                <span lang="ja" className="font-jp font-extrabold">
                                    {memory.radical.char}
                                </span>{" "}
                                {memory.radical.label ?? memory.radical.name} story <span aria-hidden>→</span>
                            </Link>
                        }
                    >
                        {memory.text}
                    </MemoryStory>
                )}
            </div>
        </section>
    );
}
