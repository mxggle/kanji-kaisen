"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/atlas/categories";
import { radicalPath } from "@/lib/atlas/paths";
import { decodeSet, encodeSet, MAX_SET_KANJI, MAX_TITLE_LENGTH, moveItem, sharedRadical } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import { useSearchIndex } from "@/components/Study/useSearchIndex";
import { deleteSavedSet, saveSet, useSavedSets } from "./saved-sets";
import { SetChips } from "./SetChips";
import { SourcePicker } from "./SourcePicker";
import { TeachPreview } from "./TeachPreview";
import type { TeachLists, TeachRadical } from "./types";
import { BUTTON, FOCUS } from "./ui";

const noopSubscribe = () => () => {};

interface TeachBuilderProps {
    lists: TeachLists;
    siteHost: string;
}

/**
 * /teach builder. The server renders it with an empty set; on the client it
 * remounts once with the set from the URL (?k=&t=), so links from the
 * projector or a kanji page open with their kanji.
 */
export function TeachBuilder({ lists, siteHost }: TeachBuilderProps) {
    const search = useSyncExternalStore(noopSubscribe, () => window.location.search, () => null);
    const known = useMemo(() => new Set(lists.jlpt.flatMap((l) => Array.from(l.chars))), [lists.jlpt]);
    // The key flips once, from the server render to the first client render.
    // Later URL changes come from the builder itself and are ignored here.
    const phase = search === null ? "server" : "client";
    return <Builder key={phase} lists={lists} known={known} initialSearch={search} syncUrl={phase === "client"} siteHost={siteHost} />;
}

interface BuilderProps {
    lists: TeachLists;
    known: ReadonlySet<string>;
    initialSearch: string | null;
    /** False for the server-rendered instance, which must not overwrite the URL before it is read. */
    syncUrl: boolean;
    siteHost: string;
}

