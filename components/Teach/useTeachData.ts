"use client";

// Client loaders for worksheet and projector data: KanjiVG strokes (public
// SVGs) and the static example-word shards. Each file is fetched once per page
// session and shared between components.

import { useEffect, useState } from "react";
import { wordsShardOf, wordsShardPath, type TeachWords } from "@/lib/teach-set";
import { kanjivgUrl, parseKanjiVg, type KanjiStrokes } from "./strokes";

const strokeCache = new Map<string, Promise<KanjiStrokes | null>>();
const shardCache = new Map<number, Promise<TeachWords>>();

export function loadStrokes(char: string): Promise<KanjiStrokes | null> {
    let promise = strokeCache.get(char);
    if (!promise) {
        promise = fetch(kanjivgUrl(char))
            .then((res) => (res.ok ? res.text() : null))
            .then((text) => (text ? parseKanjiVg(text) : null))
            .catch(() => {
                // A network error shouldn't stick: allow a retry on the next load.
                strokeCache.delete(char);
                return null;
            });
        strokeCache.set(char, promise);
    }
    return promise;
}

function loadShard(shard: number): Promise<TeachWords> {
    let promise = shardCache.get(shard);
    if (!promise) {
        promise = fetch(wordsShardPath(shard))
            .then((res) => (res.ok ? (res.json() as Promise<TeachWords>) : {}))
            .catch(() => {
                shardCache.delete(shard);
                return {};
            });
        shardCache.set(shard, promise);
    }
    return promise;
}

export interface Loaded<T> {
    data: T;
    /** True once the data for the current chars has arrived. */
    ready: boolean;
}

/** Stroke data for each char (null when KanjiVG has no file for it). */
export function useKanjiStrokes(chars: readonly string[]): Loaded<Map<string, KanjiStrokes | null>> {
    const key = chars.join("");
    const [state, setState] = useState<{ key: string | null; data: Map<string, KanjiStrokes | null> }>({ key: null, data: new Map() });

    useEffect(() => {
        let cancelled = false;
        const list = Array.from(key);
        Promise.all(list.map((c) => loadStrokes(c).then((s) => [c, s] as const))).then((entries) => {
            if (!cancelled) setState({ key, data: new Map(entries) });
        });
        return () => {
            cancelled = true;
        };
    }, [key]);

    return { data: state.data, ready: state.key === key };
}

/** Up to two example words per char, from the shards the chars fall in. */
export function useTeachWords(chars: readonly string[], enabled = true): Loaded<TeachWords> {
    const key = enabled ? chars.join("") : "";
    const [state, setState] = useState<{ key: string | null; data: TeachWords }>({ key: null, data: {} });

    useEffect(() => {
        let cancelled = false;
        const shards = [...new Set(Array.from(key).map(wordsShardOf))];
        Promise.all(shards.map(loadShard)).then((loaded) => {
            if (!cancelled) setState({ key, data: Object.assign({}, ...loaded) });
        });
        return () => {
            cancelled = true;
        };
    }, [key]);

    return { data: state.data, ready: state.key === key };
}
