"use client";

import { useEffect, useState } from "react";
import { loadSearchIndex, type SearchIndexEntry } from "@/lib/atlas/search-index";

export interface SearchIndexState {
    entries: SearchIndexEntry[] | null;
    byChar: Map<string, SearchIndexEntry> | null;
    error: boolean;
    retry: () => void;
}

/** The slim kanji index (meanings, readings, JLPT, strokes), fetched once per page session. */
export function useSearchIndex(): SearchIndexState {
    const [state, setState] = useState<{ entries: SearchIndexEntry[] | null; byChar: Map<string, SearchIndexEntry> | null; error: boolean }>({
        entries: null,
        byChar: null,
        error: false,
    });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        loadSearchIndex()
            .then((entries) => {
                if (!cancelled) setState({ entries, byChar: new Map(entries.map((e) => [e.c, e])), error: false });
            })
            .catch(() => {
                if (!cancelled) setState((s) => ({ ...s, error: true }));
            });
        return () => {
            cancelled = true;
        };
    }, [attempt]);

    return {
        ...state,
        retry: () => {
            setState((s) => ({ ...s, error: false }));
            setAttempt((n) => n + 1);
        },
    };
}
