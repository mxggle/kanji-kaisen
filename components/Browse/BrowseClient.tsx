"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { getShade } from "@/lib/ink";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { Tool } from "@/components/Layout/Tool";
import { Button } from "@/components/ui/Button";
import { InkLegend, InkSwatch } from "@/components/ui/InkLegend";
import { Tag } from "@/components/ui/Tag";
import { FilterPanel, InkFilter, JlptFilter, RadicalFilter, ReadingFilter, StrokeFilter, ThemeFilter } from "./FilterGroups";
import { TileGrid } from "./TileGrid";
import {
    DEFAULT_FILTERS,
    PAGE_SIZE,
    SORTS,
    applyBrowseFilters,
    filterTags,
    levelCounts,
    parseBrowseParams,
    setTitle,
    studyLink,
    teachLink,
    themeName,
    toBrowseQuery,
    withStrokes,
    type BrowseFilters,
    type BrowseKanji,
    type BrowseSort,
    type FilterTag,
} from "./filters";
import { radicalLabel, type RadicalOption } from "./radicals";

interface BrowseClientProps {
    items: BrowseKanji[];
    initialFilters: BrowseFilters;
    radicals: RadicalOption[];
}

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Client island for /browse. The server renders it with filters parsed from the URL,
 * so the first page of results is in the HTML; later changes filter in memory and
 * rewrite the query string without a server round trip. The ink filter waits for
 * the ink store: until it hydrates every kanji shows, with the swatches still pressed.
 */
