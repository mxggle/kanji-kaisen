import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, GraduationCap, Layers } from "lucide-react";
import { getAllRadicals, getRadical, getRadicalNeighbors, decodeParam } from "@/lib/atlas";
import { categoryPath, radicalPath } from "@/lib/atlas/paths";
import { PageShell, Breadcrumbs, Section } from "@/components/Atlas/PageShell";
import { StatBadge } from "@/components/Atlas/JlptBadge";
import { KanjiTileGrid } from "@/components/Atlas/KanjiTile";
import { RadicalStoryContent } from "@/components/Atlas/radical/RadicalStoryContent";
import { getThemeClass, getThemeStyle } from "@/components/Atlas/category/themeStyles";
import { TrackEvent } from "@/components/Atlas/TrackEvent";
import { atlasMetadata } from "@/components/Atlas/metadata";

type Params = { params: Promise<{ key: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllRadicals().map((r) => ({ key: r.key }));
}

export async function generateMetadata({ params }: Params) {
    const radical = getRadical(decodeParam((await params).key));
    if (!radical) return {};
    const meaning = radical.meaning.toLowerCase();
    const count = radical.kanji.length;
    const kanjiPart = count > 0 ? ` ${count} kanji use it, including ${radical.kanji.slice(0, 4).map((k) => k.char).join(" ")}.` : "";
    return atlasMetadata({
        title: `${radical.char} ${radical.name} radical – ${meaning}: meaning, story & kanji`,
        description: `The ${radical.char} (${radical.name}) radical means ${meaning}.${kanjiPart} ${radical.transformsMeaning || radical.story}`,
        path: radicalPath(radical.key),
    });
}

export default async function RadicalPage({ params }: Params) {
    const radical = getRadical(decodeParam((await params).key));
    if (!radical) notFound();

    const { prev, next } = getRadicalNeighbors(radical.key);
    const theme = getThemeStyle(radical.category);
    const themeClass = getThemeClass(radical.category);
    const base = radical.variantOf;

    return (
        <PageShell>
            <TrackEvent name="radical_viewed" properties={{ radical: radical.key, kanji_count: radical.kanji.length }} />
            <Breadcrumbs
                items={[
                    { href: "/", label: "Home" },
                    { href: "/radicals", label: "Radicals" },
                    { label: `${radical.char} ${radical.name}` },
                ]}
            />

            {/* Hero */}
            <header className={`relative overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-b ${theme.tint} to-transparent px-6 py-10 text-center`}>
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none" aria-hidden>
                    <span className="text-[16rem] leading-none font-japanese">{radical.char}</span>
                </div>
                <div className="relative">
                    <div className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-black/30 backdrop-blur-md border border-white/10 mb-4">
                        <span className="text-6xl sm:text-7xl font-japanese text-white">{radical.char}</span>
                    </div>
                    <h1 className={`text-3xl font-bold mb-1 ${theme.title}`}>
                        {radical.name} <span className="sr-only">radical ({radical.char})</span>
                    </h1>
                    <p className="text-white/70 text-lg mb-4">{radical.meaning}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <StatBadge>{radical.kanji.length} kanji</StatBadge>
                        {radical.category && (
                            <Link href={categoryPath(radical.category)} className="hover:opacity-80">
                                <StatBadge className={theme.title}>Theme: {radical.category}</StatBadge>
                            </Link>
                        )}
                    </div>
                    {radical.kanji.length > 0 && (
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                href={`/study?radical=${encodeURIComponent(radical.key)}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold hover:opacity-90 transition-opacity"
                            >
                                <GraduationCap size={18} aria-hidden /> Study these
                            </Link>
                            <a
                                href="#kanji"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors"
                            >
                                <Layers size={18} aria-hidden /> See all {radical.kanji.length} kanji
                            </a>
                        </div>
                    )}
                </div>
            </header>

            {base && (
                <p className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
                    {radical.name} is the left-side form of{" "}
                    <Link href={radicalPath(base.key)} className="text-[var(--accent)] hover:underline font-medium">
                        <span className="font-japanese">{base.char}</span> {base.name}
                    </Link>
                    . The kanji below are shared with {base.name}.
                </p>
            )}

            {radical.hasStory ? (
                <div className="mt-10">
                    <RadicalStoryContent story={radical} themeClass={themeClass} headingAs="h2" />
                </div>
            ) : (
                <p className="mt-10 text-white/50">A story for this radical is coming soon.</p>
            )}

            <Section title={`Kanji with ${radical.char} ${radical.name}`} id="kanji" className="scroll-mt-24">
                <p className="text-white/50 text-sm mb-4">Sorted by JLPT level, then by how common they are.</p>
                <KanjiTileGrid items={radical.kanji} />
            </Section>

            {/* Prev / next */}
            <nav aria-label="Other radicals" className="mt-12 grid grid-cols-2 gap-3">
                {prev ? (
                    <Link href={radicalPath(prev.key)} className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--accent)] transition-colors min-w-0">
                        <ArrowLeft size={18} className="text-white/40 group-hover:text-[var(--accent)] flex-shrink-0" aria-hidden />
                        <span className="text-2xl font-japanese">{prev.char}</span>
                        <span className="min-w-0">
                            <span className="block text-xs text-white/40">Previous</span>
                            <span className="block truncate">{prev.name}</span>
                        </span>
                    </Link>
                ) : <span />}
                {next ? (
                    <Link href={radicalPath(next.key)} className="group flex items-center justify-end gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--accent)] transition-colors text-right min-w-0">
                        <span className="min-w-0">
                            <span className="block text-xs text-white/40">Next</span>
                            <span className="block truncate">{next.name}</span>
                        </span>
                        <span className="text-2xl font-japanese">{next.char}</span>
                        <ArrowRight size={18} className="text-white/40 group-hover:text-[var(--accent)] flex-shrink-0" aria-hidden />
                    </Link>
                ) : <span />}
            </nav>
        </PageShell>
    );
}
