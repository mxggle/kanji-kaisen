"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { MAX_SET_KANJI } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { flip, measure, POP_IN, type Rects } from "@/components/Browse/flip";
import { FOCUS } from "./ui";

interface SetChipsProps {
    chars: string[];
    entries: Map<string, SearchIndexEntry> | null;
    onMove: (from: number, to: number) => void;
    onRemove: (index: number) => void;
}

/**
 * The kanji in the set, in teaching order, as square tiles. Each has a remove
 * button; select a tile to move it with the buttons. On a focused tile
 * Alt+arrows move it and Delete removes it. Mouse users can also drag tiles.
 *
 * Motion: a moved tile and the ones it passes slide to their new places, the
 * rest close up when one is removed, and kanji added to the set pop in.
 */
export function SetChips({ chars, entries, onMove, onRemove }: SetChipsProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const refs = useRef(new Map<string, HTMLButtonElement>());
    const dragFrom = useRef<number | null>(null);
    const index = selected ? chars.indexOf(selected) : -1;
    const listRef = useRef<HTMLOListElement>(null);
    // Measured just before a move or removal made here; additions come from the rail.
    const flipFrom = useRef<Rects | null>(null);
    const seen = useRef<ReadonlySet<string> | null>(null);

    useLayoutEffect(() => {
        const before = flipFrom.current;
        const prev = seen.current;
        flipFrom.current = null;
        seen.current = new Set(chars);
        // The first render arrives with the page.
        if (!prev) return;
        // Kanji that were already there keep still unless measured before a move; new ones pop in.
        const was: Rects = new Map(Array.from(prev, (c) => [c, before?.get(c) ?? null]));
        flip(listRef.current, was, POP_IN);
    }, [chars]);

    const focusChar = (char: string | undefined) => {
        if (!char) return;
        requestAnimationFrame(() => refs.current.get(char)?.focus());
    };

    const move = (from: number, to: number) => {
        if (to < 0 || to >= chars.length || from === to) return;
        flipFrom.current = measure(listRef.current);
        onMove(from, to);
        focusChar(chars[from]);
    };

    const remove = (i: number) => {
        const next = chars[i + 1] ?? chars[i - 1];
        flipFrom.current = measure(listRef.current);
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
        return <p className="rounded-xl border border-dashed border-line-2 p-4 text-sm text-ink-3">No kanji yet. Add some from a theme, a radical, a JLPT level, your list, or pasted text.</p>;
    }

    return (
        <div className="flex flex-col gap-2">
            <ol ref={listRef} aria-label="Kanji in this set" className="grid grid-cols-4 gap-2">
                {chars.map((c, i) => {
                    const meaning = entries?.get(c)?.m[0];
                    return (
                        <li key={c} data-flip={c} className="relative">
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
                                    "flex aspect-square w-full items-center justify-center rounded-xl border bg-bg font-jp font-extrabold text-2xl text-ink cursor-grab active:cursor-grabbing transition-[color,border-color,box-shadow,scale] duration-150 active:scale-[.96] motion-reduce:active:scale-100",
                                    selected === c ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink-3",
                                    FOCUS,
                                )}
                            >
                                <span lang="ja" aria-hidden>{c}</span>
                            </button>
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label={`Remove ${c}`}
                                title={`Remove ${c}`}
                                onClick={() => remove(i)}
                                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-line-2 bg-card text-ink-3 transition-colors hover:border-ink hover:text-ink"
                            >
                                <X size={12} aria-hidden />
                            </button>
                        </li>
                    );
                })}
            </ol>

            <div className="flex flex-wrap items-center gap-2 min-h-9">
                {index >= 0 ? (
                    <>
                        <Button size="sm" onClick={() => move(index, index - 1)} disabled={index === 0}>
                            <ArrowLeft aria-hidden /> Earlier
                        </Button>
                        <Button size="sm" onClick={() => move(index, index + 1)} disabled={index === chars.length - 1}>
                            Later <ArrowRight aria-hidden />
                        </Button>
                    </>
                ) : (
                    <p className="text-xs text-ink-3">
                        Select a kanji to move it, or drag it. Up to {MAX_SET_KANJI} kanji.
                    </p>
                )}
            </div>
        </div>
    );
}
