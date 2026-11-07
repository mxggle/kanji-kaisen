"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/atlas/categories";
import { RadicalFilter } from "@/components/Browse/FilterGroups";
import type { RadicalOption } from "@/components/Browse/radicals";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PROSE_LINK } from "@/components/Layout/Document";
import type { JlptLevel } from "@/lib/atlas/types";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { listSaved } from "@/lib/study-list";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { extractKanji, MAX_SET_KANJI } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import type { TeachLists } from "./types";
import { FOCUS } from "./ui";
import { enterOrder } from "@/components/Motion/tokens";
import "@/components/Browse/tool-motion.css";

export type Source = "theme" | "radical" | "jlpt" | "list" | "text";

const SOURCES: { id: Source; label: string }[] = [
    { id: "theme", label: "Theme" },
    { id: "radical", label: "Radical" },
    { id: "jlpt", label: "JLPT" },
    { id: "list", label: "My list" },
    { id: "text", label: "Paste" },
];

// Long lists (a JLPT level has up to 1,200 kanji) show this many until expanded.
const PREVIEW_COUNT = 96;

// What a choice brings up fades in at once (not at the rail's place in the page entrance).
const NOW = enterOrder(0);

/** Candidate kanji cascade in quickly, top-left first (tool-motion.css). */
const CASCADE = { "--cascade-step": "8ms" } as React.CSSProperties;

interface SourcePickerProps {
    lists: TeachLists;
    known: ReadonlySet<string>;
    inSet: ReadonlySet<string>;
    entries: Map<string, SearchIndexEntry> | null;
    onAdd: (chars: string[]) => void;
    onToggle: (char: string) => void;
}

/** "Add kanji from": theme, radical, JLPT level, My list, or typed/pasted text. */
export function SourcePicker({ lists, known, inSet, entries, onAdd, onToggle }: SourcePickerProps) {
    const [source, setSource] = useState<Source>("theme");
    const [theme, setTheme] = useState<string | null>(null);
    const [radical, setRadical] = useState<string | null>(null);
    const [level, setLevel] = useState<JlptLevel | null>(null);

    // Browse's radical filter: a box that narrows the seals, most kanji first.
    const radicalOptions = useMemo<RadicalOption[]>(
        () =>
            lists.radicals
                .map((r) => ({ key: r.key, char: r.char, name: r.name, meaning: r.meaning, count: Array.from(r.chars).length, category: r.theme >= 0 ? CATEGORIES[r.theme] : null }))
                .sort((a, b) => b.count - a.count),
        [lists.radicals],
    );

    const candidates = (chars: string, label: string) => (
        <Candidates key={label} chars={Array.from(chars)} label={label} inSet={inSet} entries={entries} onAdd={onAdd} onToggle={onToggle} />
    );

    const selectedTheme = lists.themes.find((t) => t.slug === theme);
    const selectedRadical = lists.radicals.find((r) => r.key === radical);
    const selectedLevel = lists.jlpt.find((l) => l.level === level);

    return (
        <div className="flex flex-col gap-4">
            <div role="group" aria-label="Add kanji from" className="flex flex-col gap-2.5">
                <span className="type-label" aria-hidden>Add from</span>
                <div className="flex flex-wrap gap-2">
                    {SOURCES.map((s) => (
                        <Chip key={s.id} pressed={source === s.id} onClick={() => setSource(s.id)}>
                            {s.label}
                        </Chip>
                    ))}
                </div>
            </div>

            <div className="flex flex-col">
                {source === "theme" && (
                    <div className="flex flex-col gap-3" data-enter="fade" style={NOW}>
                        <div role="group" aria-label="Themes" className="flex flex-wrap gap-1.5">
                            {lists.themes.map((t) => (
                                <Chip key={t.slug} pressed={theme === t.slug} onClick={() => setTheme(t.slug)} theme={t.name} count={Array.from(t.chars).length} className="h-8 px-3">
                                    {t.short}
                                </Chip>
                            ))}
                        </div>
                        {selectedTheme ? candidates(selectedTheme.chars, `${selectedTheme.name} theme`) : <Hint>Pick a theme to see its kanji.</Hint>}
                    </div>
                )}

                {source === "radical" && (
                    <div className="flex flex-col gap-3" data-enter="fade" style={NOW}>
                        <RadicalFilter radicals={radicalOptions} value={radical} onChange={setRadical} limit={8} />
                        {selectedRadical ? (
                            candidates(selectedRadical.chars, `Radical ${selectedRadical.char} ${selectedRadical.meaning}`)
                        ) : (
                            <Hint>Kanji that share a radical make a strong lesson: teach the radical once, then the kanji.</Hint>
                        )}
                    </div>
                )}

                {source === "jlpt" && (
                    <div className="flex flex-col gap-3" data-enter="fade" style={NOW}>
                        <div role="group" aria-label="JLPT levels" className="flex flex-wrap gap-1.5">
                            {lists.jlpt.map((l) => (
                                <Chip key={l.level} pressed={level === l.level} onClick={() => setLevel(l.level)} count={Array.from(l.chars).length} className="h-8 px-3">
                                    {l.level}
                                </Chip>
                            ))}
                        </div>
                        {selectedLevel ? candidates(selectedLevel.chars, `JLPT ${selectedLevel.level}, most common first`) : <Hint>Pick a level. Kanji are listed most common first.</Hint>}
                    </div>
                )}

                {source === "list" && <MyListSource candidates={candidates} />}

                {source === "text" && <TextSource known={known} onAdd={onAdd} />}
            </div>
        </div>
    );
}

