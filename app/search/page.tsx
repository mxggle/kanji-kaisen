import type { Metadata } from "next";
import searchIndexData from "@/public/data/search-index.json";
import { getKanji } from "@/lib/atlas";
import { searchKanji, type SearchIndexEntry } from "@/lib/atlas/search";
import { searchPath } from "@/lib/atlas/paths";
import { PageShell } from "@/components/Atlas/PageShell";
import { TrackEvent } from "@/components/Atlas/TrackEvent";
import { InkPaint } from "@/components/Ink/InkPaint";
import { SearchBox } from "@/components/Search/SearchBox";
import { TileGrid } from "@/components/Browse/TileGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { InkLegend } from "@/components/ui/InkLegend";
import { KindLabel } from "@/components/ui/SectionHeader";
import type { KanjiTileData } from "@/components/ui/KanjiTile";

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

const EXAMPLES = ["water", "mizu", "みず", "休", "日本", "forest"];

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const q = await readQuery(searchParams);
    const results = q ? searchKanji(SEARCH_INDEX, q, { limit: RESULT_LIMIT }) : [];
    const tiles: KanjiTileData[] = results.map(({ entry }) => ({
        char: entry.c,
        meanings: entry.m,
        onyomi: entry.on,
        kunyomi: entry.kun,
        category: getKanji(entry.c)?.category ?? null,
    }));
    const count = results.length === RESULT_LIMIT ? `Top ${RESULT_LIMIT} kanji` : `${results.length} kanji`;

    return (
        <PageShell>
            {q && <TrackEvent name="search_performed" properties={{ query: q, result_count: results.length, source: "search_page" }} />}
            <InkPaint>
                <div className="flex flex-col gap-3 pt-8 pb-8 sm:pt-10">
                    <KindLabel jp="検索">Search</KindLabel>
                    <h1 className="type-title break-words">{q ? <>“{q}”</> : "Search kanji"}</h1>
                    <p className="max-w-[60ch] text-base leading-relaxed text-ink-2">
                        {q
                            ? "Kanji whose meaning, reading or form matches. Kana and romaji both work."
                            : "Type a kanji, an English meaning, kana or romaji: water, みず, mizu or 水."}
                    </p>
                    {/* Keyed by the query so the box resets when navigating between searches. */}
                    <SearchBox key={q} variant="hero" defaultValue={q} autoFocus={!q} className="mt-3" />
                </div>

                {!q ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-xs text-ink-3">Try</span>
                        {EXAMPLES.map((ex) => (
                            <Chip key={ex} href={searchPath(ex)}>
                                <span lang={/^[a-z]+$/.test(ex) ? undefined : "ja"}>{ex}</span>
                            </Chip>
                        ))}
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex max-w-[640px] flex-col items-start gap-3 rounded-2xl border border-line bg-card px-[22px] py-5">
                        <p className="text-[17px] font-bold text-ink">No kanji found for “{q}”.</p>
                        <p className="text-sm text-ink-2">Try a single English word, or a reading in kana or romaji. Browse can also filter by theme, radical and reading.</p>
                        <Button href="/browse" size="sm">
                            Browse all kanji
                        </Button>
                    </div>
                ) : (
                    <section aria-label="Results" className="flex flex-col gap-[18px]">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                            <p className="text-[17px] font-bold leading-snug text-ink">{count}</p>
                            <InkLegend className="sm:ml-auto" />
                        </div>
                        <TileGrid items={tiles} label={`Kanji for “${q}”`} />
                    </section>
                )}
            </InkPaint>
        </PageShell>
    );
}
