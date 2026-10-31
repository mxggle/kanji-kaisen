"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import { GraduationCap, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { kanjiPath, practiceCategoryPath, radicalPath } from "@/lib/atlas/paths";
import { SHADE_NAMES, themeProgress } from "@/lib/ink";
import { ThemeScroll } from "@/components/Ink/ThemeScroll";
import { nextKanji, nextLabel, sealState, SEAL_LABELS, type NextKanji, type SealState, type ShadeOf } from "./order";
import { cellClass, FOCUS_RING, InkLegend, sealClass } from "./parts";
import { shadeReader, useInkEntries } from "./useInk";
import { PANEL_CELLS, type PanelRadical, type ThemeMeta } from "./types";
import styles from "./theme.module.css";

interface ThemeData {
    theme: ThemeMeta;
    radicals: PanelRadical[];
    /** Each radical's kanji, split. */
    groups: string[][];
    /** Every kanji of the theme in the suggested order. */
    order: string[];
}

const ThemeContext = createContext<ThemeData | null>(null);

function useThemeData(): ThemeData {
    const data = useContext(ThemeContext);
    if (!data) throw new Error("Theme islands must sit inside <ThemeProvider>");
    return data;
}

/**
 * Sends the theme's radicals and kanji to the client once, for every island on
 * the page (counts, seals, panel, scroll). Server-rendered children pass through.
 */
