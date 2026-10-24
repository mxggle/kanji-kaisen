import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatReading, readingToRomaji } from "@/lib/atlas/readings";
import { kanjiPath } from "@/lib/atlas/paths";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { JlptBadge } from "@/components/Atlas/JlptBadge";
import { jlptLevelOf } from "./session";

/** Meanings, on/kun readings with romaji and a link to the kanji page (the back of a flashcard). */
export function KanjiDetails({ entry, showMeanings = true }: { entry: SearchIndexEntry; showMeanings?: boolean }) {
    return (
        <div className="text-left">
            {showMeanings && <p className="text-xl font-bold text-white mb-3">{entry.m.slice(0, 5).join(", ")}</p>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                <ReadingRow label="On" readings={entry.on} />
                <ReadingRow label="Kun" readings={entry.kun} />
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <JlptBadge level={jlptLevelOf(entry.j)} />
                <span className="text-xs text-white/50">{entry.s} strokes</span>
                <Link href={kanjiPath(entry.c)} className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
                    Open {entry.c} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
            </div>
        </div>
    );
}

function ReadingRow({ label, readings }: { label: string; readings: string[] }) {
    return (
        <>
            <dt className="text-white/50 text-xs uppercase tracking-wider pt-0.5">{label}</dt>
            <dd className="min-w-0">
                {readings.length === 0 ? (
                    <span className="text-white/40">—</span>
                ) : (
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {readings.slice(0, 6).map((r) => (
                            <li key={r}>
                                <span className="font-japanese text-white">{formatReading(r)}</span>{" "}
                                <span className="text-white/50 text-xs">{readingToRomaji(r)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </dd>
        </>
    );
}
