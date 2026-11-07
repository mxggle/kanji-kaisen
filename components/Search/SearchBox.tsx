"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { kanjiPath, searchPath } from "@/lib/atlas/paths";
import { formatReading } from "@/lib/atlas/readings";
import { searchKanji, type SearchIndexEntry } from "@/lib/atlas/search";
import { loadSearchIndex } from "@/lib/atlas/search-index";
import { trackEvent } from "@/lib/analytics";
import type { JlptLevel } from "@/lib/atlas/types";

export interface SearchBoxProps {
    /** "hero" for the big home-page box (a 60px pill, 52 on phones, at most 640 wide), "compact" for the header. Default "compact". */
    variant?: "hero" | "compact";
    /** Initial query (e.g. the current `q` on /search). */
    defaultValue?: string;
    placeholder?: string;
    autoFocus?: boolean;
    /** Max dropdown suggestions. Default 8. */
    limit?: number;
    className?: string;
    /** Called after the box navigates (result picked or query submitted), e.g. to close a mobile menu. */
    onNavigate?: () => void;
    /**
     * Keyboard hint at the right of an empty box (the header's "/"). On a hero
     * box (desktop only) "/" also focuses it when the header search isn't shown.
     */
    shortcut?: string;
}

type IndexState = { status: "idle" | "loading" | "error" } | { status: "ready"; index: SearchIndexEntry[] };

