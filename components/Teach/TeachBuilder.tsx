"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Tool } from "@/components/Layout/Tool";
import { PROSE_LINK } from "@/components/Layout/Document";
import { Button } from "@/components/ui/Button";
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
import { FOCUS } from "./ui";
import { enterOrder } from "@/components/Motion/tokens";

const noopSubscribe = () => () => {};

interface TeachBuilderProps {
    lists: TeachLists;
    siteHost: string;
}

/**
 * /teach builder. The server renders it with an empty set; the first client
 * render reads the set from the URL (?k=&t=) once, so links from the
 * projector or a kanji page open with their kanji.
 */
export function TeachBuilder({ lists, siteHost }: TeachBuilderProps) {
    const search = useSyncExternalStore(noopSubscribe, () => window.location.search, () => null);
    const known = useMemo(() => new Set(lists.jlpt.flatMap((l) => Array.from(l.chars))), [lists.jlpt]);
    return <Builder lists={lists} known={known} search={search} siteHost={siteHost} />;
}

interface BuilderProps {
    lists: TeachLists;
    known: ReadonlySet<string>;
    /** The URL's query: null in the server render (and hydration), then the address on the client. */
    search: string | null;
    siteHost: string;
}

const readSet = (search: string | null, known: ReadonlySet<string>) => (search ? decodeSet(search, known) : { chars: [], title: "" });

function Builder({ lists, known, search, siteHost }: BuilderProps) {
    const [chars, setChars] = useState<string[]>(() => readSet(search, known).chars);
    const [title, setTitle] = useState(() => readSet(search, known).title);
    // The server render can't see the URL. The first client render takes the
    // set from it, once, in place (no remount, so the page's entrance isn't
    // replayed at hydration). Later URL changes come from the builder itself.
    const [syncUrl, setSyncUrl] = useState(search !== null);
    if (!syncUrl && search !== null) {
        const start = readSet(search, known);
        setSyncUrl(true);
        setChars(start.chars);
        setTitle(start.title);
    }
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

    const rail = (
        <>
            <label className="flex flex-col gap-2">
                <span className="type-label">Set name</span>
                <input
                    type="text"
                    value={title}
                    maxLength={MAX_TITLE_LENGTH}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Lesson 7 · Water words"
                    className="h-10 rounded-full border border-line-2 bg-bg px-4 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink"
                />
            </label>

            <SourcePicker lists={lists} known={known} inSet={inSet} entries={byChar} onAdd={add} onToggle={toggle} />

            <hr className="border-line" />

            <div className="flex flex-col gap-2.5">
                <p className="flex items-baseline justify-between gap-2">
                    <span className="type-label">In this set</span>
                    <span className="text-xs text-ink-3">
                        {chars.length} kanji{chars.length > 1 ? " · drag to reorder" : ""}
                    </span>
                </p>
                <SetChips chars={chars} entries={byChar} onMove={move} onRemove={removeAt} />
            </div>

            {shared && (
                <p className="text-sm leading-relaxed text-ink-2" data-enter="fade" style={enterOrder(0)}>
                    All {chars.length} share{" "}
                    <span lang="ja" className="font-jp text-[1.15em] font-extrabold text-ink">
                        {shared.char}
                    </span>
                    . Teach the radical’s story first and the class learns {chars.length} kanji for the price of one idea.{" "}
                    <Link href={radicalPath(shared.key)} className={PROSE_LINK}>
                        Read the {shared.char} story
                    </Link>
                </p>
            )}

            <p aria-live="polite" className="sr-only">{status}</p>

            <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={save} disabled={chars.length === 0}>
                    <Save aria-hidden /> Save set
                </Button>
                <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                        setChars([]);
                        setTitle("");
                        setStatus("Started a new set.");
                    }}
                    disabled={chars.length === 0 && !title}
                >
                    <Plus aria-hidden /> New set
                </Button>
            </div>

            {savedSets.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <h3 className="type-label">
                        Saved sets <span className="normal-case tracking-normal font-normal">· on this device</span>
                    </h3>
                    <ul className="flex flex-col">
                        {savedSets.map((s) => (
                            <li key={s.id} className="flex items-center gap-1 border-t border-line first:border-t-0" data-enter="fade" style={enterOrder(0)}>
                                <button
                                    type="button"
                                    onClick={() => load(s)}
                                    className={cn("flex-1 min-w-0 truncate py-2 text-left text-[15px] text-ink hover:underline", FOCUS)}
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
                                    className={cn("rounded-full p-2 text-ink-3 transition-colors hover:text-ink", FOCUS)}
                                >
                                    <Trash2 size={16} aria-hidden />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );

    return (
        <Tool
            jp="教"
            kind="Teach"
            title="Build a set, then print, project or share it"
            lede="Students open a share link without an account. Paper always prints in 墨."
            railLabel="Build a set"
            rail={rail}
        >
            <TeachPreview chars={chars} title={title.trim()} entries={byChar} themeOf={themeOf} origin={origin} siteHost={siteHost} />
        </Tool>
    );
}
