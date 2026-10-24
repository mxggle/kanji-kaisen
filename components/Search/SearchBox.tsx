"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { kanjiPath, searchPath } from "@/lib/atlas/paths";
import { formatReading } from "@/lib/atlas/readings";
import { searchKanji, type SearchIndexEntry } from "@/lib/atlas/search";
import { loadSearchIndex } from "@/lib/atlas/search-index";
import { trackEvent } from "@/lib/analytics";
import type { JlptLevel } from "@/lib/atlas/types";
import { jlptColor } from "@/components/Atlas/JlptBadge";

export interface SearchBoxProps {
    /** "hero" for the big home-page box, "compact" for the header. Default "compact". */
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
}

type IndexState = { status: "idle" | "loading" | "error" } | { status: "ready"; index: SearchIndexEntry[] };

/** Kanji search with an instant-results dropdown. The slim index loads on first focus or keystroke. */
export function SearchBox({
    variant = "compact",
    defaultValue = "",
    placeholder = "Search kanji, meaning or reading…",
    autoFocus,
    limit = 8,
    className,
    onNavigate,
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

    return (
        <form
            role="search"
            action="/search"
            method="get"
            className={cn("relative w-full", className)}
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <label htmlFor={`${id}-input`} className="sr-only">Search kanji</label>
            <div className="relative group">
                <Search
                    aria-hidden
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[var(--accent)] transition-colors pointer-events-none",
                        hero ? "left-4 w-5 h-5" : "left-3 w-4 h-4",
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
                    placeholder={placeholder}
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
                        "w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:bg-white/10 transition-all [&::-webkit-search-cancel-button]:hidden",
                        hero ? "rounded-xl py-4 pl-12 pr-4 text-lg" : "rounded-md py-2 pl-9 pr-3 text-sm",
                    )}
                />
            </div>

            <div
                className={cn(
                    "absolute left-0 right-0 mt-2 z-50 rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur shadow-2xl overflow-hidden",
                    !showDropdown && "hidden",
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
                                    "flex items-center gap-3 px-3 py-2 cursor-pointer",
                                    i === active ? "bg-white/10" : "hover:bg-white/5",
                                )}
                            >
                                <span className="w-10 text-center text-2xl font-bold font-japanese text-white shrink-0">{e.c}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm text-white truncate">{e.m.slice(0, 3).join(", ")}</span>
                                    {reading && <span className="block text-xs text-white/50 font-japanese truncate">{formatReading(reading)}</span>}
                                </span>
                                <span className="text-[10px] font-bold shrink-0" style={{ color: jlptColor(level) }}>{level}</span>
                            </li>
                        );
                    })}
                </ul>
                {indexState.status === "loading" && (
                    <p className="flex items-center gap-2 px-3 py-3 text-sm text-white/50">
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading…
                    </p>
                )}
                {indexState.status === "error" && (
                    <p className="px-3 py-3 text-sm text-white/50">Instant results are unavailable. Press Enter to search.</p>
                )}
                {indexState.status === "ready" && results.length === 0 && (
                    <p className="px-3 py-3 text-sm text-white/50">No kanji match “{trimmed}”.</p>
                )}
                <button
                    type="button"
                    onClick={() => go(searchPath(trimmed))}
                    className="block w-full text-left px-3 py-2 text-xs text-[var(--accent)] border-t border-white/10 hover:bg-white/5"
                >
                    See all results for “{trimmed}”{!activeResult && <span className="text-white/40"> (Enter)</span>}
                </button>
            </div>
            <div aria-live="polite" className="sr-only">
                {showDropdown && indexState.status === "ready" ? `${results.length} suggestions` : ""}
            </div>
        </form>
    );
}
