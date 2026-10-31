"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/atlas/categories";
import type { JlptLevel } from "@/lib/atlas/types";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { listSaved } from "@/lib/study-list";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { extractKanji, MAX_SET_KANJI } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import type { TeachLists } from "./types";
import { BUTTON, CHIP, FOCUS } from "./ui";

export type Source = "theme" | "radical" | "jlpt" | "list" | "text";

const SOURCES: { id: Source; label: string }[] = [
    { id: "theme", label: "Theme" },
    { id: "radical", label: "Radical" },
    { id: "jlpt", label: "JLPT level" },
    { id: "list", label: "My list" },
    { id: "text", label: "Type or paste" },
];

// Long lists (a JLPT level has up to 1,200 kanji) show this many until expanded.
const PREVIEW_COUNT = 96;

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
    const [radical, setRadical] = useState("");
    const [level, setLevel] = useState<JlptLevel | null>(null);

    const radicalGroups = useMemo(
        () =>
            [...CATEGORIES.map((name, index) => ({ name, index })), { name: "Other", index: -1 }]
                .map(({ name, index }) => ({ name, radicals: lists.radicals.filter((r) => r.theme === index) }))
                .filter((g) => g.radicals.length > 0),
        [lists.radicals],
    );

    const candidates = (chars: string, label: string) => (
        <Candidates key={label} chars={Array.from(chars)} label={label} inSet={inSet} entries={entries} onAdd={onAdd} onToggle={onToggle} />
    );

    const selectedTheme = lists.themes.find((t) => t.slug === theme);
    const selectedRadical = lists.radicals.find((r) => r.key === radical);
    const selectedLevel = lists.jlpt.find((l) => l.level === level);

    return (
        <div className="flex flex-col gap-3">
            <div role="group" aria-label="Add kanji from" className="flex flex-col gap-2">
                <span className="text-[13px] text-ink-3" aria-hidden>Add kanji from</span>
                <div className="flex flex-wrap gap-2">
                    {SOURCES.map((s) => (
                        <button key={s.id} type="button" aria-pressed={source === s.id} onClick={() => setSource(s.id)} className={CHIP}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-line bg-card p-3">
                {source === "theme" && (
                    <div className="flex flex-col gap-3">
                        <div role="group" aria-label="Themes" className="flex flex-wrap gap-1.5">
                            {lists.themes.map((t) => (
                                <button
                                    key={t.slug}
                                    type="button"
                                    aria-pressed={theme === t.slug}
                                    onClick={() => setTheme(t.slug)}
                                    title={t.name}
                                    className={cn(CHIP, "h-8 px-3")}
                                    style={{ "--tc": t.color } as React.CSSProperties}
                                >
                                    <span aria-hidden className="w-2 h-2 rounded-full bg-c" />
                                    {t.short}
                                    <span className="text-xs opacity-70">{Array.from(t.chars).length}</span>
                                </button>
                            ))}
                        </div>
                        {selectedTheme ? candidates(selectedTheme.chars, `${selectedTheme.name} theme`) : <Hint>Pick a theme to see its kanji.</Hint>}
                    </div>
                )}

                {source === "radical" && (
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-1.5 text-[13px] text-ink-3">
                            Radical
                            <select
                                value={radical}
                                onChange={(e) => setRadical(e.target.value)}
                                className={cn("h-11 px-3 rounded-lg border border-line-2 bg-bg text-ink text-[15px]", FOCUS)}
                            >
                                <option value="">Choose a radical…</option>
                                {radicalGroups.map((g) => (
                                    <optgroup key={g.name} label={g.name}>
                                        {g.radicals.map((r) => (
                                            <option key={r.key} value={r.key}>
                                                {r.char} {r.meaning} ({r.name}) · {Array.from(r.chars).length}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                        {selectedRadical ? (
                            candidates(selectedRadical.chars, `Radical ${selectedRadical.char} ${selectedRadical.meaning}`)
                        ) : (
                            <Hint>Kanji that share a radical make a strong lesson: teach the radical once, then the kanji.</Hint>
                        )}
                    </div>
                )}

                {source === "jlpt" && (
                    <div className="flex flex-col gap-3">
                        <div role="group" aria-label="JLPT levels" className="flex flex-wrap gap-1.5">
                            {lists.jlpt.map((l) => (
                                <button key={l.level} type="button" aria-pressed={level === l.level} onClick={() => setLevel(l.level)} className={cn(CHIP, "h-8 px-3")}>
                                    {l.level}
                                    <span className="text-xs opacity-70">{Array.from(l.chars).length}</span>
                                </button>
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
    return <p className="text-sm text-ink-3">{children}</p>;
}

function MyListSource({ candidates }: { candidates: (chars: string, label: string) => React.ReactNode }) {
    const hydrated = useStudyStoreHydrated();
    const entries = useStudyStore((s) => s.entries);
    if (!hydrated) return <Hint>Loading your list…</Hint>;
    const saved = listSaved(entries);
    if (saved.length === 0) {
        return (
            <Hint>
                Kanji you save from any kanji page show up here. <Link href="/browse" className="text-accent hover:underline">Browse kanji</Link>
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
            onSubmit={(e) => {
                e.preventDefault();
                if (found.length === 0) return;
                onAdd(found);
                setText("");
            }}
        >
            <label className="flex flex-col gap-1.5 text-[13px] text-ink-3">
                Type or paste text; only the kanji are kept
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    lang="ja"
                    placeholder="海で泳ぐ。港の近くの湖。"
                    className={cn("px-3 py-2 rounded-lg border border-line-2 bg-bg text-ink text-base font-jp resize-y", FOCUS)}
                />
            </label>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={found.length === 0} className={cn(BUTTON, "h-9")}>
                    Add {found.length > 0 ? `${found.length} kanji` : "kanji"}
                </button>
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
                <span className="text-[13px] text-ink-3">{label} · {chars.length}</span>
                <button type="button" disabled={addCount === 0} onClick={() => onAdd(missing.slice(0, addCount))} className={cn(BUTTON, "h-8 px-3")}>
                    {missing.length === 0 ? "All added" : addCount < missing.length ? `Add first ${addCount}` : `Add all ${addCount}`}
                </button>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
                {shown.map((c) => {
                    const added = inSet.has(c);
                    const meaning = entries?.get(c)?.m[0];
                    return (
                        <li key={c}>
                            <button
                                type="button"
                                aria-pressed={added}
                                disabled={full && !added}
                                onClick={() => onToggle(c)}
                                title={meaning ? `${c} ${meaning}` : c}
                                aria-label={meaning ? `${c}, ${meaning}` : c}
                                className={cn(
                                    "w-full aspect-square flex items-center justify-center rounded-lg border border-line-2 font-jp font-semibold text-xl transition-colors disabled:opacity-40",
                                    added ? "bg-ink border-ink text-bg" : "bg-bg hover:border-accent",
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
                <button type="button" onClick={() => setExpanded(true)} className="self-start text-sm text-accent hover:underline">
                    Show all {chars.length}
                </button>
            )}
        </div>
    );
}