function Builder({ lists, known, initialSearch, syncUrl, siteHost }: BuilderProps) {
    const [start] = useState(() => (initialSearch ? decodeSet(initialSearch, known) : { chars: [], title: "" }));
    const [chars, setChars] = useState<string[]>(start.chars);
    const [title, setTitle] = useState(start.title);
    const [status, setStatus] = useState("");
    const { byChar } = useSearchIndex();
    const savedSets = useSavedSets();
    const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");

    const radicalOf = useMemo(() => {
        const map = new Map<string, TeachRadical>();
        for (const r of lists.radicals) for (const c of r.chars) map.set(c, r);
        return map;
    }, [lists.radicals]);
    const themeOf = useCallback((char: string) => {
        const theme = radicalOf.get(char)?.theme ?? -1;
        return theme >= 0 ? CATEGORIES[theme] : null;
    }, [radicalOf]);

    const inSet = useMemo(() => new Set(chars), [chars]);
    const query = encodeSet({ chars, title });
    const shared = useMemo(() => {
        const key = sharedRadical(chars, (c) => radicalOf.get(c)?.key);
        return key ? lists.radicals.find((r) => r.key === key) ?? null : null;
    }, [chars, radicalOf, lists.radicals]);

    // Keep the set in the address bar, so a reload or a copied URL keeps it.
    useEffect(() => {
        if (syncUrl) window.history.replaceState(null, "", query ? `/teach?${query}` : "/teach");
    }, [query, syncUrl]);

    const add = (list: string[]) => {
        const fresh = list.filter((c) => known.has(c) && !inSet.has(c));
        const room = MAX_SET_KANJI - chars.length;
        const added = fresh.slice(0, Math.max(0, room));
        if (added.length > 0) setChars([...chars, ...added]);
        const dropped = fresh.length - added.length;
        setStatus(
            added.length === 0
                ? fresh.length === 0
                    ? "Those kanji are already in the set."
                    : `The set is full (${MAX_SET_KANJI} kanji).`
                : `Added ${added.length} kanji${dropped > 0 ? `; ${dropped} didn’t fit (a set holds ${MAX_SET_KANJI})` : ""}.`,
        );
    };

    const toggle = (char: string) => {
        if (inSet.has(char)) {
            setChars(chars.filter((c) => c !== char));
            setStatus(`Removed ${char}.`);
        } else {
            add([char]);
        }
    };

    const move = (from: number, to: number) => {
        setChars(moveItem(chars, from, to));
        setStatus(`${chars[from]} moved to position ${to + 1} of ${chars.length}.`);
    };

    const removeAt = (index: number) => {
        setStatus(`Removed ${chars[index]}.`);
        setChars(chars.filter((_, i) => i !== index));
    };

    const load = (next: { chars: string; title: string }) => {
        const set = decodeSet({ k: next.chars, t: next.title }, known);
        setChars(set.chars);
        setTitle(set.title);
        setStatus(`Opened ${set.title || "the saved set"} (${set.chars.length} kanji).`);
    };

    const save = () => {
        if (chars.length === 0) return;
        saveSet({ chars, title });
        setStatus(`Saved ${title || "the set"} on this device.`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-8 lg:gap-10">
            <section aria-labelledby="build-heading" className="flex flex-col gap-5 min-w-0">
                <div>
                    <h2 id="build-heading" className="font-disp text-[34px] font-bold leading-none">Build a set</h2>
                    <p className="mt-1.5 text-sm text-ink-2">For one lesson, one class, one evening’s homework.</p>
                </div>

                <label className="flex flex-col gap-1.5 text-[13px] text-ink-3">
                    Name
                    <input
                        type="text"
                        value={title}
                        maxLength={MAX_TITLE_LENGTH}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Lesson 7 · Water words"
                        className={cn("h-11 px-3.5 rounded-[10px] border border-line-2 bg-card text-ink text-base placeholder:text-ink-3", FOCUS)}
                    />
                </label>

                <SourcePicker lists={lists} known={known} inSet={inSet} entries={byChar} onAdd={add} onToggle={toggle} />

                <div className="flex flex-col gap-2">
                    <p className="flex justify-between gap-2 text-[13px] text-ink-3">
                        <span>In this set</span>
                        <span>
                            {chars.length} kanji{chars.length > 1 ? " · drag to reorder" : ""}
                        </span>
                    </p>
                    <SetChips chars={chars} entries={byChar} onMove={move} onRemove={removeAt} />
                </div>

                {shared && (
                    <div className="rounded-xl border border-line bg-card p-4 text-sm leading-relaxed text-ink-2">
                        All {chars.length} share{" "}
                        <span lang="ja" className="font-jp font-extrabold text-accent text-[1.15em]">{shared.char}</span>. Teach the radical’s story
                        first and the class learns {chars.length} kanji for the price of one idea.{" "}
                        <Link href={radicalPath(shared.key)} className="text-accent hover:underline">Read the {shared.char} story</Link>
                    </div>
                )}

                <p aria-live="polite" className="sr-only">{status}</p>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={save} disabled={chars.length === 0} className={cn(BUTTON, "h-10")}>
                        <Save size={16} aria-hidden /> Save set
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setChars([]);
                            setTitle("");
                            setStatus("Started a new set.");
                        }}
                        disabled={chars.length === 0 && !title}
                        className={cn(BUTTON, "h-10")}
                    >
                        <Plus size={16} aria-hidden /> New set
                    </button>
                </div>

                {savedSets.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <h3 className="text-[13px] font-normal text-ink-3">Saved sets <span className="text-xs">(on this device)</span></h3>
                        <ul className="flex flex-col">
                            {savedSets.map((s) => (
                                <li key={s.id} className="flex items-center gap-1 border-t border-line first:border-t-0">
                                    <button
                                        type="button"
                                        onClick={() => load(s)}
                                        className={cn("flex-1 min-w-0 text-left py-2 text-[15px] text-ink hover:text-accent transition-colors truncate", FOCUS)}
                                    >
                                        {s.title || <span lang="ja" className="font-jp">{Array.from(s.chars).slice(0, 8).join("")}</span>}{" "}
                                        <span className="text-ink-3">· {Array.from(s.chars).length}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            deleteSavedSet(s.id);
                                            setStatus(`Deleted ${s.title || "the saved set"}.`);
                                        }}
                                        aria-label={`Delete saved set ${s.title || s.chars}`}
                                        className={cn("p-2 rounded-full text-ink-3 hover:text-bad hover:bg-ink/10 transition-colors", FOCUS)}
                                    >
                                        <Trash2 size={16} aria-hidden />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            <section aria-label="Use the set" className="min-w-0">
                <TeachPreview chars={chars} title={title.trim()} entries={byChar} themeOf={themeOf} origin={origin} siteHost={siteHost} />
            </section>
        </div>
    );
}