function Hint({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm text-ink-3" data-enter="fade" style={NOW}>
            {children}
        </p>
    );
}

function MyListSource({ candidates }: { candidates: (chars: string, label: string) => React.ReactNode }) {
    const hydrated = useStudyStoreHydrated();
    const entries = useStudyStore((s) => s.entries);
    if (!hydrated) return <Hint>Loading your list…</Hint>;
    const saved = listSaved(entries);
    if (saved.length === 0) {
        return (
            <Hint>
                Kanji you save from any kanji page show up here.{" "}
                <Link href="/browse" className={PROSE_LINK}>
                    Browse kanji
                </Link>
            </Hint>
        );
    }
    return candidates(saved.join(""), "My list, newest first");
}

function TextSource({ known, onAdd }: { known: ReadonlySet<string>; onAdd: (chars: string[]) => void }) {
    const [text, setText] = useState("");
    const found = useMemo(() => extractKanji(text, known, Infinity), [text, known]);
    const skipped = useMemo(() => extractKanji(text, undefined, Infinity).length - found.length, [text, found]);

    return (
        <form
            className="flex flex-col gap-2"
            data-enter="fade"
            style={NOW}
            onSubmit={(e) => {
                e.preventDefault();
                if (found.length === 0) return;
                onAdd(found);
                setText("");
            }}
        >
            <label className="flex flex-col gap-2 text-sm text-ink-2">
                Type or paste text; only the kanji are kept
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    lang="ja"
                    placeholder="海で泳ぐ。港の近くの湖。"
                    className={cn("px-3.5 py-2.5 rounded-xl border border-line-2 bg-bg text-ink text-base font-jp resize-y placeholder:text-ink-3", FOCUS)}
                />
            </label>
            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={found.length === 0}>
                    Add {found.length > 0 ? `${found.length} kanji` : "kanji"}
                </Button>
                <span className="text-xs text-ink-3" aria-live="polite">
                    {skipped > 0 ? `${skipped} not in the atlas will be skipped.` : found.length > MAX_SET_KANJI ? `A set holds up to ${MAX_SET_KANJI}.` : ""}
                </span>
            </div>
        </form>
    );
}

interface CandidatesProps {
    chars: string[];
    label: string;
    inSet: ReadonlySet<string>;
    entries: Map<string, SearchIndexEntry> | null;
    onAdd: (chars: string[]) => void;
    onToggle: (char: string) => void;
}

/** Kanji from one source as toggles, plus "Add all". */
function Candidates({ chars, label, inSet, entries, onAdd, onToggle }: CandidatesProps) {
    const [expanded, setExpanded] = useState(false);
    const shown = expanded ? chars : chars.slice(0, PREVIEW_COUNT);
    const missing = chars.filter((c) => !inSet.has(c));
    const room = MAX_SET_KANJI - inSet.size;
    const full = room <= 0;
    const addCount = Math.min(room, missing.length);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-ink-3">{label} · {chars.length}</span>
                <Button size="sm" disabled={addCount === 0} onClick={() => onAdd(missing.slice(0, addCount))}>
                    {missing.length === 0 ? "All added" : addCount < missing.length ? `Add first ${addCount}` : `Add all ${addCount}`}
                </Button>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5" data-cascade="" style={CASCADE}>
                {shown.map((c, i) => {
                    const added = inSet.has(c);
                    const meaning = entries?.get(c)?.m[0];
                    return (
                        <li key={c} style={{ "--ci": i % PREVIEW_COUNT } as React.CSSProperties}>
                            <button
                                type="button"
                                aria-pressed={added}
                                disabled={full && !added}
                                onClick={() => onToggle(c)}
                                title={meaning ? `${c} ${meaning}` : c}
                                aria-label={meaning ? `${c}, ${meaning}` : c}
                                className={cn(
                                    "w-full aspect-square flex items-center justify-center rounded-xl border font-jp font-extrabold text-xl transition-[color,background-color,border-color,opacity,scale] duration-200 active:scale-[.92] disabled:opacity-40 motion-reduce:active:scale-100",
                                    added ? "bg-ink border-ink text-bg" : "bg-bg border-line hover:border-ink-3",
                                    FOCUS,
                                )}
                            >
                                <span lang="ja">{c}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            {chars.length > shown.length && (
                <Button variant="quiet" size="sm" onClick={() => setExpanded(true)} className="self-start px-0">
                    Show all {chars.length}
                </Button>
            )}
        </div>
    );
}
