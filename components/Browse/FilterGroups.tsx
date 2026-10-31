"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, THEME_SHORT, getCategorySlug } from "@/lib/atlas/categories";
import type { JlptLevel } from "@/lib/atlas/types";
import { SHADES, SHADE_JP, SHADE_NAMES, type Shade } from "@/lib/ink";
import { Chip } from "@/components/ui/Chip";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { ALL_LEVELS, MAX_STROKES, MIN_STROKES, THEME_SLUGS, parseReading, type LevelCounts } from "./filters";
import { matchRadicals, radicalLabel, type RadicalOption } from "./radicals";

// The Browse rail's filter groups. Each one is a small controlled component
// (value + onChange) so other rails (Teach's "Add from") can pick the ones they need.

const fmt = (n: number) => n.toLocaleString("en-US");

const FIELD =
    "h-10 w-full min-w-0 rounded-full border border-line-2 bg-card px-3.5 text-sm text-ink placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden";

/** A fieldset with a type-label legend. */
export function FilterGroup({ legend, children, className }: { legend: ReactNode; children: ReactNode; className?: string }) {
    return (
        <fieldset className={cn("m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0", className)}>
            <legend className="type-label mb-2.5 p-0">{legend}</legend>
            {children}
        </fieldset>
    );
}

/** All + N5…N1, several at once. `counts` (optional) shows what each chip would give. */
export function JlptFilter({ value, counts, onChange }: { value: JlptLevel[]; counts?: LevelCounts; onChange: (value: JlptLevel[]) => void }) {
    const toggle = (level: JlptLevel) => {
        const set = new Set(value);
        if (set.has(level)) set.delete(level);
        else set.add(level);
        const next = ALL_LEVELS.filter((l) => set.has(l));
        onChange(next.length === ALL_LEVELS.length ? [] : next);
    };
    return (
        <FilterGroup legend="JLPT level">
            <div className="flex flex-wrap gap-2">
                <Chip pressed={value.length === 0} onClick={() => onChange([])} count={counts && fmt(counts.all)}>
                    All
                </Chip>
                {ALL_LEVELS.map((level) => (
                    <Chip key={level} pressed={value.includes(level)} onClick={() => toggle(level)} count={counts && fmt(counts[level])}>
                        {level}
                    </Chip>
                ))}
            </div>
        </FilterGroup>
    );
}

/** The ten themes, each with its dot; several at once. Values are theme slugs. */
export function ThemeFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
    const toggle = (slug: string) => {
        const set = new Set(value);
        if (set.has(slug)) set.delete(slug);
        else set.add(slug);
        onChange(THEME_SLUGS.filter((s) => set.has(s)));
    };
    return (
        <FilterGroup legend="Theme">
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((name) => {
                    const slug = getCategorySlug(name);
                    return (
                        <Chip key={slug} theme={name} pressed={value.includes(slug)} onClick={() => toggle(slug)} aria-label={name}>
                            {THEME_SHORT[name]}
                        </Chip>
                    );
                })}
            </div>
        </FilterGroup>
    );
}

/** Five swatches, 白 淡 中 濃 印, as toggles. */
export function InkFilter({ value, onChange }: { value: Shade[]; onChange: (value: Shade[]) => void }) {
    const toggle = (shade: Shade) => {
        const set = new Set(value);
        if (set.has(shade)) set.delete(shade);
        else set.add(shade);
        const next = SHADES.filter((s) => set.has(s));
        onChange(next.length === SHADES.length ? [] : next);
    };
    return (
        <FilterGroup legend="Your ink">
            <div className="grid grid-cols-5 gap-1.5">
                {SHADES.map((shade) => (
                    <button
                        key={shade}
                        type="button"
                        aria-pressed={value.includes(shade)}
                        aria-label={`${SHADE_JP[shade]} ${SHADE_NAMES[shade]}`}
                        title={SHADE_NAMES[shade]}
                        onClick={() => toggle(shade)}
                        className="w-full min-w-0 cursor-pointer rounded-[11px] border-2 border-transparent p-[3px] transition-colors hover:border-line-2 aria-pressed:border-ink"
                    >
                        <span lang="ja" data-ink={shade} className="flex h-[38px] items-center justify-center rounded-lg border font-jp text-base font-extrabold">
                            {SHADE_JP[shade]}
                        </span>
                    </button>
                ))}
            </div>
        </FilterGroup>
    );
}

function StrokeField({ label, name, value, onCommit, valid }: { label: string; name: string; value: number; onCommit: (n: number) => void; valid: (n: number) => boolean }) {
    const [text, setText] = useState(String(value));
    const [shown, setShown] = useState(value);
    // Follow the URL when it changes from elsewhere (Clear all, a removed tag).
    if (shown !== value) {
        setShown(value);
        setText(String(value));
    }
    const parse = (raw: string) => {
        const n = Number.parseInt(raw, 10);
        return Number.isFinite(n) && n >= MIN_STROKES && n <= MAX_STROKES ? n : null;
    };
    const settle = () => {
        const n = parse(text);
        if (n !== null && n !== value) onCommit(n);
        else setText(String(value));
    };
    return (
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-line-2 bg-card px-3 focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-ink">
            <span className="text-xs text-ink-3">{label}</span>
            <input
                type="number"
                inputMode="numeric"
                min={MIN_STROKES}
                max={MAX_STROKES}
                aria-label={name}
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    // Commit while typing only when it keeps the range in order; blur settles the rest.
                    const n = parse(e.target.value);
                    if (n !== null && valid(n)) onCommit(n);
                }}
                onBlur={settle}
                onKeyDown={(e) => {
                    if (e.key === "Enter") settle();
                }}
                className="w-full min-w-0 bg-transparent text-sm text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
        </label>
    );
}

