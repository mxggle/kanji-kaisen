"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { KanjiTileGrid } from "@/components/Atlas/KanjiTile";
import { jlptColor } from "@/components/Atlas/JlptBadge";
import type { JlptLevel } from "@/lib/atlas/types";
import {
    ALL_LEVELS,
    DEFAULT_FILTERS,
    MAX_STROKES,
    MIN_STROKES,
    PAGE_SIZE,
    SORTS,
    applyBrowseFilters,
    parseBrowseParams,
    browseHeading,
    isDefaultFilters,
    toBrowseQuery,
    type BrowseFilters,
    type BrowseKanji,
} from "./filters";

export interface BrowseOption {
    value: string;
    label: string;
}

interface BrowseClientProps {
    items: BrowseKanji[];
    initialFilters: BrowseFilters;
    themes: BrowseOption[];
    radicals: BrowseOption[];
}

const STROKE_OPTIONS = Array.from({ length: MAX_STROKES - MIN_STROKES + 1 }, (_, i) => MIN_STROKES + i);

/**
 * Client island for /browse. The server renders it with filters parsed from the URL,
 * so the first page of results is in the HTML; later changes filter in memory and
 * rewrite the query string without a server round trip.
 */
export function BrowseClient({ items, initialFilters, themes, radicals }: BrowseClientProps) {
    // The URL is the source of truth: Next.js keeps useSearchParams in sync with
    // history.replaceState and with Back/Forward, which restore a cached tree
    // whose initial props may belong to a different query.
    const searchParams = useSearchParams();
    const filters = useMemo(
        () => (searchParams ? parseBrowseParams(Object.fromEntries(searchParams.entries())) : initialFilters),
        [searchParams, initialFilters],
    );
    const [visible, setVisible] = useState(PAGE_SIZE);

    const results = useMemo(() => applyBrowseFilters(items, filters), [items, filters]);
    const shown = results.slice(0, visible);

    const update = (patch: Partial<BrowseFilters>) => {
        const next = { ...filters, ...patch };
        if (next.minStrokes > next.maxStrokes) {
            if ("minStrokes" in patch) next.maxStrokes = next.minStrokes;
            else next.minStrokes = next.maxStrokes;
        }
        setVisible(PAGE_SIZE);
        // Next.js syncs native history updates with the router; no server round trip.
        window.history.replaceState(null, "", `/browse${toBrowseQuery(next)}`);
    };

    const toggleLevel = (level: JlptLevel) => {
        const set = new Set(filters.jlpt);
        if (set.has(level)) set.delete(level);
        else set.add(level);
        const jlpt = ALL_LEVELS.filter((l) => set.has(l));
        update({ jlpt: jlpt.length === ALL_LEVELS.length ? [] : jlpt });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">{browseHeading(filters)}</h1>
            <p className="text-white/60 text-sm mb-6">
                Filter by JLPT level, stroke count, theme or radical. Every tile links to the kanji&apos;s full page.
            </p>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
                <fieldset>
                    <legend className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">JLPT level</legend>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            aria-pressed={filters.jlpt.length === 0}
                            onClick={() => update({ jlpt: [] })}
                            className={cn(
                                "h-9 px-3 rounded-full text-sm font-bold border transition-colors",
                                filters.jlpt.length === 0 ? "bg-white text-black border-white" : "border-white/20 text-white/60 hover:border-white/50",
                            )}
                        >
                            All
                        </button>
                        {ALL_LEVELS.map((level) => {
                            const active = filters.jlpt.includes(level);
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => toggleLevel(level)}
                                    className={cn(
                                        "h-9 px-3 rounded-full text-sm font-bold border-2 transition-colors",
                                        active ? "text-white" : "bg-transparent text-white/60 border-white/20 hover:border-white/50",
                                    )}
                                    style={active ? { borderColor: jlptColor(level), backgroundColor: `color-mix(in oklab, ${jlptColor(level)} 35%, transparent)` } : undefined}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Sort by</legend>
                    <div className="flex flex-wrap gap-2">
                        {SORTS.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                aria-pressed={filters.sort === s.id}
                                onClick={() => update({ sort: s.id })}
                                className={cn(
                                    "h-9 px-3 rounded-full text-sm font-medium border transition-colors",
                                    filters.sort === s.id ? "bg-white text-black border-white" : "border-white/20 text-white/60 hover:border-white/50",
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SelectField label="Min strokes" value={String(filters.minStrokes)} onChange={(v) => update({ minStrokes: Number(v) })}>
                        {STROKE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </SelectField>
                    <SelectField label="Max strokes" value={String(filters.maxStrokes)} onChange={(v) => update({ maxStrokes: Number(v) })}>
                        {STROKE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </SelectField>
                    <SelectField label="Theme" value={filters.theme ?? ""} onChange={(v) => update({ theme: v || null })}>
                        <option value="">All themes</option>
                        {themes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </SelectField>
                    <SelectField label="Radical" value={filters.radical ?? ""} onChange={(v) => update({ radical: v || null })}>
                        <option value="">All radicals</option>
                        {radicals.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </SelectField>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-6 mb-3">
                <p className="text-sm text-white/60" aria-live="polite">
                    {results.length === 0
                        ? "No kanji match these filters."
                        : `Showing ${shown.length} of ${results.length} kanji`}
                </p>
                {!isDefaultFilters(filters) && (
                    <button
                        type="button"
                        onClick={() => update(DEFAULT_FILTERS)}
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
                    >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden /> Reset filters
                    </button>
                )}
            </div>

            {results.length > 0 && <KanjiTileGrid items={shown} />}

            {visible < results.length && (
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 hover:border-[var(--accent)] text-sm font-medium transition-colors"
                    >
                        Show {Math.min(PAGE_SIZE, results.length - visible)} more
                        <span className="text-white/50"> · {results.length - visible} left</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
    return (
        <label className="block min-w-0">
            <span className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full min-w-0 h-10 rounded-md bg-neutral-900 border border-white/15 px-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
            >
                {children}
            </select>
        </label>
    );
}
