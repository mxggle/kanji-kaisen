import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getAllKanji, getKanji, getKanjiByRadical, getNeighbors, getRadical } from "@/lib/atlas";
import type { AtlasKanji } from "@/lib/atlas/types";
import { getStrokeDiagramSvg } from "@/lib/atlas/kanjivg";
import { browsePath, categoryPath, kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { readingToRomaji, plainReading } from "@/lib/atlas/readings";
import { Breadcrumbs, PageShell, Section } from "@/components/Atlas/PageShell";
import { JlptBadge, StatBadge } from "@/components/Atlas/JlptBadge";
import { KanjiTileGrid } from "@/components/Atlas/KanjiTile";
import { RadicalChip } from "@/components/Atlas/RadicalChip";
import { PrevNextNav } from "@/components/Atlas/PrevNextNav";
import { ReadingList } from "@/components/Atlas/kanji/ReadingList";
import { ExampleList } from "@/components/Atlas/kanji/ExampleList";
import { StrokeOrderPanel } from "@/components/Atlas/kanji/StrokeOrderPanel";
import { firstSentences, truncate } from "@/components/Atlas/kanji/summary";
import { StudyControls } from "@/components/Atlas/kanji/StudyControls";
import { TrackEvent } from "@/components/Atlas/TrackEvent";

// Every kanji is prerendered; unknown chars 404. Percent-encoded URLs map to
// the same prerendered pages (Next normalizes the encoding).
export const dynamicParams = false;

const SAME_RADICAL_LIMIT = 24;

interface PageProps {
    params: Promise<{ char: string }>;
}

export function generateStaticParams() {
    return getAllKanji().map((k) => ({ char: k.char }));
}

const readingSummary = (readings: string[]) =>
    readings.slice(0, 3).map((r) => `${plainReading(r)} (${readingToRomaji(r).replace(/-/g, "")})`).join(", ");

function describe(kanji: AtlasKanji): string {
    const parts = [`${kanji.char} means ${kanji.meanings.slice(0, 3).join(", ")}.`];
    if (kanji.onyomi.length) parts.push(`On'yomi: ${readingSummary(kanji.onyomi)}.`);
    if (kanji.kunyomi.length) parts.push(`Kun'yomi: ${readingSummary(kanji.kunyomi)}.`);
    parts.push(`JLPT ${kanji.jlpt}, ${kanji.strokeCount} strokes, with stroke order and example words.`);
    return truncate(parts.join(" "), 160);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const kanji = getKanji((await params).char);
    if (!kanji) return {};
    const title = `${kanji.char} – ${kanji.meanings.slice(0, 2).join(", ")}: stroke order, readings & examples`;
    const description = describe(kanji);
    const url = kanjiPath(kanji.char);
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: "article" },
    };
}