export function ThemeProvider({ theme, radicals, children }: { theme: ThemeMeta; radicals: PanelRadical[]; children: React.ReactNode }) {
    const value = useMemo(() => {
        const groups = radicals.map((r) => Array.from(r.chars));
        return { theme, radicals, groups, order: groups.flat() };
    }, [theme, radicals]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** " · you know 52" after the counts, once the ink store has hydrated and the learner knows any. */
export function ThemeKnown() {
    const { order } = useThemeData();
    const entries = useInkEntries();
    const known = useMemo(() => (entries ? themeProgress(entries, order).known : 0), [entries, order]);
    return known > 0 ? <> · you know {known}</> : null;
}

/**
 * Radical seals in the suggested order and the selected radical's panel, with
 * the theme scroll. The server renders the first radical with no ink; after
 * hydration the radical holding the next kanji is selected (until the learner
 * picks one). Every radical and kanji link is also in the server-rendered list
 * below, so this is a progressive enhancement.
 */
export function ThemeExplorer() {
    const { theme, radicals, groups, order } = useThemeData();
    const entries = useInkEntries();
    const shadeOf = useMemo(() => (entries ? shadeReader(entries) : null), [entries]);
    const [picked, setPicked] = useState<string | null>(null);

    const next = shadeOf ? nextKanji(order, shadeOf) : null;
    const nextGroup = next ? groups.findIndex((g) => g.includes(next.char)) : -1;
    const states: (SealState | null)[] = groups.map((g, i) => (shadeOf ? sealState(g, shadeOf, i === nextGroup) : null));
    const pickedIndex = picked ? radicals.findIndex((r) => r.key === picked) : -1;
    const selected = pickedIndex >= 0 ? pickedIndex : Math.max(0, nextGroup);

    if (radicals.length === 0) return null;

    return (
        <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_340px] md:gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section aria-labelledby="seals-title" className="min-w-0">
                <h2 id="seals-title" className="sr-only">Radicals in {theme.name}</h2>
                <p className="mb-2 text-xs text-ink-3 sm:mb-3.5 sm:text-[13px]">A good order · most useful first · skip ahead any time</p>
                <ol
                    className={cn(
                        styles.swipe,
                        "-mx-4 flex snap-x scroll-px-4 gap-3.5 overflow-x-auto px-4 pt-2 pb-3",
                        "sm:mx-0 sm:flex-wrap sm:gap-x-4 sm:gap-y-5 sm:overflow-visible sm:px-1",
                    )}
                >
                    {radicals.map((radical, i) => {
                        const state = states[i];
                        const on = i === selected;
                        return (
                            <li key={radical.key} className="flex w-[60px] flex-none snap-start flex-col items-center gap-1.5 sm:w-[76px] sm:gap-2">
                                <button
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={`${radical.char} ${radical.name}${state ? `, ${SEAL_LABELS[state]}` : ""}`}
                                    onClick={() => setPicked(radical.key)}
                                    className={sealClass(
                                        state,
                                        cn("size-[52px] cursor-pointer text-2xl sm:size-16 sm:text-[29px]", styles.pressable, on && styles.selected, FOCUS_RING),
                                    )}
                                >
                                    <span lang="ja" aria-hidden>{radical.char}</span>
                                </button>
                                <span aria-hidden title={radical.name} className="w-full truncate text-center text-[11px] text-ink-2 sm:text-xs">
                                    {radical.name}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <div className="flex min-w-0 flex-col gap-4">
                <RadicalPanel radical={radicals[selected]} chars={groups[selected]} shadeOf={shadeOf} />
                <ThemeScroll theme={theme.name} chars={order} />
                <div className="flex flex-wrap gap-2.5">
                    <Link
                        href={`/study?theme=${theme.slug}`}
                        className={cn("inline-flex h-11 items-center gap-2 rounded-full border border-line-2 px-4 text-sm font-medium transition-colors hover:border-ink-2", FOCUS_RING)}
                    >
                        <GraduationCap size={17} aria-hidden /> Study this theme
                    </Link>
                    <Link
                        href={practiceCategoryPath(theme.name)}
                        prefetch={false}
                        className={cn("inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-ink-2 transition-colors hover:text-ink", FOCUS_RING)}
                    >
                        <Swords size={17} aria-hidden /> Practice this theme (classic)
                    </Link>
                </div>
            </div>
        </div>
    );
}

function RadicalPanel({ radical, chars, shadeOf }: { radical: PanelRadical; chars: string[]; shadeOf: ShadeOf | null }) {
    const next: NextKanji | null = shadeOf ? nextKanji(chars, shadeOf) : chars[0] ? { char: chars[0], mode: "start" } : null;
    const cells = chars.slice(0, PANEL_CELLS);

    return (
        <section
            aria-labelledby="panel-title"
            className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-5 lg:rounded-2xl lg:border-line-2 lg:bg-shade/70 lg:p-7 lg:backdrop-blur-md"
        >
            <div aria-live="polite" className="flex items-center gap-3.5 lg:gap-[18px]">
                <span lang="ja" aria-hidden className="font-jp text-[58px] font-extrabold leading-none lg:text-[84px]">{radical.char}</span>
                <div className="min-w-0">
                    <h2 id="panel-title" className="font-disp text-[26px] font-bold leading-none lg:text-[32px]">
                        <span className="sr-only">{radical.char} </span>{radical.name}
                    </h2>
                    <p className="mt-1.5 text-[13px] text-ink-2 lg:text-sm">
                        {radical.meaning} · {chars.length} kanji
                    </p>
                </div>
            </div>

            {radical.story && (
                <figure>
                    <figcaption className="mb-1.5 text-[11px] font-medium uppercase tracking-[.14em] text-ink-3">Memory story</figcaption>
                    <blockquote className="font-disp text-[17px] italic leading-[1.4] lg:text-[19px]">“{radical.story}”</blockquote>
                </figure>
            )}

            <div>
                <p className="mb-2 flex items-center justify-between gap-3 text-[13px] text-ink-3">
                    <span>Its kanji</span>
                    <span className="inline-flex items-center gap-2"><InkLegend /> darker = better known</span>
                </p>
                {/* Three rows of eight are always reserved, so switching radicals doesn't move the page. */}
                <div className="aspect-[8/3]">
                    <ul className="grid grid-cols-8 content-start gap-[5px] lg:gap-1.5">
                        {cells.map((char, i) => {
                            const shade = shadeOf ? shadeOf(char) : 0;
                            const meaning = radical.meanings[i];
                            return (
                                <li key={char}>
                                    <Link
                                        href={kanjiPath(char)}
                                        prefetch={false}
                                        aria-label={`${char}${meaning ? `, ${meaning}` : ""}${shadeOf ? `, ${SHADE_NAMES[shade]}` : ""}`}
                                        title={meaning}
                                        className={cellClass(
                                            shade,
                                            cn("flex aspect-square items-center justify-center rounded-md font-jp text-base font-extrabold lg:rounded-[7px] lg:text-[19px]", FOCUS_RING, "focus-visible:outline-offset-2"),
                                        )}
                                    >
                                        <span lang="ja" aria-hidden>{char}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                {chars.length > PANEL_CELLS && (
                    <a href={`#radical-${radical.key}`} className="mt-1 inline-block text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                        All {chars.length} {radical.char} kanji <span aria-hidden>↓</span>
                    </a>
                )}
            </div>

            {next && (
                <Link
                    href={`${kanjiPath(next.char)}#learn`}
                    className={cn("flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-c text-base font-bold text-onacc transition-colors hover:bg-ink hover:text-bg", FOCUS_RING)}
                >
                    {nextLabel(next)} <span aria-hidden>→</span>
                </Link>
            )}
            <Link
                href={radicalPath(radical.key)}
                className={cn("-mt-1 self-center text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline", FOCUS_RING)}
            >
                <span lang="ja">{radical.char}</span> {radical.name}: its story and every kanji <span aria-hidden>→</span>
            </Link>
        </section>
    );
}
