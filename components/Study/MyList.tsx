"use client";

import Link from "next/link";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADE_JP, SHADE_NAMES, SHADES, themeProgress, type InkEntries, type Shade } from "@/lib/ink";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { listSaved, type StudyEntry } from "@/lib/study-list";
import { extractKanji } from "@/lib/teach-set";
import { browsePath, categoryPath, kanjiPath } from "@/lib/atlas/paths";
import { getCategorySlug, isCategoryName, THEME_SHORT } from "@/lib/atlas/categories";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import type { JlptLevel } from "@/lib/atlas/types";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { Tool } from "@/components/Layout/Tool";
import { flip, leave, measure, type Rects } from "@/components/Browse/flip";
import { enterOrder } from "@/components/Motion/tokens";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { PaintedBar } from "@/components/ui/PaintedBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { currentLevel, filterByShade, firstToLearn, recentTheme, revisitChars, shadeCounts, type AtlasIndex } from "./my-list";
import { studyPath, type DeckRequest } from "./session";
import { useSearchIndex } from "./useSearchIndex";

const EMPTY: InkEntries = {};
const TILE_GRID = "grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2.5";

const short = (theme: string) => (isCategoryName(theme) ? THEME_SHORT[theme] : theme);

/** Hooks on what appears in answer to the learner start at once, not at the result's place in the page entrance. */
const NOW = enterOrder(0);

/** The learner's ink and saved list, with a char → theme lookup for tile colours. */
function useAtlas(atlas: AtlasIndex) {
    return useMemo(() => {
        const themeOf = new Map<string, string>();
        for (const theme of atlas.themes) for (const char of theme.chars) themeOf.set(char, theme.name);
        const all = atlas.jlpt.map((l) => l.chars).join("");
        const known = new Set(Array.from(all));
        return { themeOf, all, known };
    }, [atlas]);
}

/**
 * My list on the Tool template: the rail is the only progress view (shade
 * counts and one painted bar per theme); the result is the saved kanji, a
 * revisit suggestion (never a queue) and ways to study.
 */
export function MyList({ atlas }: { atlas: AtlasIndex }) {
    const inkReady = useInkHydrated();
    const listReady = useStudyStoreHydrated();
    const stored = useInkStore((s) => s.entries);
    const ink = inkReady ? stored : EMPTY;
    const saved = useStudyStore((s) => s.entries);
    const { themeOf, all, known } = useAtlas(atlas);

    const savedChars = useMemo(() => (listReady ? listSaved(saved) : []), [listReady, saved]);
    const revisit = useMemo(() => revisitChars(ink, undefined, (c) => known.has(c)), [ink, known]);
    const level = currentLevel(ink, atlas.jlpt);

    const action =
        !listReady ? (
            <Button variant="primary" aria-disabled="true">
                Study saved
            </Button>
        ) : savedChars.length > 0 ? (
            <Button variant="primary" href={studyPath({ kind: "list" })}>
                Study saved <span aria-hidden>·</span> {savedChars.length}
            </Button>
        ) : (
            <Button variant="primary" href={browsePath({ jlpt: level })}>
                Browse {level} kanji
            </Button>
        );

    return (
        <Tool
            jp="墨"
            kind="My list"
            title="Your ink"
            lede="What you've saved, how dark each kanji is, and what you can study. Kept in this browser. Nothing comes due."
            actions={action}
            railLabel="Your ink"
            rail={<InkRail atlas={atlas} all={all} ink={ink} ready={inkReady} />}
        >
            <div className="flex flex-col gap-16">
                <Saved chars={savedChars} ready={listReady} ink={ink} themeOf={themeOf} level={level} />
                <Revisit chars={revisit} ready={inkReady} ink={ink} themeOf={themeOf} />
                <Study atlas={atlas} ink={ink} saved={savedChars} revisit={revisit} level={level} known={known} />
                <p className="text-sm text-ink-2" data-reveal="fade">
                    Prefer the old checkpoint path?{" "}
                    <Link href="/practice" prefetch={false} className="text-ink underline underline-offset-[3px] hover:text-ink-2">
                        Classic practice
                    </Link>{" "}
                    is still here, unchanged.
                </p>
            </div>
        </Tool>
    );
}

