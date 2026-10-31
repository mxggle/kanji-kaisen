import { useMemo } from "react";
import type { InkEntries } from "@/lib/ink";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";
import type { ShadeOf } from "./order";

/** The learner's ink once the store has hydrated; null on the server and the first client render. */
export function useInkEntries(): InkEntries | null {
    const hydrated = useInkHydrated();
    const entries = useInkStore((state) => state.entries);
    return hydrated ? entries : null;
}

/** A ShadeOf over the entries (everything 0 while they are null). */
export function shadeReader(entries: InkEntries | null): ShadeOf {
    return (char) => entries?.[char]?.shade ?? 0;
}

/** Splits a concatenated kanji string into characters, memoised. */
export function useChars(text: string): string[] {
    return useMemo(() => Array.from(text), [text]);
}
