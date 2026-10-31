"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { MAX_SET_KANJI } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import { BUTTON, FOCUS } from "./ui";

interface SetChipsProps {
    chars: string[];
    entries: Map<string, SearchIndexEntry> | null;
    onMove: (from: number, to: number) => void;
    onRemove: (index: number) => void;
}

/**
 * The kanji in the set, in teaching order. Select a chip, then move or remove
 * it with the buttons; on a focused chip Alt+arrows move it and Delete removes
 * it. Mouse users can also drag chips.
 */
export function SetChips({ chars, entries, onMove, onRemove }: SetChipsProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const refs = useRef(new Map<string, HTMLButtonElement>());
    const dragFrom = useRef<number | null>(null);
    const index = selected ? chars.indexOf(selected) : -1;

    const focusChar = (char: string | undefined) => {
        if (!char) return;
        requestAnimationFrame(() => refs.current.get(char)?.focus());
    };

    const move = (from: number, to: number) => {
        if (to < 0 || to >= chars.length || from === to) return;
        onMove(from, to);
        focusChar(chars[from]);
    };

    const remove = (i: number) => {
        const next = chars[i + 1] ?? chars[i - 1];
        onRemove(i);
        setSelected(next ?? null);
        focusChar(next);
    };

    const onKeyDown = (e: React.KeyboardEvent, i: number) => {
        const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
        const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
        if (e.altKey && (back || forward)) {
            e.preventDefault();
            setSelected(chars[i]);
            move(i, back ? i - 1 : i + 1);
        } else if (back || forward) {
            e.preventDefault();
            focusChar(chars[back ? i - 1 : i + 1]);
        } else if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            remove(i);
        }
    };

    if (chars.length === 0) {
        return <p className="rounded-xl border border-dashed border-line-2 p-4 text-sm text-ink-3">No kanji yet. Add some from a theme, a radical, a JLPT level, your list, or paste text.</p>;
    }

    return (
        <div className="flex flex-col gap-2">
            <ol aria-label="Kanji in this set" className="flex flex-wrap gap-2">
                {chars.map((c, i) => {
                    const meaning = entries?.get(c)?.m[0];
                    return (
                        <li key={c}>
                            <button
                                ref={(el) => {
                                    if (el) refs.current.set(c, el);
                                    else refs.current.delete(c);
                                }}
                                type="button"
                                draggable
                                aria-pressed={selected === c}
                                aria-label={`${c}${meaning ? `, ${meaning}` : ""}, ${i + 1} of ${chars.length}`}
                                aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Delete"
                                title={meaning ? `${c} ${meaning}` : c}
                                onClick={() => setSelected(selected === c ? null : c)}
                                onKeyDown={(e) => onKeyDown(e, i)}
                                onDragStart={(e) => {
                                    dragFrom.current = i;
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", c);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (dragFrom.current !== null) move(dragFrom.current, i);
                                    dragFrom.current = null;
                                }}
                                className={cn(
                                    "w-11 h-11 flex items-center justify-center rounded-lg border border-line-2 bg-card font-jp font-bold text-[22px] cursor-grab active:cursor-grabbing transition-colors",
                                    selected === c ? "border-accent text-accent ring-1 ring-accent" : i === 0 ? "border-ink-3" : "hover:border-ink-3",
                                    FOCUS,
                                )}
                            >
                                <span lang="ja" aria-hidden>{c}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>

            <div className="flex flex-wrap items-center gap-2 min-h-9">
                {index >= 0 ? (
                    <>
                        <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className={cn(BUTTON, "h-9 px-3")}>
                            <ArrowLeft size={16} aria-hidden /> Earlier
                        </button>
                        <button type="button" onClick={() => move(index, index + 1)} disabled={index === chars.length - 1} className={cn(BUTTON, "h-9 px-3")}>
                            Later <ArrowRight size={16} aria-hidden />
                        </button>
                        <button type="button" onClick={() => remove(index)} className={cn(BUTTON, "h-9 px-3")}>
                            <X size={16} aria-hidden /> Remove <span lang="ja" className="font-jp">{selected}</span>
                        </button>
                    </>
                ) : (
                    <p className="text-xs text-ink-3">
                        Select a kanji to move or remove it, or drag it. Up to {MAX_SET_KANJI} kanji.
                    </p>
                )}
            </div>
        </div>
    );
}
