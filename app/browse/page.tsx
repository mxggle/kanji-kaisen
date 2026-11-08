import type { Metadata } from "next";
import { getAllKanji, getAllRadicals } from "@/lib/atlas";
import { PageShell } from "@/components/Atlas/PageShell";
import { InkPaint } from "@/components/Ink/InkPaint";
import { BrowseClient } from "@/components/Browse/BrowseClient";
import { browseHeading, parseBrowseParams, toBrowseKanji, toBrowseQuery } from "@/components/Browse/filters";
import type { RadicalOption } from "@/components/Browse/radicals";

interface BrowsePageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: BrowsePageProps): Promise<Metadata> {
    const filters = parseBrowseParams(await searchParams);
    const level = filters.jlpt.length === 1 ? filters.jlpt[0] : null;
    const total = getAllKanji().filter((k) => !level || k.jlpt === level).length;
    return {
        title: browseHeading(filters),
        description: level
            ? `All ${total} JLPT ${level} kanji with meanings and readings. Filter by stroke count, theme, radical or reading and open any kanji for stroke order and examples.`
            : `Browse all ${total} JLPT kanji by level, theme, radical, reading or stroke count. Every kanji links to its meanings, readings, stroke order and examples.`,
        alternates: { canonical: level ? `/browse?jlpt=${level}` : "/browse" },
        openGraph: {
            title: browseHeading(filters),
            url: level ? `/browse?jlpt=${level}` : "/browse",
            type: "website",
            siteName: "Kanji Kaisen",
        },
    };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
    const filters = parseBrowseParams(await searchParams);
    const items = getAllKanji().map(toBrowseKanji);
    const radicals: RadicalOption[] = getAllRadicals()
        .filter((r) => r.kanjiCount > 0)
        .map((r) => ({ key: r.key, char: r.char, name: r.name, meaning: r.meaning, count: r.kanjiCount, category: r.category }));

    return (
        <PageShell>
            <InkPaint>
                {/* Keyed by the query so client-side navigation to another filter URL resets the island. */}
                <BrowseClient key={toBrowseQuery(filters)} items={items} initialFilters={filters} radicals={radicals} />
            </InkPaint>
        </PageShell>
    );
}
