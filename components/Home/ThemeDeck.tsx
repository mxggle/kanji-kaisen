"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { categoryPath, kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { paintedPercent, themeProgress, type ThemeProgress } from "@/lib/ink";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import {
    mostPainted,
    nextKanji,
    nextLabel,
    sealState,
    SEAL_LABELS,
    sliceGroups,
    type NextKanji,
    type SealState,
    type ShadeOf,
} from "@/components/Theme/order";
import { FOCUS_RING, Fog, InkBar, InkRing, sealClass, shadeGradient, ThemeImage } from "@/components/Theme/parts";
import { shadeReader, useInkEntries } from "@/components/Theme/useInk";
import type { DeckTheme } from "@/components/Theme/types";
import styles from "@/components/Theme/theme.module.css";

/** Seals shown on the featured card. */
const FEATURED_SEALS = 8;

interface ThemeDeckProps {
    themes: DeckTheme[];
    /** Featured on the server and for learners with no ink. */
    defaultSlug: string;
}

/**
 * Home: the featured theme and the ten gates. The server renders the default
 * theme without ink; after hydration the learner's most-painted theme takes
 * over (until they pick a gate). The card has a fixed height, so swapping
 * themes never moves the sections below.
 */
export function ThemeDeck({ themes, defaultSlug }: ThemeDeckProps) {
    const entries = useInkEntries();
    const shadeOf = useMemo(() => shadeReader(entries), [entries]);
    const chars = useMemo(() => themes.map((t) => Array.from(t.order)), [themes]);
    const progress = useMemo(
        () => (entries ? chars.map((list) => themeProgress(entries, list)) : null),
        [entries, chars],
    );
    const [picked, setPicked] = useState<string | null>(null);
    const featuredRef = useRef<HTMLElement>(null);

    const auto = progress
        ? mostPainted(themes.map((t, i) => ({ slug: t.slug, painted: progress[i].painted })))?.slug
        : undefined;
    const index = Math.max(0, themes.findIndex((t) => t.slug === (picked ?? auto ?? defaultSlug)));

    const pick = (theme: DeckTheme) => {
        trackEvent("theme_gate_clicked", { theme: theme.slug, source: "home" });
        setPicked(theme.slug);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        featuredRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    };

    return (
        <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-7">
            <FeaturedTheme
                ref={featuredRef}
                theme={themes[index]}
                chars={chars[index]}
                progress={progress?.[index] ?? null}
                shadeOf={entries ? shadeOf : null}
            />
            <p aria-live="polite" className="sr-only">{picked ? `Showing ${themes[index].name}` : ""}</p>

            <section aria-labelledby="gates-title" className="flex min-w-0 flex-col">
                <div className="mb-2.5 flex items-baseline justify-between gap-4 lg:mb-4">
                    <h2 id="gates-title" className="font-disp text-2xl font-bold lg:text-[30px] lg:font-semibold">Ten themes</h2>
                    <p className="text-xs text-ink-3 lg:text-[13px]">
                        <span className="md:hidden">swipe · </span>start anywhere ·{" "}
                        <Link href="/categories" className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">all themes</Link>
                    </p>
                </div>
                <ul
                    className={cn(
                        styles.swipe,
                        "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pt-1 pb-2",
                        "md:mx-0 md:grid md:grid-cols-5 md:gap-3.5 md:overflow-visible md:px-0 md:pb-0",
                        "lg:min-h-0 lg:flex-1 lg:grid-cols-4 lg:auto-rows-[minmax(0,1fr)] lg:gap-x-3.5 lg:gap-y-4",
                    )}
                >
                    {themes.map((theme, i) => {
                        const pct = progress ? paintedPercent(progress[i].painted) : null;
                        const on = i === index;
                        return (
                            <li key={theme.slug} className="flex-none snap-start md:flex-auto">
                                <button
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={pct === null ? theme.name : `${theme.name}, ${pct}% painted`}
                                    onClick={() => pick(theme)}
                                    style={themeVars(theme.name)}
                                    className={cn(
                                        styles.gate,
                                        on && styles.gateOn,
                                        "block h-[150px] w-[104px] cursor-pointer md:h-[200px] md:w-full lg:h-full lg:min-h-[150px]",
                                        FOCUS_RING,
                                    )}
                                >
                                    <ThemeImage
                                        src={theme.image}
                                        sizes="(min-width: 1024px) 128px, (min-width: 768px) 20vw, 104px"
                                        className={on ? "opacity-100" : "opacity-70"}
                                    />
                                    <span
                                        aria-hidden
                                        className="absolute inset-0"
                                        style={{ background: shadeGradient("180deg", [[0, 30], [0.94, 92]]) }}
                                    />
                                    <span className="absolute inset-x-[9px] bottom-[9px] flex flex-col gap-[5px] lg:inset-x-3 lg:bottom-3 lg:gap-1.5">
                                        <span className="font-disp text-[15px] font-bold leading-none lg:text-lg lg:leading-[1.05]">{theme.short}</span>
                                        <InkBar pct={pct ?? 0} />
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}

interface FeaturedThemeProps {
    ref: React.Ref<HTMLElement>;
    theme: DeckTheme;
    chars: string[];
    /** Null until the ink store hydrates. */
    progress: ThemeProgress | null;
    /** Null until the ink store hydrates. */
    shadeOf: ShadeOf | null;
}

function FeaturedTheme({ ref, theme, chars, progress, shadeOf }: FeaturedThemeProps) {
    const next: NextKanji | null = shadeOf ? nextKanji(chars, shadeOf) : chars[0] ? { char: chars[0], mode: "start" } : null;
    const groups = sliceGroups(chars, theme.radicals.map((r) => r.count));
    const seals = theme.radicals.slice(0, FEATURED_SEALS).map((radical, i) => {
        const state: SealState | null = shadeOf ? sealState(groups[i], shadeOf, next !== null && groups[i].includes(next.char)) : null;
        return { radical, state };
    });
    const pct = progress ? paintedPercent(progress.painted) : null;
    const titleId = `featured-${theme.slug}`;

    return (
        <section
            ref={ref}
            aria-labelledby={titleId}
            style={themeVars(theme.name)}
            className="relative isolate h-[520px] scroll-mt-20 overflow-hidden rounded-[18px] border border-line bg-card sm:h-[580px] lg:h-[660px] lg:rounded-[14px]"
        >
            <ThemeImage src={theme.image} sizes="(min-width: 1280px) 760px, (min-width: 1024px) 62vw, 100vw" />
            <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: shadeGradient("180deg", [[0.5, 0], [0.05, 30], [0.6, 58], [0.97, 100]]) }}
            />
            <Fog className="bottom-[34%] h-[180px]" />
            <span
                lang="ja"
                aria-hidden
                className="pointer-events-none absolute -right-3.5 top-6 select-none font-jp text-[220px] font-extrabold leading-none text-c opacity-[.14] lg:-right-5 lg:top-10 lg:text-[400px] lg:opacity-[.13]"
            >
                {theme.mark}
            </span>

            <p className="absolute left-5 right-5 top-5 flex items-center gap-3.5 lg:left-11 lg:top-[34px]">
                <span lang="ja" className="font-jp text-sm text-c lg:text-lg">{theme.jp}</span>
                <span aria-hidden className="hidden h-px w-12 bg-c opacity-60 sm:block" />
                <span className="hidden truncate font-disp text-[17px] italic text-ink-2 sm:inline lg:text-[19px]">{theme.sub}</span>
            </p>

            <div className="absolute inset-x-5 bottom-5 flex flex-col gap-3.5 lg:inset-x-11 lg:bottom-10 lg:gap-5">
                <div className="flex items-end justify-between gap-4 lg:gap-6">
                    <h2
                        id={titleId}
                        className="glow min-w-0 text-balance font-disp text-[44px] font-bold leading-[.95] text-c lg:text-[clamp(52px,5vw,76px)]"
                    >
                        {theme.name}
                    </h2>
                    <InkRing pct={pct} className="size-[72px] lg:size-[104px]" numberClassName="text-[22px] lg:text-[32px]" />
                </div>
                <p className="hidden max-w-[600px] text-[15px] leading-relaxed text-ink-2 sm:line-clamp-3 lg:text-base">{theme.lore}</p>
                <div>
                    <p className="mb-2.5 text-[13px] text-ink-3 lg:mb-3">
                        {theme.radicalCount} radicals · {theme.kanjiCount} kanji
                        {progress && progress.known > 0 && <> · you know {progress.known}</>}
                    </p>
                    <ul
                        aria-label={`First radicals of ${theme.name}, most useful first`}
                        className={cn(styles.swipe, "-mx-5 flex gap-2 overflow-x-auto px-5 py-1.5 lg:mx-0 lg:gap-3 lg:overflow-visible lg:px-0")}
                    >
                        {seals.map(({ radical, state }) => (
                            <li key={radical.key}>
                                <Link
                                    href={radicalPath(radical.key)}
                                    title={radical.name}
                                    aria-label={`${radical.char} ${radical.name}${state ? `, ${SEAL_LABELS[state]}` : ""}`}
                                    className={sealClass(state, cn("size-11 text-xl lg:size-14 lg:text-[26px]", FOCUS_RING))}
                                >
                                    <span lang="ja" aria-hidden>{radical.char}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-wrap gap-2.5 lg:gap-3">
                    {next && (
                        <Link
                            href={`${kanjiPath(next.char)}#learn`}
                            className={cn(
                                "halo inline-flex h-[52px] flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-c px-5 text-[15px] font-bold text-onacc transition-colors hover:bg-ink hover:text-bg sm:flex-none lg:gap-3 lg:px-[26px] lg:text-base",
                                FOCUS_RING,
                            )}
                        >
                            {nextLabel(next)} <span aria-hidden>→</span>
                        </Link>
                    )}
                    <Link
                        href={categoryPath(theme.name)}
                        className={cn(
                            "inline-flex h-[52px] items-center whitespace-nowrap rounded-full border border-line-2 bg-shade/35 px-4 text-[15px] font-medium transition-colors hover:border-ink-2 lg:px-6 lg:text-base",
                            FOCUS_RING,
                        )}
                    >
                        Open the theme
                    </Link>
                </div>
            </div>
        </section>
    );
}
