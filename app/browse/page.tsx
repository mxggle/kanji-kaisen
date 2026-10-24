import type { Metadata } from "next";
import { getAllKanji, getAllRadicals, getCategories } from "@/lib/atlas";
import { PageShell, Breadcrumbs } from "@/components/Atlas/PageShell";
import { BrowseClient, type BrowseOption } from "@/components/Browse/BrowseClient";
import { browseHeading, parseBrowseParams, toBrowseKanji, toBrowseQuery } from "@/components/Browse/filters";

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
            ? `All ${total} JLPT ${level} kanji with meanings and readings. Filter by stroke count, theme or radical and open any kanji for stroke order and examples.`
            : `Browse all ${total} JLPT kanji by level, stroke count, frequency, theme or radical. Every kanji links to its meanings, readings, stroke order and examples.`,
        alternates: { canonical: level ? `/browse?jlpt=${level}` : "/browse" },
    };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
    const filters = parseBrowseParams(await searchParams);
    const items = getAllKanji().map(toBrowseKanji);
    const themes: BrowseOption[] = getCategories().map((c) => ({ value: c.slug, label: c.name }));
    const radicals: BrowseOption[] = getAllRadicals()
        .filter((r) => r.kanjiCount > 0)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ value: r.key, label: `${r.char} ${r.name} (${r.kanjiCount})` }));

    return (
        <PageShell className="max-w-6xl">
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Browse" }]} />
            {/* Keyed by the query so client-side navigation to another filter URL resets the island. */}
            <BrowseClient key={toBrowseQuery(filters)} items={items} initialFilters={filters} themes={themes} radicals={radicals} />
        </PageShell>
    );
}
