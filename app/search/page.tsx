import type { Metadata } from "next";
import Link from "next/link";
import searchIndexData from "@/public/data/search-index.json";
import { PageShell, Breadcrumbs } from "@/components/Atlas/PageShell";
import { JlptBadge } from "@/components/Atlas/JlptBadge";
import { SearchBox } from "@/components/Search/SearchBox";
import { TrackEvent } from "@/components/Atlas/TrackEvent";
import { searchKanji, type SearchIndexEntry, type SearchResult } from "@/lib/atlas/search";
import { formatReading } from "@/lib/atlas/readings";
import { browsePath, kanjiPath, searchPath } from "@/lib/atlas/paths";
import type { JlptLevel } from "@/lib/atlas/types";

// The same slim index the client SearchBox fetches; imported here so it stays on the server.
const SEARCH_INDEX = searchIndexData as unknown as SearchIndexEntry[];
const RESULT_LIMIT = 100;

interface SearchPageProps {
    searchParams: Promise<{ q?: string | string[] }>;
}

async function readQuery(searchParams: SearchPageProps["searchParams"]): Promise<string> {
    const { q } = await searchParams;
    return (Array.isArray(q) ? q[0] : q ?? "").trim().slice(0, 100);
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
    const q = await readQuery(searchParams);
    return {
        title: q ? `Search: ${q}` : "Search kanji",
        description: "Search kanji by character, English meaning, kana reading or romaji.",
        robots: { index: false, follow: true },
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const q = await readQuery(searchParams);
    const results = q ? searchKanji(SEARCH_INDEX, q, { limit: RESULT_LIMIT }) : [];

    return (
        <PageShell>
            {q && <TrackEvent name="search_performed" properties={{ query: q, result_count: results.length, source: "search_page" }} />}
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Search" }]} />
            <h1 className="text-3xl font-bold mb-2">{q ? <>Results for “{q}”</> : "Search kanji"}</h1>
            <p className="text-white/60 mb-6 text-sm">
                Type a kanji, an English meaning (“water”), kana (“みず”) or romaji (“mizu”).
            </p>

            {/* Keyed by the query so the box resets when navigating between searches. */}
            <SearchBox key={q} variant="hero" defaultValue={q} autoFocus={!q} />

            <div className="mt-8">
                {!q ? (
                    <EmptyState />
                ) : results.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
                        <p className="font-medium text-white">No kanji found for “{q}”.</p>
                        <p className="mt-2 text-sm">
                            Try a single English word, a reading in kana or romaji, or{" "}
                            <Link href={browsePath()} className="text-[var(--accent)] hover:underline">browse all kanji</Link>.
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-white/50 mb-3">
                            {results.length === RESULT_LIMIT ? `Top ${RESULT_LIMIT} results` : `${results.length} result${results.length === 1 ? "" : "s"}`}
                        </p>
                        <ul className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                            {results.map((r) => (
                                <ResultRow key={r.entry.c} result={r} />
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </PageShell>
    );
}

function ResultRow({ result }: { result: SearchResult }) {
    const e = result.entry;
    const on = e.on.slice(0, 3);
    const kun = e.kun.slice(0, 3).map(formatReading);
    return (
        <li>
            <Link href={kanjiPath(e.c)} className="flex items-center gap-4 p-3 sm:p-4 bg-white/[0.02] hover:bg-white/[0.07] transition-colors">
                <span className="w-14 h-14 shrink-0 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-4xl font-bold font-japanese">
                    {e.c}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-medium text-white truncate">{e.m.slice(0, 4).join(", ")}</span>
                    <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-white/60 font-japanese">
                        {on.length > 0 && <span><span className="text-white/40 font-sans text-xs mr-1">On</span>{on.join("、")}</span>}
                        {kun.length > 0 && <span><span className="text-white/40 font-sans text-xs mr-1">Kun</span>{kun.join("、")}</span>}
                    </span>
                </span>
                <span className="shrink-0 flex flex-col items-end gap-1">
                    <JlptBadge level={`N${e.j}` as JlptLevel} />
                    <span className="text-xs text-white/40">{e.s} strokes</span>
                </span>
            </Link>
        </li>
    );
}

const EXAMPLES = ["water", "mizu", "みず", "海", "日本", "tree"];

function EmptyState() {
    return (
        <div className="text-white/70 text-sm">
            <p className="mb-3">Try one of these:</p>
            <ul className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                    <li key={ex}>
                        <Link
                            href={searchPath(ex)}
                            className="inline-block px-3 py-1.5 rounded-full bg-white/5 border border-white/15 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-japanese"
                        >
                            {ex}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
