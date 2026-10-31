"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { setPath } from "@/lib/teach-set";
import { ActionBar } from "@/components/ui/ActionBar";
import { Button } from "@/components/ui/Button";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { groupOf, nextKanji, nextVerb, type NextKanji } from "./order";
import { shadeReader, useInkEntries } from "./useInk";
import type { ThemeRadical } from "./types";

interface ThemeAtlasData {
    theme: { name: string; slug: string };
    radicals: ThemeRadical[];
    /** Index of the radical shown in the preview. */
    selected: number;
    pick: (index: number) => void;
    /** The theme's next kanji in the suggested order (from the first kanji until the ink store hydrates). */
    next: NextKanji | null;
    previewRef: RefObject<HTMLElement | null>;
}

const ThemeAtlasContext = createContext<ThemeAtlasData | null>(null);

function useThemeAtlas(): ThemeAtlasData {
    const data = useContext(ThemeAtlasContext);
    if (!data) throw new Error("Theme islands must sit inside <ThemeAtlas>");
    return data;
}

interface ThemeAtlasProps {
    theme: { name: string; slug: string };
    /** Radicals in the suggested order. */
    radicals: ThemeRadical[];
    /** Every kanji of the theme in the suggested order, concatenated. */
    order: string;
    children: ReactNode;
}

/**
 * The theme page's one client state: which radical the preview shows. The
 * server renders the first (most useful) radical; once the ink store hydrates
 * the radical holding the next kanji is shown, until the learner picks one.
 * Server-rendered children pass through. Tiles and seals stay plain and
 * <InkPaint> fills them.
 */
export function ThemeAtlas({ theme, radicals, order, children }: ThemeAtlasProps) {
    const entries = useInkEntries();
    const groups = useMemo(() => radicals.map((r) => Array.from(r.chars)), [radicals]);
    const chars = useMemo(() => Array.from(order), [order]);
    const next = useMemo(() => nextKanji(chars, shadeReader(entries)), [chars, entries]);
    const [picked, setPicked] = useState<number | null>(null);
    const previewRef = useRef<HTMLElement | null>(null);

    const pick = useCallback((index: number) => {
        setPicked(index);
        // The seals sit below the plate: bring the preview back into view when it has scrolled away.
        const preview = previewRef.current;
        if (preview && preview.getBoundingClientRect().top < 0) {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            preview.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
        }
    }, []);

    const selected = picked ?? groupOf(groups, next?.char);
    const value = useMemo(() => ({ theme, radicals, selected, pick, next, previewRef }), [theme, radicals, selected, pick, next]);

    return <ThemeAtlasContext.Provider value={value}>{children}</ThemeAtlasContext.Provider>;
}

/** The selected radical: its seal, name, count and first kanji, with a link to its page. */
export function RadicalPreview() {
    const { radicals, selected, previewRef } = useThemeAtlas();
    const radical = radicals[selected];
    if (!radical) return null;
    const count = Array.from(radical.chars).length;

    return (
        <section
            ref={previewRef}
            aria-labelledby="radical-preview"
            className="flex scroll-mt-6 flex-col gap-4 rounded-2xl border border-line bg-card p-4 sm:px-[22px] sm:py-5"
        >
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
                <RadicalSeal char={radical.char} size="md" chars={radical.chars} />
                <div aria-live="polite" className="flex min-w-0 flex-col">
                    <h2 id="radical-preview" className="text-[17px] font-bold leading-[1.35]">
                        <span lang="ja" className="sr-only">
                            {radical.char}{" "}
                        </span>
                        {radical.gloss}
                    </h2>
                    <p className="text-xs text-ink-3">
                        {radical.name} · radical of {count.toLocaleString("en")} kanji · most used first
                    </p>
                </div>
                <Button size="sm" href={radicalPath(radical.key)} aria-label={`Open radical ${radical.char} ${radical.gloss}`} className="ml-auto">
                    Open radical
                </Button>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(76px,1fr))]">
                {radical.tiles.map((kanji) => (
                    // Keyed by kanji, so a new radical mounts new tiles and <InkPaint> paints them.
                    <li key={kanji.char} className="min-w-0">
                        <KanjiTile kanji={kanji} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

function NextLabel({ next }: { next: NextKanji }) {
    return (
        <>
            {nextVerb(next.mode)}{" "}
            <span lang="ja" className="font-jp font-extrabold">
                {next.char}
            </span>
        </>
    );
}

const studyHref = (slug: string) => `/study?theme=${slug}`;
const learnHref = (next: NextKanji) => `${kanjiPath(next.char)}#learn`;

/**
 * Continue with the next kanji (the page's one primary), study the theme,
 * and print the previewed kanji. On phones the first two are in <ThemeActionBar>.
 */
export function ThemeActions() {
    const { theme, radicals, selected, next } = useThemeAtlas();
    const radical = radicals[selected];
    const printChars = radical ? radical.tiles.map((k) => k.char) : [];

    return (
        <div className="flex flex-wrap items-center gap-2.5">
            {next && (
                <Button variant="primary" size="lg" href={learnHref(next)} className="max-lg:hidden">
                    <NextLabel next={next} />
                </Button>
            )}
            <Button size="lg" href={studyHref(theme.slug)} className="max-lg:hidden">
                Study this theme
            </Button>
            <span aria-hidden className="flex-1 max-lg:hidden" />
            {radical && printChars.length > 0 && (
                <Button
                    variant="quiet"
                    href={setPath("print", { chars: printChars, title: `${radical.char} ${radical.gloss} · ${theme.name}` })}
                    prefetch={false}
                    rel="nofollow"
                    aria-label={`Print sheet: the ${printChars.length} ${radical.char} kanji above`}
                    className="max-lg:-ml-2.5"
                >
                    Print sheet
                </Button>
            )}
        </div>
    );
}

/** Phones: the next kanji and the theme deck, pinned above the tab bar. Goes at the end of the page. */
export function ThemeActionBar() {
    const { theme, next } = useThemeAtlas();
    return (
        <ActionBar label="Theme actions">
            {next && (
                <Button variant="primary" href={learnHref(next)}>
                    <NextLabel next={next} />
                </Button>
            )}
            <Button href={studyHref(theme.slug)}>Study theme</Button>
        </ActionBar>
    );
}

/** Every radical of the theme as a seal, most useful first. Picking one shows it in the preview. */
export function ThemeSeals() {
    const { radicals, selected, pick } = useThemeAtlas();
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-x-3 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(92px,1fr))]">
            {radicals.map((radical, i) => {
                const count = Array.from(radical.chars).length;
                return (
                    <li key={radical.key} className="flex min-w-0 justify-center">
                        <RadicalSeal
                            char={radical.char}
                            chars={radical.chars}
                            name={radical.gloss}
                            count={`${count.toLocaleString("en")} kanji`}
                            pressed={i === selected}
                            onClick={() => pick(i)}
                            label={`${radical.char} ${radical.gloss}, ${count} kanji`}
                            className="w-full"
                        />
                    </li>
                );
            })}
        </ul>
    );
}