/** From / to stroke counts. `onChange` gets the bound that moved. */
export function StrokeFilter({ min, max, onChange }: { min: number; max: number; onChange: (patch: { minStrokes?: number; maxStrokes?: number }) => void }) {
    return (
        <FilterGroup legend="Strokes">
            <div className="flex items-center gap-2.5">
                <StrokeField label="from" name="Fewest strokes" value={min} valid={(n) => n <= max} onCommit={(n) => onChange({ minStrokes: n })} />
                <StrokeField label="to" name="Most strokes" value={max} valid={(n) => n >= min} onCommit={(n) => onChange({ maxStrokes: n })} />
            </div>
        </FilterGroup>
    );
}

/** A box that narrows the seals below it; pressing a seal picks that radical. */
export function RadicalFilter({
    radicals,
    value,
    onChange,
    limit = 5,
}: {
    radicals: readonly RadicalOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    /** Seals shown with an empty box; a search shows up to twice as many. */
    limit?: number;
}) {
    const [query, setQuery] = useState("");
    const shown = useMemo(() => matchRadicals(radicals, query, query.trim() ? limit * 2 : limit, value), [radicals, query, limit, value]);
    const hintId = useId();
    const noMatch = query.trim() !== "" && shown.every((r) => r.key === value);
    return (
        <FilterGroup legend="Radical">
            <input
                type="search"
                value={query}
                placeholder="木, tree or ki"
                aria-label="Find a radical"
                aria-describedby={noMatch ? hintId : undefined}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    const best = shown.find((r) => r.key !== value);
                    if (query.trim() && best) onChange(best.key);
                }}
                className={FIELD}
            />
            {shown.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] justify-items-center gap-1">
                    {shown.map((r) => (
                        <span key={r.key} title={radicalLabel(r)} className="inline-flex">
                            <RadicalSeal
                                char={r.char}
                                size="md"
                                category={r.category}
                                pressed={r.key === value}
                                onClick={() => onChange(r.key === value ? null : r.key)}
                                label={`${radicalLabel(r)}, ${fmt(r.count)} kanji`}
                                // A round focus ring around the round seal.
                                className="rounded-full"
                            />
                        </span>
                    ))}
                </div>
            )}
            {noMatch && (
                <p id={hintId} className="text-xs text-ink-3">
                    No radical matches “{query.trim()}”.
                </p>
            )}
        </FilterGroup>
    );
}

/** A reading in kana or romaji. Applies after a short pause or on Enter. */
export function ReadingFilter({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
    const [text, setText] = useState(value ?? "");
    const [shown, setShown] = useState(value);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hintId = useId();
    if (shown !== value) {
        setShown(value);
        if (parseReading(text) !== value) setText(value ?? "");
    }
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);
    const commit = (raw: string) => {
        if (timer.current) clearTimeout(timer.current);
        const next = parseReading(raw);
        if (next !== value) onChange(next);
    };
    const invalid = text.trim() !== "" && parseReading(text) === null;
    return (
        <FilterGroup legend="Reading">
            <input
                type="search"
                value={text}
                placeholder="セイ, sei or やす"
                aria-label="Reading"
                aria-describedby={invalid ? hintId : undefined}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => {
                    const raw = e.target.value;
                    setText(raw);
                    if (timer.current) clearTimeout(timer.current);
                    timer.current = setTimeout(() => commit(raw), 400);
                }}
                onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    commit(text);
                }}
                className={FIELD}
            />
            {invalid && (
                <p id={hintId} className="text-xs text-ink-3">
                    Type a reading in kana or romaji.
                </p>
            )}
        </FilterGroup>
    );
}

/**
 * The rail's body. On desktop it is always open; below lg it folds behind a
 * "Filters · N on" button so the grid stays near the top. Sits directly in
 * Tool's rail card (22px padding), which the button fills edge to edge.
 */
export function FilterPanel({ activeCount, children, label = "Filters" }: { activeCount: number; children: ReactNode; label?: string }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    return (
        <>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((o) => !o)}
                className="-m-[22px] flex cursor-pointer items-center gap-2.5 rounded-2xl p-[22px] text-left text-ink lg:hidden"
            >
                <SlidersHorizontal aria-hidden className="size-[18px] flex-none text-ink-2" />
                <span className="text-[15px] font-bold">{label}</span>
                {activeCount > 0 && <span className="text-sm text-ink-2">· {activeCount} on</span>}
                <ChevronDown aria-hidden className={cn("ml-auto size-[18px] flex-none text-ink-2 transition-transform motion-reduce:transition-none", open && "rotate-180")} />
            </button>
            <div id={id} className={cn("min-w-0 flex-col gap-[26px] lg:flex", open ? "flex" : "hidden")}>
                {children}
            </div>
        </>
    );
}