/** Kanji search with an instant-results dropdown. The slim index loads on first focus or keystroke. */
export function SearchBox({
    variant = "compact",
    defaultValue = "",
    placeholder,
    autoFocus,
    limit = 8,
    className,
    onNavigate,
    shortcut,
}: SearchBoxProps) {
    const router = useRouter();
    const id = useId();
    const listboxId = `${id}-listbox`;
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(defaultValue);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [indexState, setIndexState] = useState<IndexState>({ status: "idle" });

    const ensureIndex = () => {
        if (indexState.status === "ready" || indexState.status === "loading") return;
        setIndexState({ status: "loading" });
        loadSearchIndex().then(
            (index) => setIndexState({ status: "ready", index }),
            () => setIndexState({ status: "error" }),
        );
    };

    const results = useMemo(
        () => (indexState.status === "ready" ? searchKanji(indexState.index, query, { limit }) : []),
        [indexState, query, limit],
    );

    const trimmed = query.trim();
    const showDropdown = open && trimmed.length > 0;
    const activeResult = active >= 0 && active < results.length ? results[active] : null;

    const go = (href: string) => {
        // Searches that land on /search are counted by that page.
        if (href.startsWith("/kanji/")) {
            trackEvent("search_performed", { query: trimmed, result_count: results.length, source: "dropdown", selected: decodeURIComponent(href.slice(7)) });
        }
        setOpen(false);
        setActive(-1);
        inputRef.current?.blur();
        router.push(href);
        onNavigate?.();
    };

    const submit = () => {
        if (activeResult) go(kanjiPath(activeResult.entry.c));
        else if (trimmed) go(searchPath(trimmed));
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return; // let the IME confirm its candidate
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setOpen(true);
                ensureIndex();
                if (results.length) setActive((i) => (i + 1) % results.length);
                break;
            case "ArrowUp":
                e.preventDefault();
                setOpen(true);
                if (results.length) setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
                break;
            case "Escape":
                if (showDropdown) {
                    e.preventDefault();
                    setOpen(false);
                    setActive(-1);
                }
                break;
        }
    };

    const hero = variant === "hero";

    // "/" focuses a hero box where the header has no search (the home page).
    useEffect(() => {
        if (!hero || shortcut !== "/") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
            const header = document.querySelector<HTMLInputElement>("[data-header-search] input");
            if (header && header.offsetParent !== null) return;
            const input = inputRef.current;
            if (!input || input.offsetParent === null) return;
            e.preventDefault();
            input.focus();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [hero, shortcut]);

    return (
        <form
            role="search"
            action="/search"
            method="get"
            className={cn("relative w-full", hero && "max-w-[640px]", className)}
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <label htmlFor={`${id}-input`} className="sr-only">Search kanji</label>
            {/*
              Focus: the ring closes in from a wider offset as it inks, the border
              darkens, the magnifier comes forward and the "/" hint steps back.
              Only existing lines move (rule 2); no colour is added.
            */}
            <div className="relative group">
                <Search
                    aria-hidden
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-ink-3 group-focus-within:text-ink group-focus-within:scale-[1.08] transition-[color,scale] duration-(--dur-ui) ease-(--ease-out) motion-reduce:transition-none pointer-events-none",
                        hero ? "left-4 size-[18px] lg:left-[22px] lg:size-[22px]" : "left-3.5 size-[18px]",
                    )}
                />
                <input
                    ref={inputRef}
                    id={`${id}-input`}
                    name="q"
                    type="search"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    aria-activedescendant={showDropdown && activeResult ? `${id}-opt-${active}` : undefined}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="search"
                    autoFocus={autoFocus}
                    value={query}
                    placeholder={placeholder ?? "water, みず, mizu or 水"}
                    onFocus={() => {
                        ensureIndex();
                        setOpen(true);
                    }}
                    onBlur={() => setOpen(false)}
                    onChange={(e) => {
                        ensureIndex();
                        setQuery(e.target.value);
                        setOpen(true);
                        setActive(-1);
                    }}
                    onKeyDown={onKeyDown}
                    className={cn(
                        "w-full bg-card border border-line-2 rounded-full text-ink placeholder:text-ink-3 focus:border-ink [&::-webkit-search-cancel-button]:hidden",
                        "outline-2 outline-offset-[7px] outline-transparent focus-visible:outline-offset-[3px] focus-visible:outline-ink",
                        "transition-[border-color,outline-color,outline-offset] duration-(--dur-ui) ease-(--ease-out) motion-reduce:transition-none",
                        hero ? "h-13 pl-11 pr-4 text-base lg:h-15 lg:pl-[54px] lg:pr-12 lg:text-lg" : "h-10 pl-10 pr-10 text-sm",
                    )}
                />
                {shortcut && !query && (
                    <kbd
                        aria-hidden
                        className={cn(
                            "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-[5px] border border-line-2 px-1.5 font-ui text-[11px] leading-[18px] text-ink-3",
                            "transition-opacity duration-(--dur-micro) group-focus-within:opacity-0",
                            hero ? "right-4 max-lg:hidden" : "right-2.5",
                        )}
                    >
                        {shortcut}
                    </kbd>
                )}
            </div>

            {/* Opens from just under the box (scale and fade, --dur-ui); closes in half the time. */}
            <div
                className={cn(
                    "absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-line-2 bg-card overflow-hidden",
                    "origin-top transition-[opacity,scale,translate,display] transition-discrete motion-reduce:transition-none",
                    showDropdown
                        ? "duration-(--dur-ui) ease-(--ease-out) starting:opacity-0 starting:scale-[.97] starting:-translate-y-1"
                        : "hidden opacity-0 scale-[.98] duration-[120ms] ease-(--ease-in)",
                )}
                // Keep focus in the input while clicking inside the dropdown.
                onMouseDown={(e) => e.preventDefault()}
            >
                <ul id={listboxId} role="listbox" aria-label="Kanji suggestions" className="max-h-[min(24rem,60vh)] overflow-y-auto py-1">
                    {results.map((r, i) => {
                        const e = r.entry;
                        const level = `N${e.j}` as JlptLevel;
                        const reading = e.kun[0] ?? e.on[0];
                        return (
                            <li
                                key={e.c}
                                id={`${id}-opt-${i}`}
                                role="option"
                                aria-selected={i === active}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => go(kanjiPath(e.c))}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-(--dur-micro)",
                                    i === active ? "bg-ink/10" : "hover:bg-ink/5",
                                )}
                            >
                                <span lang="ja" className="w-10 shrink-0 text-center font-jp text-2xl font-extrabold text-ink">{e.c}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm text-ink truncate">{e.m.slice(0, 3).join(", ")}</span>
                                    {reading && <span lang="ja" className="block truncate font-jp text-xs text-ink-3">{formatReading(reading)}</span>}
                                </span>
                                {/* JLPT as plain text (rule 1). */}
                                <span className="shrink-0 text-[11px] text-ink-3">{level}</span>
                            </li>
                        );
                    })}
                </ul>
                {indexState.status === "loading" && (
                    <p className="flex items-center gap-2 px-3 py-3 text-sm text-ink-3">
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading…
                    </p>
                )}
                {indexState.status === "error" && (
                    <p className="px-3 py-3 text-sm text-ink-3">Instant results are unavailable. Press Enter to search.</p>
                )}
                {indexState.status === "ready" && results.length === 0 && (
                    <p className="px-3 py-3 text-sm text-ink-3">No kanji match “{trimmed}”.</p>
                )}
                <button
                    type="button"
                    onClick={() => go(searchPath(trimmed))}
                    className="block w-full cursor-pointer border-t border-line px-3 py-2.5 text-left text-xs text-ink-2 hover:bg-ink/5 hover:text-ink"
                >
                    See all results for “{trimmed}”{!activeResult && <span className="text-ink-3"> (Enter)</span>}
                </button>
            </div>
            <div aria-live="polite" className="sr-only">
                {showDropdown && indexState.status === "ready" ? `${results.length} suggestions` : ""}
            </div>
        </form>
    );
}
