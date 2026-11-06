"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, MonitorPlay, Printer } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { decodeSet, setPath } from "@/lib/teach-set";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { KindLabel } from "@/components/ui/SectionHeader";
import { InkPaint } from "@/components/Ink/InkPaint";
import { studyPath } from "@/components/Study/session";
import { useSearchIndex } from "@/components/Study/useSearchIndex";
import { BUTTON, BUTTON_MAIN } from "./ui";

/** /set: a shared set for students. Everything comes from the link; no account. */
export function SetClient({ themes }: { themes: Record<string, string> }) {
    const params = useSearchParams();
    const { byChar, error } = useSearchIndex();
    const openedRef = useRef(false);
    const themeOf = useMemo(() => {
        const map = new Map<string, string>();
        for (const [name, chars] of Object.entries(themes)) for (const char of chars) map.set(char, name);
        return map;
    }, [themes]);

    // Until the index loads, show every kanji in the link; then keep known ones only.
    const set = useMemo(() => decodeSet(params, byChar ? (c) => byChar.has(c) : undefined), [params, byChar]);
    const settled = byChar !== null || error;
    const count = set.chars.length;

    useEffect(() => {
        if (!settled || openedRef.current) return;
        openedRef.current = true;
        trackEvent("share_link_opened", { count });
    }, [settled, count]);

    if (count === 0) {
        return (
            <div className="py-10">
                <h1 className="type-title">{settled ? "This set is empty" : "Loading the set…"}</h1>
                {settled && (
                    <p className="mt-3 text-ink-2">
                        The link has no kanji we know.{" "}
                        <Link href="/teach" className="text-ink underline underline-offset-2">Build a set</Link> or{" "}
                        <Link href="/browse" className="text-ink underline underline-offset-2">browse all kanji</Link>.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div>
            <KindLabel jp="教">Shared kanji set</KindLabel>
            <h1 className="type-title mt-3 break-words">{set.title || "Kanji set"}</h1>
            <p className="mt-2 text-ink-2">
                {count} kanji · No account needed
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
                <Link href={studyPath({ kind: "chars", chars: set.chars, ...(set.title ? { title: set.title } : {}) })} className={BUTTON_MAIN}>
                    <BookOpen size={18} aria-hidden /> Study this set
                </Link>
                <Link href={setPath("print", set)} className={BUTTON}>
                    <Printer size={18} aria-hidden /> Print
                </Link>
                <Link href={setPath("present", set)} className={BUTTON}>
                    <MonitorPlay size={18} aria-hidden /> Present
                </Link>
            </div>

            <InkPaint>
                <ul className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2.5" aria-label="Kanji in this set">
                    {set.chars.map((char) => {
                        const entry = byChar?.get(char);
                        return (
                            <li key={char}>
                                <KanjiTile kanji={{ char, meanings: entry?.m ?? [], onyomi: entry?.on ?? [], kunyomi: entry?.kun ?? [], category: themeOf.get(char) ?? null }} />
                            </li>
                        );
                    })}
                </ul>
            </InkPaint>

            <p className="mt-10 text-sm text-ink-3">
                Each kanji opens its page with readings, words and stroke order. Teachers:{" "}
                <Link href="/teach" className="text-ink underline underline-offset-2">make your own set</Link>.
            </p>
        </div>
    );
}
