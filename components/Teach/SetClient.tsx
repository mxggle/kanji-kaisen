"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, MonitorPlay, Printer } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { decodeSet, setPath } from "@/lib/teach-set";
import { KanjiTile } from "@/components/Atlas/KanjiTile";
import { jlptLevelOf, studyPath } from "@/components/Study/session";
import { useSearchIndex } from "@/components/Study/useSearchIndex";
import { BUTTON, BUTTON_MAIN } from "./ui";

/** /set: a shared set for students. Everything comes from the link; no account. */
export function SetClient() {
    const params = useSearchParams();
    const { byChar, error } = useSearchIndex();
    const openedRef = useRef(false);

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
                <h1 className="font-disp text-4xl font-bold">{settled ? "This set is empty" : "Loading the set…"}</h1>
                {settled && (
                    <p className="mt-3 text-ink-2">
                        The link has no kanji we know.{" "}
                        <Link href="/teach" className="text-accent hover:underline">Build a set</Link> or{" "}
                        <Link href="/browse" className="text-accent hover:underline">browse all kanji</Link>.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div>
            <p className="text-sm text-ink-3">Shared kanji set</p>
            <h1 className="mt-1 font-disp text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.05] break-words">{set.title || "Kanji set"}</h1>
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

            <ul className="mt-8 grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2" aria-label="Kanji in this set">
                {set.chars.map((char) => {
                    const entry = byChar?.get(char);
                    return (
                        <li key={char}>
                            <KanjiTile
                                kanji={{
                                    char,
                                    meanings: entry?.m ?? [],
                                    jlpt: jlptLevelOf(entry?.j ?? 1),
                                    onyomi: entry?.on ?? [],
                                    kunyomi: entry?.kun ?? [],
                                }}
                            />
                        </li>
                    );
                })}
            </ul>

            <p className="mt-10 text-sm text-ink-3">
                Each kanji opens its page with readings, words and stroke order. Teachers:{" "}
                <Link href="/teach" className="text-accent hover:underline">make your own set</Link>.
            </p>
        </div>
    );
}
