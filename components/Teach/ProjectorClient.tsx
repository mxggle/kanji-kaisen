"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Maximize, Minimize, MessageCircleQuestion, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { CATEGORIES, getThemeColor } from "@/lib/atlas/categories";
import { buildMeaningOptions } from "@/lib/atlas/quiz";
import { formatReading } from "@/lib/atlas/readings";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { decodeSet, encodeSet } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import { meaningLabel, toQuizCandidate } from "@/components/Study/session";
import { useSearchIndex } from "@/components/Study/useSearchIndex";
import { INITIAL_PROJECTOR, keyDirection, projectorKey, projectorReducer } from "./projector-state";
import { StrokeGlyph } from "./StrokeGlyph";
import { radicalStrokes } from "./strokes";
import type { TeachRadical } from "./types";
import { useKanjiStrokes } from "./useTeachData";

const EMPTY: string[] = [];
const LETTERS = ["A", "B", "C", "D"];

const subscribeFullscreen = (onChange: () => void) => {
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
};

/** Calls a Fullscreen API method that may be missing or (in old browsers) return nothing. */
const quietly = (call: (() => Promise<void> | void) | undefined) => {
    try {
        Promise.resolve(call?.()).catch(() => {});
    } catch {
        // Not allowed here (e.g. no user gesture): ignore.
    }
};

const projectorReadings = (entry: SearchIndexEntry | undefined) =>
    entry ? [...entry.on.slice(0, 2), ...entry.kun.slice(0, 2).map(formatReading)].join(" · ") : "";

const CONTROL =
    "inline-flex items-center gap-2 h-11 px-4 rounded-full border border-line-2 text-ink-2 hover:text-ink hover:border-ink-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** /teach/present: one kanji at a time, full screen, a stroke per key press, and a quiz for the room. */