export function BrowseClient({ items, initialFilters, radicals }: BrowseClientProps) {
    // The URL is the source of truth: Next.js keeps useSearchParams in sync with
    // history.replaceState and with Back/Forward, which restore a cached tree
    // whose initial props may belong to a different query.
    const searchParams = useSearchParams();
    const filters = useMemo(
        () => (searchParams ? parseBrowseParams(Object.fromEntries(searchParams.entries())) : initialFilters),
        [searchParams, initialFilters],
    );
    const [visible, setVisible] = useState(PAGE_SIZE);

    const hydrated = useInkHydrated();
    const entries = useInkStore((state) => state.entries);
    const inkOn = hydrated && filters.ink.length > 0;
    const shadeOf = useMemo(() => (inkOn ? (char: string) => getShade(entries, char) : undefined), [inkOn, entries]);

    const results = useMemo(() => applyBrowseFilters(items, filters, { shadeOf }), [items, filters, shadeOf]);
    const counts = useMemo(() => levelCounts(items, filters, { shadeOf }), [items, filters, shadeOf]);

    const radicalByKey = useMemo(() => new Map(radicals.map((r) => [r.key, r])), [radicals]);
    const nameRadical = useCallback(
        (key: string) => {
            const r = radicalByKey.get(key);
            return r ? radicalLabel(r) : null;
        },
        [radicalByKey],
    );
    const tags = filterTags(filters, nameRadical);
    const chars = useMemo(() => results.map((k) => k.char), [results]);
    const title = setTitle(filters, nameRadical);
    const study = studyLink(filters, chars, title);
    const sheet = teachLink(chars, title);
    const none = results.length === 0;

    const shown = useMemo(
        () => results.slice(0, visible).map((k) => ({ char: k.char, meanings: k.meanings, onyomi: k.onyomi, kunyomi: k.kunyomi, category: themeName(k.theme) })),
        [results, visible],
    );

    const replace = (next: BrowseFilters) => {
        setVisible(PAGE_SIZE);
        // Next.js syncs native history updates with the router; no server round trip.
        window.history.replaceState(null, "", `/browse${toBrowseQuery(next)}`);
    };
    const update = (patch: Partial<BrowseFilters>) => replace({ ...filters, ...patch });
    const clearAll = () => replace({ ...DEFAULT_FILTERS, sort: filters.sort });

    return (
        <Tool
            jp="探す"
            kind="Browse"
            title={`Browse ${fmt(items.length)} kanji`}
            lede="Filter by what you know about a kanji. Everything combines, and the address keeps your filters so you can share them."
            actions={
                <>
                    <Button variant="quiet" href={sheet.href} prefetch={false} aria-disabled={none || undefined} tabIndex={none ? -1 : undefined}>
                        Make a worksheet
                    </Button>
                    <Button variant="primary" href={study.href} prefetch={false} aria-disabled={none || undefined} tabIndex={none ? -1 : undefined}>
                        {study.capped ? `Study the first ${study.count}` : `Study these ${fmt(study.count)}`}
                    </Button>
                </>
            }
            // The rail is taller than a laptop screen: let it scroll inside its sticky card.
            className="lg:[&_aside]:max-h-[calc(100dvh-3rem)] lg:[&_aside]:overflow-y-auto lg:[&_aside]:overscroll-contain"
            rail={
                <FilterPanel activeCount={tags.length}>
                    <JlptFilter value={filters.jlpt} counts={counts} onChange={(jlpt) => update({ jlpt })} />
                    <ThemeFilter value={filters.themes} onChange={(themes) => update({ themes })} />
                    <InkFilter value={filters.ink} onChange={(ink) => update({ ink })} />
                    <StrokeFilter min={filters.minStrokes} max={filters.maxStrokes} onChange={(patch) => replace(withStrokes(filters, patch))} />
                    <RadicalFilter radicals={radicals} value={filters.radical} onChange={(radical) => update({ radical })} />
                    <ReadingFilter value={filters.reading} onChange={(reading) => update({ reading })} />
                    <Button variant="quiet" size="sm" onClick={clearAll} disabled={tags.length === 0} className="self-start px-0">
                        Clear all filters
                    </Button>
                </FilterPanel>
            }
        >
            <section aria-label="Results" className="flex flex-col gap-[18px]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                    <p aria-live="polite" className="text-[17px] font-bold leading-snug text-ink">
                        {fmt(results.length)} kanji
                    </p>
                    {tags.length > 0 && (
                        <ul aria-label="Active filters" className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <li key={tag.key}>
                                    <RemovableTag tag={tag} onRemove={() => replace(tag.without)} />
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:ml-auto">
                        <label className="flex items-center gap-2 text-sm text-ink-2">
                            Sort
                            <select
                                value={filters.sort}
                                onChange={(e) => update({ sort: e.target.value as BrowseSort })}
                                className="h-9 cursor-pointer rounded-full border border-line-2 bg-card px-2.5 text-sm text-ink"
                            >
                                {SORTS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <InkLegend />
                    </div>
                </div>

                {none ? (
                    <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-card px-[22px] py-5">
                        <p className="text-sm text-ink-2">No kanji match all of these. Remove a filter to see more.</p>
                        {tags.length > 0 && (
                            <Button size="sm" onClick={clearAll}>
                                Clear all filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <TileGrid items={shown} label="Kanji" />
                )}

                {visible < results.length && (
                    <Button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="self-center">
                        Show more
                        <span className="font-normal text-ink-3">· {fmt(results.length - visible)} left</span>
                    </Button>
                )}
            </section>
        </Tool>
    );
}

/** An active filter as a Tag; pressing it removes that value. */
function RemovableTag({ tag, onRemove }: { tag: FilterTag; onRemove: () => void }) {
    return (
        <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove filter: ${tag.theme ?? tag.label}`}
            style={tag.theme ? themeVars(tag.theme) : undefined}
            className="group flex cursor-pointer rounded-full"
        >
            <Tag className="transition-colors group-hover:border-ink-3 group-hover:text-ink">
                {tag.theme && <span aria-hidden className="size-2 flex-none rounded-full bg-c" />}
                {tag.shade !== undefined && <InkSwatch shade={tag.shade} className="size-3 rounded-[3px]" />}
                {tag.label}
                <X aria-hidden className="size-3.5 flex-none text-ink-3 group-hover:text-ink" />
            </Tag>
        </button>
    );
}
