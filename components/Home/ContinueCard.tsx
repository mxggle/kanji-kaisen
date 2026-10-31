"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { SHADES, SHADE_JP, SHADE_NAMES } from "@/lib/ink";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";
import { isCategoryName, THEME_SHORT } from "@/lib/atlas/categories";
import { kanjiPath } from "@/lib/atlas/paths";
import { loadSearchIndex, type SearchIndexEntry } from "@/lib/atlas/search-index";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { Button } from "@/components/ui/Button";
import { InkLegend } from "@/components/ui/InkLegend";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { KindLabel } from "@/components/ui/SectionHeader";
import { agoLabel, continueCard, shadeCounts, STEP_NAMES, type ContinuePick } from "./continue";

interface ContinueCardProps {
    /** Each theme's kanji, to colour the tile and name the theme. */
    themes: { name: string; chars: string }[];
    /** Kanji in the atlas, for the 白 count. */
    total: number;
}

// From 640px every state is as tall as the continue card, so the swap after hydration doesn't move the page.
const CARD = "flex h-full flex-col gap-3.5 rounded-2xl border border-line bg-card p-4 sm:min-h-[458px] sm:gap-5 sm:p-[26px]";
const H3 = "text-[17px] font-bold leading-[1.35] text-ink";
const JP = "font-jp font-extrabold";
// The shade swatches are ink, not the kanji's theme (the My list board does the same).
const NEUTRAL = { "--tc": "var(--ink)" } as CSSProperties;

/**
 * The method, for a first visit and until the ink store hydrates (so the
 * server render matches). Phones get the three headings only, so the card is
 * about as tall as the continue card that may replace it.
 */