export function ProjectorClient({ radicals }: { radicals: TeachRadical[] }) {
    const params = useSearchParams();
    const router = useRouter();
    const rootRef = useRef<HTMLDivElement>(null);
    const openedRef = useRef(false);
    const { entries, byChar, error, retry } = useSearchIndex();

    const set = useMemo(() => decodeSet(params, byChar ? (c) => byChar.has(c) : undefined), [params, byChar]);
    const chars = byChar ? set.chars : EMPTY;
    const count = chars.length;
    const strokes = useKanjiStrokes(chars);
    const [state, dispatch] = useReducer(projectorReducer, INITIAL_PROJECTOR);

    const radicalOf = useMemo(() => {
        const map = new Map<string, TeachRadical>();
        for (const r of radicals) for (const c of r.chars) map.set(c, r);
        return map;
    }, [radicals]);
    const themeOf = useCallback((char: string) => {
        const theme = radicalOf.get(char)?.theme ?? -1;
        return theme >= 0 ? CATEGORIES[theme] : null;
    }, [radicalOf]);

    const char = chars[Math.min(state.index, Math.max(0, count - 1))] as string | undefined;
    const entry = char ? byChar?.get(char) : undefined;
    const glyph = char ? strokes.data.get(char) ?? null : null;
    const total = strokes.ready ? glyph?.strokes.length ?? 0 : null;
    const radical = char ? radicalOf.get(char) ?? null : null;

    const pool = useMemo(() => (entries ? entries.map((e) => toQuizCandidate(e, themeOf(e.c))) : []), [entries, themeOf]);
    const options = useMemo(() => {
        if (!entry || state.quiz === "off") return [];
        return buildMeaningOptions(toQuizCandidate(entry, themeOf(entry.c)), pool);
    }, [entry, pool, themeOf, state.quiz]);
    const answer = entry ? meaningLabel(entry.m) : "";

    const fullscreen = useSyncExternalStore(subscribeFullscreen, () => document.fullscreenElement !== null, () => false);
    // iPhone Safari has no Fullscreen API for pages: hide the button there.
    const canFullscreen = useSyncExternalStore(subscribeFullscreen, () => document.fullscreenEnabled === true, () => true);

    useEffect(() => {
        if (count === 0 || openedRef.current) return;
        openedRef.current = true;
        trackEvent("projector_opened", { count });
    }, [count]);

    // The overlay owns the screen: no page scrolling underneath.
    useEffect(() => {
        const root = document.documentElement;
        const previous = root.style.overflow;
        root.style.overflow = "hidden";
        rootRef.current?.focus();
        return () => {
            root.style.overflow = previous;
        };
    }, []);

    const toggleFullscreen = useCallback(() => {
        const root = rootRef.current;
        if (document.fullscreenElement) quietly(document.exitFullscreen?.bind(document));
        else quietly(root?.requestFullscreen?.bind(root));
    }, []);

    const exit = useCallback(() => {
        if (document.fullscreenElement) quietly(document.exitFullscreen?.bind(document));
        const cameFromSite = document.referrer.startsWith(window.location.origin) && window.history.length > 1;
        if (cameFromSite) router.back();
        else router.push(set.chars.length ? `/teach?${encodeSet(set)}` : "/teach");
    }, [router, set]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const target = e.target as HTMLElement | null;
            // Let focused buttons and links handle their own activation keys.
            if ((e.key === " " || e.key === "Enter") && target?.closest("button, a, input, select, textarea")) return;
            const command = projectorKey(e.key, state.quiz);
            if (!command) return;
            e.preventDefault();
            switch (command) {
                case "exit":
                    exit();
                    break;
                case "fullscreen":
                    toggleFullscreen();
                    break;
                case "advance":
                    dispatch({ type: "advance", total, count });
                    break;
                case "go":
                    dispatch({ type: "go", delta: keyDirection(e.key), count });
                    break;
                case "show-all":
                    dispatch({ type: "show-all", total });
                    break;
                default:
                    dispatch({ type: command });
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [state.quiz, total, count, exit, toggleFullscreen]);

    /** Mouse clicks hand focus back to the stage, so Space keeps drawing strokes. */
    const refocus = (e: React.MouseEvent) => {
        if (e.detail > 0) rootRef.current?.focus();
    };

    const color = getThemeColor(char ? themeOf(char) : null);
    const highlight = state.quiz === "revealed" ? radicalStrokes(glyph, radical?.char) : null;
    const position = count > 0 ? `${state.index + 1} / ${count}` : "";

    let status = "";
    if (char) {
        if (state.quiz === "asking") status = `Question ${state.index + 1} of ${count}. What does it mean?`;
        else if (state.quiz === "revealed") status = `Answer: ${answer}`;
        else if (total !== null) status = state.drawn === 0 ? `${char}, kanji ${position}` : `Stroke ${state.drawn} of ${total}`;
    }

    return (
        <div
            ref={rootRef}
            tabIndex={-1}
            aria-label="Projector"
            role="region"
            className="fixed inset-0 z-[70] flex flex-col bg-bg text-ink outline-none overflow-hidden"
            style={{ "--tc": color } as React.CSSProperties}
        >
            <header className="flex items-center gap-2 sm:gap-3 px-[3vw] pt-[2.5vh]">
                <p className="flex-1 min-w-0 truncate font-disp text-[clamp(1.1rem,1.8vw,1.9rem)] font-semibold text-ink-2">
                    {set.title || "Kanji set"}
                </p>
                <button
                    type="button"
                    onClick={(e) => {
                        dispatch({ type: "toggle-quiz" });
                        refocus(e);
                    }}
                    aria-pressed={state.quiz !== "off"}
                    aria-keyshortcuts="Q"
                    aria-label="Quiz the class"
                    disabled={count === 0}
                    className={cn(CONTROL, "aria-pressed:bg-ink aria-pressed:text-bg aria-pressed:border-ink disabled:opacity-40")}
                >
                    <MessageCircleQuestion size={18} aria-hidden /> <span className="hidden sm:inline" aria-hidden>Quiz</span>
                </button>
                {canFullscreen && (
                    <button
                        type="button"
                        onClick={(e) => {
                            toggleFullscreen();
                            refocus(e);
                        }}
                        aria-keyshortcuts="F"
                        aria-label={fullscreen ? "Exit full screen" : "Full screen"}
                        className={CONTROL}
                    >
                        {fullscreen ? <Minimize size={18} aria-hidden /> : <Maximize size={18} aria-hidden />}
                        <span className="hidden sm:inline" aria-hidden>{fullscreen ? "Exit full screen" : "Full screen"}</span>
                    </button>
                )}
                <button type="button" onClick={exit} aria-keyshortcuts="Escape" aria-label="Exit" className={CONTROL}>
                    <X size={18} aria-hidden /> <span className="hidden sm:inline" aria-hidden>Exit</span>
                </button>
            </header>

            {error ? (
                <div role="alert" className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-2">
                    <p className="text-xl text-ink">Couldn’t load kanji details.</p>
                    <button type="button" onClick={retry} className={CONTROL}>Try again</button>
                </div>
            ) : !byChar ? (
                <p className="flex-1 flex items-center justify-center text-ink-3 text-xl">Loading…</p>
            ) : !char || !entry ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-2">
                    <p className="text-xl text-ink">This link has no kanji to present.</p>
                    <Link href="/teach" className="text-accent hover:underline">Build a set</Link>
                </div>
            ) : (
                <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center content-center gap-[3vh] md:gap-[4vw] px-[5vw] py-[2vh]">
                    {/* Clicking the kanji draws the next stroke; keyboard users press Space. */}
                    <div onClick={() => dispatch({ type: "advance", total, count })} className="justify-self-center cursor-pointer select-none">
                        {glyph ? (
                            <StrokeGlyph
                                key={char}
                                strokes={glyph.strokes}
                                drawn={state.drawn}
                                plain={state.quiz === "asking"}
                                highlight={highlight}
                                label={state.quiz === "off" ? `${char}, ${state.drawn} of ${glyph.strokes.length} strokes drawn` : char}
                                className="w-[min(78vw,40vh)] md:w-[min(42vw,70vh)] aspect-square"
                            />
                        ) : (
                            <p lang="ja" className="font-jp font-extrabold leading-none text-c glow text-[min(60vw,32vh)] md:text-[min(36vw,58vh)]">
                                {char}
                            </p>
                        )}
                    </div>

                    {state.quiz === "off" ? (
                        <div className="flex flex-col gap-[2.2vh] min-w-0 text-center md:text-left">
                            <p className="font-disp font-bold leading-[1.02] text-[clamp(2.25rem,5.4vw,6.5rem)] break-words">{meaningLabel(entry.m)}</p>
                            <p lang="ja" className="font-jp font-semibold text-[clamp(1.6rem,3.4vw,4rem)] leading-tight">{projectorReadings(entry)}</p>
                            {radical && <RadicalLine radical={radical} />}
                            {total !== null && total > 0 && (
                                <p className="text-ink-3 text-[clamp(1rem,1.6vw,1.6rem)]">
                                    {state.drawn === 0 ? `${total} strokes · Space draws the first` : `Stroke ${state.drawn} of ${total}`}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-[2.4vh] min-w-0">
                            <p className="text-ink-3 text-[clamp(1rem,1.6vw,1.6rem)]">
                                Question {state.index + 1} of {count} · show of hands
                            </p>
                            <p className="font-disp font-bold leading-none text-[clamp(2rem,4.2vw,5rem)]">What does it mean?</p>
                            <ol className="grid grid-cols-1 lg:grid-cols-2 gap-[1.4vh] lg:gap-[1.2vw]">
                                {options.map((option, i) => {
                                    const correct = option === answer;
                                    const revealed = state.quiz === "revealed";
                                    return (
                                        <li
                                            key={option}
                                            className={cn(
                                                "px-[1.4vw] py-[1.4vh] min-h-[7vh] flex items-center rounded-xl border border-line-2 text-[clamp(1.15rem,2.2vw,2.6rem)] leading-tight transition-opacity",
                                                revealed && correct && "border-c text-c halo",
                                                revealed && !correct && "opacity-40",
                                            )}
                                        >
                                            <span className="font-bold mr-[.6em]">{LETTERS[i]}</span>
                                            <span className="min-w-0 break-words">{option}</span>
                                            {revealed && correct && <span className="sr-only"> (correct)</span>}
                                        </li>
                                    );
                                })}
                            </ol>
                            {state.quiz === "revealed" ? (
                                <div className="flex flex-col gap-[1vh]">
                                    <p lang="ja" className="font-jp font-semibold text-[clamp(1.4rem,2.6vw,3rem)]">{projectorReadings(entry)}</p>
                                    {radical && <RadicalLine radical={radical} />}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        dispatch({ type: "reveal" });
                                        refocus(e);
                                    }}
                                    aria-keyshortcuts="R"
                                    className="self-start inline-flex items-center h-[clamp(3rem,6vh,4.5rem)] px-[clamp(1.25rem,2vw,2.5rem)] rounded-full bg-accent text-onacc font-bold text-[clamp(1.1rem,1.8vw,2rem)] hover:bg-ink hover:text-bg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                >
                                    Reveal
                                </button>
                            )}
                        </div>
                    )}
                </main>
            )}

            <footer className="flex items-center gap-3 px-[3vw] pb-[2.5vh] text-ink-3 text-[clamp(.9rem,1.25vw,1.3rem)]">
                <button
                    type="button"
                    onClick={(e) => {
                        dispatch({ type: "go", delta: -1, count });
                        refocus(e);
                    }}
                    disabled={state.index === 0}
                    aria-label="Previous kanji"
                    aria-keyshortcuts="ArrowLeft"
                    className={cn(CONTROL, "px-3 disabled:opacity-40")}
                >
                    <ChevronLeft size={20} aria-hidden />
                </button>
                <p className="flex-1 min-w-0 text-center md:text-left">
                    {position && <span className="text-ink-2 font-medium">{position}</span>}
                    <span className="hidden md:inline">
                        {" "}· Space: {state.quiz === "off" ? "next stroke" : state.quiz === "asking" ? "reveal" : "next question"} · → next kanji · Q:{" "}
                        {state.quiz === "off" ? "quiz the class" : "back to strokes"} · Esc: {state.quiz === "off" ? "exit" : "close quiz"}
                    </span>
                </p>
                <button
                    type="button"
                    onClick={(e) => {
                        dispatch({ type: "advance", total, count });
                        refocus(e);
                    }}
                    disabled={count === 0}
                    className={cn(CONTROL, "md:hidden disabled:opacity-40")}
                >
                    {state.quiz === "asking" ? "Reveal" : "Next stroke"}
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        dispatch({ type: "go", delta: 1, count });
                        refocus(e);
                    }}
                    disabled={state.index >= count - 1}
                    aria-label="Next kanji"
                    aria-keyshortcuts="ArrowRight"
                    className={cn(CONTROL, "px-3 disabled:opacity-40")}
                >
                    <ChevronRight size={20} aria-hidden />
                </button>
            </footer>

            <p aria-live="polite" className="sr-only">{status}</p>
        </div>
    );
}

function RadicalLine({ radical }: { radical: TeachRadical }) {
    return (
        <p className="text-ink-2 text-[clamp(1.1rem,1.9vw,2.2rem)]">
            Radical{" "}
            <span lang="ja" className="font-jp font-extrabold text-c glow text-[1.3em] leading-none">
                {radical.char}
            </span>{" "}
            {radical.meaning}
        </p>
    );
}