/** Rail: every kanji by shade, then one painted bar per theme. */
function InkRail({ atlas, all, ink, ready }: { atlas: AtlasIndex; all: string; ink: InkEntries; ready: boolean }) {
    const counts = shadeCounts(ink, all);
    return (
        <>
            <div className="flex flex-col gap-2.5">
                <h2 className="type-label">All {atlas.total.toLocaleString("en")} kanji</h2>
                <ul className="flex flex-col gap-2">
                    {SHADES.map((shade) => (
                        <li key={shade} className="flex items-center gap-3">
                            <span
                                aria-hidden
                                lang="ja"
                                data-ink={shade}
                                className="flex size-9 flex-none items-center justify-center rounded-lg border border-line font-jp text-base font-extrabold"
                            >
                                {SHADE_JP[shade]}
                            </span>
                            <span className="flex-1 text-sm">{SHADE_NAMES[shade]}</span>
                            <span className={cn("text-sm tabular-nums text-ink-2 transition-opacity duration-500", !ready && "invisible opacity-0")}>{counts[shade].toLocaleString("en")}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <hr className="h-px border-0 bg-line" />
            <div className="flex flex-col gap-3.5">
                <h2 className="type-label">By theme</h2>
                <ul className="flex flex-col gap-3.5">
                    {atlas.themes.map((theme) => {
                        const progress = themeProgress(ink, theme.chars);
                        return (
                            <li key={theme.name} style={themeVars(theme.name)}>
                                <Link href={categoryPath(theme.name)} className="block rounded-sm text-ink transition-colors hover:text-ink-2">
                                    <PaintedBar
                                        painted={progress.painted}
                                        known={progress.known}
                                        total={progress.total}
                                        caption
                                        label={short(theme.name)}
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    );
}

interface TileListProps {
    ink: InkEntries;
    themeOf: Map<string, string>;
}

function tileData(char: string, entry: SearchIndexEntry | undefined, themeOf: Map<string, string>) {
    return { char, meanings: entry?.m, onyomi: entry?.on, kunyomi: entry?.kun, category: themeOf.get(char) ?? null };
}

type Filter = Shade | "all";

function Saved({ chars, ready, ink, themeOf, level }: TileListProps & { chars: string[]; ready: boolean; level: JlptLevel }) {
    const titleId = useId();
    const { byChar, error, retry } = useSearchIndex();
    const entries = useStudyStore((s) => s.entries);
    const unsave = useStudyStore((s) => s.unsave);
    const restore = useStudyStore((s) => s.restore);
    const [filter, setFilter] = useState<Filter>("all");
    const [editing, setEditing] = useState(false);
    const [removed, setRemoved] = useState<{ char: string; entry: StudyEntry } | null>(null);
    // Removing or restoring a kanji slides the others to their new places (FLIP).
    const gridRef = useRef<HTMLUListElement>(null);
    const flipFrom = useRef<Rects | null>(null);

    const counts = shadeCounts(ink, chars);
    const shown = filterByShade(ink, chars, filter);

    useLayoutEffect(() => {
        if (!flipFrom.current) return;
        flip(gridRef.current, flipFrom.current);
        flipFrom.current = null;
    });

    const remove = (char: string) => {
        const entry = entries[char];
        if (!entry) return;
        flipFrom.current = measure(gridRef.current);
        unsave(char);
        setRemoved({ char, entry });
    };

    const aside =
        chars.length > 0 ? (
            <span className="flex items-center gap-2">
                <span className="max-sm:hidden">Save from any kanji page</span>
                <Button variant="quiet" size="sm" aria-pressed={editing} onClick={() => setEditing((e) => !e)}>
                    {editing ? "Done" : "Edit"}
                </Button>
            </span>
        ) : (
            "Save from any kanji page"
        );

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-[18px]">
            <SectionHeader jp="保存" title="Saved" id={titleId} aside={ready ? aside : undefined} />

            {removed && (
                <div key={removed.char} role="status" data-enter="" style={enterOrder(0, 0, { "--rise": "8px" } as React.CSSProperties)} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-2 text-sm">
                    <span className="text-ink-2">
                        Removed{" "}
                        <span lang="ja" className="font-jp text-ink">
                            {removed.char}
                        </span>{" "}
                        from My list.
                    </span>
                    <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => {
                            flipFrom.current = measure(gridRef.current);
                            restore(removed.char, removed.entry);
                            setRemoved(null);
                        }}
                    >
                        Undo
                    </Button>
                </div>
            )}

            {!ready ? (
                <ul aria-busy="true" aria-label="Loading your list" className={TILE_GRID}>
                    {Array.from({ length: 8 }, (_, i) => (
                        <li key={i} className="aspect-[1/1.12] animate-pulse rounded-xl border border-line bg-card" />
                    ))}
                </ul>
            ) : chars.length === 0 ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-[22px] py-5" data-enter="" style={NOW}>
                    <p className="text-base text-ink">Nothing saved yet.</p>
                    <p className="text-sm text-ink-2">Open any kanji and press Save to keep it here. Your ink is kept either way: every kanji you learn darkens on its own.</p>
                    <Button href={studyPath({ kind: "jlpt", level })} size="sm" className="self-start">
                        Study {level} without saving
                    </Button>
                </div>
            ) : (
                <>
                    <div role="group" aria-label="Show saved kanji by shade" className="flex flex-wrap items-center gap-2">
                        <Chip pressed={filter === "all"} onClick={() => setFilter("all")} count={chars.length}>
                            All
                        </Chip>
                        {SHADES.filter((s) => counts[s] > 0 || filter === s).map((s) => (
                            <Chip key={s} pressed={filter === s} onClick={() => setFilter(s)} count={counts[s]}>
                                <span lang="ja" className="font-jp">
                                    {SHADE_JP[s]}
                                </span>{" "}
                                {SHADE_NAMES[s]}
                            </Chip>
                        ))}
                    </div>
                    {error && (
                        <p className="text-sm text-ink-2">
                            Couldn&apos;t load meanings and readings.{" "}
                            <button type="button" onClick={retry} className="text-ink underline underline-offset-[3px]">
                                Try again
                            </button>
                        </p>
                    )}
                    {shown.length === 0 ? (
                        <p className="py-4 text-sm text-ink-3" data-enter="fade" style={NOW}>
                            No saved kanji at this shade.
                        </p>
                    ) : (
                        // New tiles (the list arriving, another shade, an undo) rise in as they come into view.
                        <ul ref={gridRef} className={TILE_GRID} data-reveal-group="rise">
                            {shown.map((char) => (
                                <li key={char} data-flip={char} className="relative min-w-0">
                                    <KanjiTile kanji={tileData(char, byChar?.get(char), themeOf)} shade={ink[char]?.shade ?? 0} />
                                    {editing && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                // The tile fades out first; then the others close the gap.
                                                const tile = e.currentTarget.closest("li");
                                                if (entries[char]) leave(tile, () => remove(char));
                                            }}
                                            aria-label={`Remove ${char} from My list`}
                                            title="Remove from My list"
                                            data-enter="fade"
                                            style={NOW}
                                            className="absolute -right-1.5 -top-1.5 flex size-8 items-center justify-center rounded-full border border-line-2 bg-bg text-ink-2 transition-colors hover:border-ink hover:text-ink"
                                        >
                                            <X className="size-4" aria-hidden />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </section>
    );
}

function Revisit({ chars, ready, ink, themeOf }: TileListProps & { chars: string[]; ready: boolean }) {
    const titleId = useId();
    const { byChar } = useSearchIndex();
    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-[18px]" data-reveal="">
            <SectionHeader jp="再訪" title="Worth a revisit" id={titleId} aside="A suggestion, not a queue" />
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-card px-[22px] py-5">
                {!ready ? (
                    <div aria-hidden className="h-16 w-full animate-pulse rounded-xl bg-raise" />
                ) : chars.length > 0 ? (
                    <>
                        <ul className="flex flex-wrap gap-2">
                            {chars.map((char) => (
                                <li key={char} className="w-16">
                                    <KanjiTile size="sq" kanji={tileData(char, byChar?.get(char), themeOf)} shade={ink[char]?.shade ?? 0} />
                                </li>
                            ))}
                        </ul>
                        <p className="min-w-0 flex-[1_1_220px] text-sm text-ink-2">
                            Kanji you&apos;ve met but haven&apos;t practised lately, oldest first. Skip them as long as you like; nothing piles up.
                        </p>
                        <Button href={studyPath({ kind: "revisit", chars })}>Practise these</Button>
                    </>
                ) : (
                    <p className="text-sm text-ink-2">
                        Nothing here yet. Kanji at{" "}
                        <span lang="ja" className="font-jp">
                            {SHADE_JP[1]}
                        </span>{" "}
                        {SHADE_NAMES[1]} or{" "}
                        <span lang="ja" className="font-jp">
                            {SHADE_JP[2]}
                        </span>{" "}
                        {SHADE_NAMES[2]} show up here, the ones you haven&apos;t touched longest first. Nothing piles up.
                    </p>
                )}
            </div>
        </section>
    );
}

type DeckId = "saved" | "revisit" | "jlpt" | "theme" | "paste";

interface StudyProps {
    atlas: AtlasIndex;
    ink: InkEntries;
    saved: string[];
    revisit: string[];
    level: JlptLevel;
    known: Set<string>;
}

const MODES = [
    { id: "flashcards", jp: "札", title: "Flashcards", text: "Kanji on the front. Meaning and readings on the back." },
    { id: "quiz", jp: "問", title: "Meaning quiz", text: "Pick the meaning from four. A wrong answer costs nothing." },
    { id: "steps", jp: "書", title: "Four steps", text: "Meet, recall, trace and write each one. This is what darkens the ink." },
] as const;

function Study({ atlas, ink, saved, revisit, level, known }: StudyProps) {
    const titleId = useId();
    const pasteId = useId();
    const theme = recentTheme(ink, atlas.themes) ?? atlas.themes[0]?.name ?? "";
    const [picked, setPicked] = useState<DeckId | null>(null);
    const [pasted, setPasted] = useState("");

    const decks: { id: DeckId; label: string; theme?: string }[] = [
        ...(saved.length ? [{ id: "saved" as const, label: "Saved" }] : []),
        ...(revisit.length ? [{ id: "revisit" as const, label: "Worth a revisit" }] : []),
        { id: "jlpt", label: level },
        { id: "theme", label: short(theme), theme },
        { id: "paste", label: "Paste kanji" },
    ];
    const deck = picked && decks.some((d) => d.id === picked) ? picked : decks[0].id;
    const pastedChars = extractKanji(pasted, known);

    let request: DeckRequest | null;
    let chars: string[];
    if (deck === "saved") {
        request = { kind: "list" };
        chars = saved;
    } else if (deck === "revisit") {
        request = { kind: "revisit", chars: revisit };
        chars = revisit;
    } else if (deck === "jlpt") {
        request = { kind: "jlpt", level };
        chars = Array.from(atlas.jlpt.find((l) => l.level === level)?.chars ?? "");
    } else if (deck === "theme") {
        request = { kind: "theme", slug: getCategorySlug(theme) };
        chars = Array.from(atlas.themes.find((t) => t.name === theme)?.chars ?? "");
    } else {
        request = pastedChars.length ? { kind: "chars", chars: pastedChars, title: "Your kanji" } : null;
        chars = pastedChars;
    }
    const first = firstToLearn(ink, chars);

    const hrefFor = (mode: (typeof MODES)[number]["id"]) => {
        if (mode === "steps") return first ? `${kanjiPath(first)}#learn` : null;
        return request ? studyPath(request, mode) : null;
    };

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-[18px]">
            <SectionHeader jp="学習" title="Study" id={titleId} aside="Pick a deck, then a way to study it" data-reveal="fade" />
            <div role="group" aria-label="Deck" className="flex flex-wrap items-center gap-2" data-reveal="fade">
                <span aria-hidden className="mr-1 text-sm text-ink-2">
                    Deck
                </span>
                {decks.map((d) => (
                    <Chip key={d.id} pressed={deck === d.id} onClick={() => setPicked(d.id)} theme={d.theme}>
                        {d.label}
                    </Chip>
                ))}
            </div>
            {deck === "paste" && (
                <div className="flex flex-col gap-2" data-enter="" style={enterOrder(0, 0, { "--rise": "8px" } as React.CSSProperties)}>
                    <label htmlFor={pasteId} className="text-sm text-ink-2">
                        Paste or type the kanji you want to study, up to 60.
                    </label>
                    <input
                        id={pasteId}
                        value={pasted}
                        onChange={(e) => setPasted(e.target.value)}
                        placeholder="海 池 泳 港"
                        lang="ja"
                        autoComplete="off"
                        className="h-11 w-full max-w-md rounded-full border border-line-2 bg-card px-4 font-jp text-lg text-ink placeholder:text-ink-3 focus:border-ink"
                    />
                    <p aria-live="polite" className="text-xs text-ink-3">
                        {pasted.trim() === "" ? "Anything that isn't a kanji is skipped." : pastedChars.length === 0 ? "No kanji found yet." : `${pastedChars.length} kanji: ${pastedChars.join(" ")}`}
                    </p>
                </div>
            )}
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4" data-reveal-group="rise">
                {MODES.map((mode) => {
                    const href = hrefFor(mode.id);
                    return (
                        <li key={mode.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-[22px] py-5">
                            <p className="flex items-center gap-3">
                                <span
                                    aria-hidden
                                    lang="ja"
                                    className="flex size-11 flex-none items-center justify-center rounded-full border border-line-2 font-jp text-[21px] font-extrabold leading-none"
                                >
                                    {mode.jp}
                                </span>
                                <span className="text-[17px] font-bold leading-snug">{mode.title}</span>
                            </p>
                            <p className="text-sm text-ink-2">{mode.text}</p>
                            {href ? (
                                <Button href={href} size="sm" className="mt-auto self-start" aria-label={`Start ${mode.title.toLowerCase()}`}>
                                    Start
                                </Button>
                            ) : (
                                <Button size="sm" disabled className="mt-auto self-start">
                                    Start
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