function Method() {
    const points = [
        {
            mark: "部",
            title: "Radicals first",
            text: (
                <>
                    Most kanji are built from a few hundred parts. In <span lang="ja" className={JP}>海</span>, 氵 says &ldquo;water&rdquo; and 毎 hints at the sound.
                </>
            ),
        },
        {
            mark: "墨",
            title: "Five shades of ink",
            text: <>Each kanji darkens from 白 Not met to 印 Mastered as you learn it. No hearts, no streaks, nothing comes due.</>,
            extra: <InkLegend className="mt-2 hidden sm:inline-flex" />,
        },
        {
            mark: "話",
            title: "Stories, labelled",
            text: <>Memory stories are marked as stories. Where a part really comes from is kept apart, with its source.</>,
        },
    ];
    return (
        <aside aria-label="How it works" className="min-w-0 flex-[5_1_380px]">
            <div className={CARD}>
                <KindLabel jp="学び方">How it works</KindLabel>
                <ul className="flex flex-col gap-3 sm:my-auto sm:gap-5">
                    {points.map((p) => (
                        <li key={p.mark} className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3.5 sm:items-start">
                            <span lang="ja" aria-hidden className={cn(JP, "text-[26px] leading-none text-c")}>
                                {p.mark}
                            </span>
                            <div className="flex min-w-0 flex-col gap-1">
                                <p className={H3}>{p.title}</p>
                                <p className="hidden text-sm leading-relaxed text-ink-2 sm:block">{p.text}</p>
                                {p.extra}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}

/** "Your ink": how many kanji sit at each shade, linking to My list. Desktop only, as on the phone board. */
function InkCounts({ counts }: { counts: Record<number, number> }) {
    const fmt = (n: number) => n.toLocaleString("en");
    const label = `Your ink: ${SHADES.map((s) => `${fmt(counts[s])} ${SHADE_NAMES[s].toLowerCase()}`).join(", ")}. Open My list`;
    return (
        <>
            <hr className="hidden border-line sm:block" />
            <Link href="/my-list" aria-label={label} className="group hidden flex-col gap-2.5 rounded-lg sm:flex">
                <span className="flex items-baseline justify-between gap-3">
                    <span className="type-label">Your ink</span>
                    <span className="text-sm text-ink-2 transition-colors group-hover:text-ink">
                        My list <span aria-hidden>→</span>
                    </span>
                </span>
                <span className="grid grid-cols-5 gap-2" style={NEUTRAL}>
                    {SHADES.map((s) => (
                        <span key={s} className="flex min-w-0 flex-col gap-1">
                            <span lang="ja" data-ink={s} className={cn(JP, "flex h-9 items-center justify-center rounded-xl border text-base")}>
                                {SHADE_JP[s]}
                            </span>
                            <span className="text-xs text-ink-3">{fmt(counts[s])}</span>
                        </span>
                    ))}
                </span>
            </Link>
        </>
    );
}

/** The slim index entry for one kanji (meaning and readings for its tile), loaded after hydration. */
function useIndexEntry(char: string | undefined): SearchIndexEntry | null {
    const [entry, setEntry] = useState<SearchIndexEntry | null>(null);
    useEffect(() => {
        if (!char) return;
        let live = true;
        loadSearchIndex().then(
            (index) => {
                if (live) setEntry(index.find((e) => e.c === char) ?? null);
            },
            () => {},
        );
        return () => {
            live = false;
        };
    }, [char]);
    return entry && entry.c === char ? entry : null;
}

function Continue({ pick, category, counts }: { pick: ContinuePick; category: string | null; counts: Record<number, number> }) {
    const entry = useIndexEntry(pick.char);
    const theme = category && isCategoryName(category) ? THEME_SHORT[category] : null;
    const ago = agoLabel(pick.updatedAt);
    const when = ago ? `${pick.shade === 1 ? "You met it" : "You last worked on it"} ${ago}${theme ? ` in ${theme}` : ""}.` : "";
    const kanji = { char: pick.char, meanings: entry?.m, onyomi: entry?.on, kunyomi: entry?.kun, category };
    const glyph = (
        <span lang="ja" className={JP}>
            {pick.char}
        </span>
    );

    return (
        <aside aria-label="Where you left off" className="min-w-0 flex-[5_1_380px]" style={themeVars(category)}>
            <div className={CARD}>
                <KindLabel jp="続き" className="hidden sm:flex">
                    Where you left off
                </KindLabel>
                <div className="flex items-center gap-3.5 sm:gap-[18px]">
                    <KanjiTile kanji={kanji} shade={pick.shade} className="w-[72px] flex-none sm:hidden" />
                    <KanjiTile kanji={kanji} shade={pick.shade} size="lg" className="hidden min-h-[154px] w-[116px] flex-none sm:flex" />
                    <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
                        <p className="type-label sm:hidden">Where you left off</p>
                        <p className={H3}>{STEP_NAMES[pick.step]} is next</p>
                        <p className="text-xs text-ink-3 sm:hidden">
                            Step {pick.stepNumber} of 4{theme && ` · ${theme}`}
                        </p>
                        <p className="hidden text-sm leading-relaxed text-ink-2 sm:block">
                            Step {pick.stepNumber} of 4 for {glyph}. {when}
                        </p>
                    </div>
                </div>
                <Button variant="primary" href={`${kanjiPath(pick.char)}#learn`} className="w-full sm:h-[52px] sm:w-auto sm:self-start sm:px-[26px] sm:text-base">
                    Continue with {glyph}
                </Button>
                <InkCounts counts={counts} />
            </div>
        </aside>
    );
}

/** Every inked kanji is through the four steps (濃 or 印): nothing to continue. */
function Done({ counts }: { counts: Record<number, number> }) {
    return (
        <aside aria-label="Where you left off" className="min-w-0 flex-[5_1_380px]">
            <div className={CARD}>
                <KindLabel jp="続き">Where you left off</KindLabel>
                <div className="flex flex-col gap-2">
                    <p className={H3}>Nothing left half-way</p>
                    <p className="text-sm leading-relaxed text-ink-2">
                        Every kanji you have started has been through all four steps. Pick a theme below, or search for the next one.
                    </p>
                </div>
                {/* Keeps the counts at the foot of the card, as in the continue card. */}
                <span aria-hidden className="hidden flex-1 sm:block" />
                <InkCounts counts={counts} />
            </div>
        </aside>
    );
}

/**
 * Home: where the learner left off (the last kanji with a learn step to do,
 * its next step and their ink), or the method on a first visit. The server
 * and the first client render show the method; the learner's card replaces
 * it once the ink store hydrates.
 */
export function ContinueCard({ themes, total }: ContinueCardProps) {
    const hydrated = useInkHydrated();
    const entries = useInkStore((state) => state.entries);
    const card = continueCard(hydrated ? entries : null);
    const themeOf = useMemo(() => {
        const map = new Map<string, string>();
        for (const t of themes) for (const char of t.chars) map.set(char, t.name);
        return map;
    }, [themes]);
    const counts = useMemo(() => shadeCounts(hydrated ? entries : {}, total), [hydrated, entries, total]);

    if (card.kind === "first") return <Method />;
    if (card.kind === "done") return <Done counts={counts} />;
    return <Continue pick={card.pick} category={themeOf.get(card.pick.char) ?? null} counts={counts} />;
}
