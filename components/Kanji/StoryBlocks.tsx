import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EtymologyView, MemoryStoryView } from "./types";

/** The radical's story line for this kanji, labelled as a mnemonic (not history). */
export function MemoryStory({ story, className }: { story: MemoryStoryView; className?: string }) {
    return (
        <section aria-labelledby="memory-title" className={cn("rounded-xl border border-line bg-card px-5 py-4", className)}>
            <h2 id="memory-title" className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-bold text-ink">Memory story</span>
                <span className="text-ink-3">a mnemonic to help you remember, not the character&apos;s history</span>
            </h2>
            <blockquote className="mt-2.5 font-disp text-xl italic leading-snug text-ink sm:text-[22px]">
                “{story.text}”
            </blockquote>
            <Link href={story.radical.href} className="mt-3 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-[var(--c)]">
                {story.specific ? "From" : "More in"} the{" "}
                <span lang="ja" className="font-jp font-bold">
                    {story.radical.char}
                </span>{" "}
                {story.radical.name} story <ArrowRight size={14} aria-hidden />
            </Link>
        </section>
    );
}

/** Sourced glyph origin. Renders nothing without a source. */
export function Etymology({ etymology, char, className }: { etymology: EtymologyView | null; char: string; className?: string }) {
    if (!etymology || !etymology.text) return null;
    return (
        <section aria-labelledby="etymology-title" className={cn("rounded-xl border border-line bg-card px-5 py-4", className)}>
            <h2 id="etymology-title" className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-bold text-ink">Etymology</span>
                {etymology.formation && <span className="text-ink-3">{etymology.formation}</span>}
            </h2>
            <p className="mt-2.5 leading-relaxed text-ink">{etymology.text}</p>
            <p className="mt-3 text-xs text-ink-3">
                Source:{" "}
                <a href={etymology.url} className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-ink" rel="noopener">
                    Wiktionary,{" "}
                    <span lang="ja" className="font-jp">
                        {etymology.page || char}
                    </span>
                    <ExternalLink size={11} aria-hidden />
                </a>{" "}
                (revision {etymology.revid}), CC BY-SA 4.0
            </p>
        </section>
    );
}
