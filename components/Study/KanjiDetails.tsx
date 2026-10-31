import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatReading, readingToRomaji } from "@/lib/atlas/readings";
import { kanjiPath } from "@/lib/atlas/paths";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { Tag } from "@/components/ui/Tag";
import { jlptLevelOf } from "./session";

/** Meanings, on/kun readings with romaji and a link to the kanji page (the back of a flashcard). */
export function KanjiDetails({ entry, showMeanings = true }: { entry: SearchIndexEntry; showMeanings?: boolean }) {
    return (
        <div className="flex flex-col gap-3 text-left">
            {showMeanings && <p className="text-xl font-bold text-ink">{entry.m.slice(0, 5).join(", ")}</p>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                <ReadingRow label="On" readings={entry.on} />
                <ReadingRow label="Kun" readings={entry.kun} />
            </dl>
            <div className="flex flex-wrap items-center gap-2 pt-1">
                <Tag>{jlptLevelOf(entry.j)}</Tag>
                <Tag>{entry.s} strokes</Tag>
                <Link href={kanjiPath(entry.c)} className="ml-1 inline-flex items-center gap-1 text-sm text-ink underline underline-offset-[3px] hover:text-ink-2">
                    Open{" "}
                    <span lang="ja" className="font-jp">
                        {entry.c}
                    </span>{" "}
                    <ArrowRight className="size-3.5" aria-hidden />
                </Link>
            </div>
        </div>
    );
}

function ReadingRow({ label, readings }: { label: string; readings: string[] }) {
    return (
        <>
            <dt className="type-label pt-0.5">{label}</dt>
            <dd className="min-w-0">
                {readings.length === 0 ? (
                    <span className="text-ink-3">—</span>
                ) : (
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {readings.slice(0, 6).map((r) => (
                            <li key={r}>
                                <span lang="ja" className="font-jp text-ink">
                                    {formatReading(r)}
                                </span>{" "}
                                <span className="text-xs text-ink-3">{readingToRomaji(r)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </dd>
        </>
    );
}