export default async function KanjiPage({ params }: PageProps) {
    const kanji = getKanji((await params).char);
    if (!kanji) notFound();

    const radical = kanji.radical ? getRadical(kanji.radical.key) : null;
    const sameRadical = kanji.radical ? getKanjiByRadical(kanji.radical.key).filter((k) => k.char !== kanji.char) : [];
    const { prev, next } = getNeighbors(kanji.char);
    const strokeSvg = getStrokeDiagramSvg(kanji.char);
    const storySummary = radical ? firstSentences(radical.story || radical.origin, 2) : "";

    return (
        <PageShell>
            <Breadcrumbs
                items={[
                    { href: "/", label: "Home" },
                    { href: browsePath(), label: "Browse" },
                    { href: browsePath({ jlpt: kanji.jlpt }), label: `JLPT ${kanji.jlpt}` },
                    { label: kanji.char },
                ]}
            />

            {/* Hero */}
            <header className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <div className="aspect-square w-40 sm:w-48 shrink-0 self-center flex items-center justify-center bg-white/5 rounded-3xl border border-white/10 text-8xl sm:text-9xl font-bold font-japanese" aria-hidden>
                    {kanji.char}
                </div>
                <div className="min-w-0 space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-bold break-words">
                        <span className="sr-only">{kanji.char}: </span>
                        {kanji.meanings.slice(0, 4).join(", ")}
                    </h1>
                    {kanji.meanings.length > 4 && (
                        <p className="text-white/60">Also: {kanji.meanings.slice(4).join(", ")}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <JlptBadge level={kanji.jlpt} />
                        {kanji.grade !== null && <StatBadge>Grade {kanji.grade}</StatBadge>}
                        <StatBadge>{kanji.strokeCount} strokes</StatBadge>
                        {kanji.frequency !== null && (
                            <StatBadge>
                                <span title="Rank among the 2,500 most used kanji in newspapers">Frequency #{kanji.frequency}</span>
                            </StatBadge>
                        )}
                    </div>
                    <StudyControls char={kanji.char} />
                    <TrackEvent name="kanji_viewed" properties={{ kanji: kanji.char, jlpt: kanji.jlpt, radical: kanji.radical?.key ?? null }} />
                </div>
            </header>

            <Section title="Readings">
                <div className="grid sm:grid-cols-2 gap-6">
                    <ReadingList label="On'yomi" hint="Chinese-derived" readings={kanji.onyomi} />
                    <ReadingList label="Kun'yomi" hint="native Japanese" readings={kanji.kunyomi} />
                </div>
                {kanji.kunyomi.some((r) => r.includes(".")) && (
                    <p className="mt-3 text-xs text-white/40">Faded kana are okurigana, written in hiragana after the kanji.</p>
                )}
            </Section>

            <Section title="Stroke order" id="stroke-order">
                {strokeSvg ? (
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <figure className="flex flex-col items-center gap-2">
                            <div
                                className="w-full max-w-[300px] aspect-square p-2 rounded-xl bg-white/5 border border-white/10 text-white [&>svg]:w-full [&>svg]:h-full"
                                dangerouslySetInnerHTML={{ __html: strokeSvg }}
                            />
                            <figcaption className="text-xs text-white/50 text-center">
                                Numbers show stroke order. Diagram:{" "}
                                <a href="https://kanjivg.tagaini.net" className="underline hover:text-[var(--accent)]" rel="noopener">KanjiVG</a>{" "}
                                (CC BY-SA 3.0)
                            </figcaption>
                        </figure>
                        <StrokeOrderPanel char={kanji.char} />
                    </div>
                ) : (
                    <p className="text-white/50 text-sm">No stroke order data is available for this kanji yet.</p>
                )}
            </Section>

            <Section title="Example words">
                {kanji.examples.length > 0 ? (
                    <ExampleList examples={kanji.examples} />
                ) : (
                    <p className="text-white/50 text-sm">No example words for this kanji yet.</p>
                )}
            </Section>

            <Section title="Composition">
                {radical ? (
                    <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-white/50">Radical</span>
                            <RadicalChip radical={{ key: radical.key, char: radical.char, name: radical.name, meaning: radical.meaning }} />
                        </div>
                        {storySummary && <p className="text-white/80 leading-relaxed">{storySummary}</p>}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            {radical.hasStory && (
                                <Link href={radicalPath(radical.key)} className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline">
                                    Read the full story <ArrowRight size={14} aria-hidden />
                                </Link>
                            )}
                            {kanji.category && (
                                <Link href={categoryPath(kanji.category)} className="inline-flex items-center gap-1 text-white/70 hover:text-[var(--accent)]">
                                    Theme: {kanji.category} <ArrowRight size={14} aria-hidden />
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-white/50 text-sm">No radical is assigned to this character.</p>
                )}
            </Section>

            {radical && sameRadical.length > 0 && (
                <Section title={`Other kanji with ${radical.char}`}>
                    <KanjiTileGrid items={sameRadical.slice(0, SAME_RADICAL_LIMIT)} />
                    {sameRadical.length > SAME_RADICAL_LIMIT && (
                        <Link href={radicalPath(radical.key)} className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
                            See all {sameRadical.length + 1} kanji with {radical.char} <ArrowRight size={14} aria-hidden />
                        </Link>
                    )}
                </Section>
            )}

            <PrevNextNav
                ariaLabel={`More JLPT ${kanji.jlpt} kanji`}
                caption={`More JLPT ${kanji.jlpt} kanji, by frequency`}
                prev={prev && { href: kanjiPath(prev.char), char: prev.char, label: prev.meanings[0] }}
                next={next && { href: kanjiPath(next.char), char: next.char, label: next.meanings[0] }}
            />
        </PageShell>
    );
}
