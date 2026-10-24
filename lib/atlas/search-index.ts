// Client loader for the slim search index served from /data/search-index.json.
// The file is fetched once per page session and the promise is cached.

import type { SearchIndexEntry } from "./search.ts";

export type { SearchIndexEntry } from "./search.ts";

export const SEARCH_INDEX_URL = "/data/search-index.json";

let indexPromise: Promise<SearchIndexEntry[]> | null = null;

export function loadSearchIndex(): Promise<SearchIndexEntry[]> {
    if (!indexPromise) {
        indexPromise = fetch(SEARCH_INDEX_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`Search index request failed: ${res.status}`);
                return res.json() as Promise<SearchIndexEntry[]>;
            })
            .catch((err) => {
                // Allow a retry on the next call instead of caching the failure.
                indexPromise = null;
                throw err;
            });
    }
    return indexPromise;
}
