import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getAllKanji, getNeighbors } from "@/lib/atlas";
import { getStrokeDiagramSvg } from "@/lib/atlas/kanjivg";
import { browsePath, kanjiPath } from "@/lib/atlas/paths";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Breadcrumbs, PageShell } from "@/components/Atlas/PageShell";
import { PrevNextNav } from "@/components/Atlas/PrevNextNav";
import { TrackEvent } from "@/components/Atlas/TrackEvent";
import { kanjiTitle, layoutReadings } from "@/components/Kanji/readings";
import { ActionRow, KanjiHero } from "@/components/Kanji/KanjiHero";
import { ReadingBlocks } from "@/components/Kanji/ReadingBlocks";
import { BuildPlayer } from "@/components/Kanji/BuildPlayer";
import { StrokePlayer } from "@/components/Kanji/StrokePlayer";
import { Etymology, MemoryStory } from "@/components/Kanji/StoryBlocks";
import { AlsoBuiltOnBlocks, SameOnBlocks, SoundFamily } from "@/components/Kanji/KanjiLinks";
import { LookAlikeCompare } from "@/components/Kanji/LookAlikeCompare";
import { KanjiZh } from "@/components/Kanji/KanjiZh";
import { LearnLauncher } from "@/components/Learn/LearnLauncher";
import { getKanjiPageData } from "./data";

// Every kanji is prerendered; unknown chars 404. Percent-encoded URLs map to
// the same prerendered pages (Next normalizes the encoding).
export const dynamicParams = false;

interface PageProps {
    params: Promise<{ char: string }>;
}

export function generateStaticParams() {
    return getAllKanji().map((k) => ({ char: k.char }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const data = getKanjiPageData((await params).char);
    if (!data) return {};
    const title = kanjiTitle(data.kanji);
    const url = kanjiPath(data.kanji.char);
    return {
        title,
        description: data.description,
        alternates: { canonical: url },
        openGraph: { title, description: data.description, url, type: "article", siteName: SITE_NAME },
    };
}

function jsonLd(data: NonNullable<ReturnType<typeof getKanjiPageData>>): string {
    const { kanji } = data;
    const ld = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        name: kanji.char,
        alternateName: [...kanji.onyomi, ...kanji.kunyomi].map((r) => r.replace(/[.\-]/g, "")).filter(Boolean),
        description: data.meanings.slice(0, 4).join(", "),
        inLanguage: "ja",
        url: `${SITE_URL}${kanjiPath(kanji.char)}`,
        inDefinedTermSet: {
            "@type": "DefinedTermSet",
            name: `${SITE_NAME} kanji atlas`,
            url: `${SITE_URL}${browsePath()}`,
        },
    };
    // Keep "</script>" and friends out of the inline script.
    return JSON.stringify(ld).replace(/</g, "\\u003c");
}

const sectionTitle = "font-disp text-[28px] font-bold leading-tight text-ink";

export default async function KanjiPage({ params }: PageProps) {
    const data = getKanjiPageData((await params).char);
    if (!data) notFound();

    const { kanji, build } = data;
    const layout = layoutReadings(kanji.wordsByReading);
    const { prev, next } = getNeighbors(kanji.char);
    const strokeSvg = getStrokeDiagramSvg(kanji.char);
    const paths = data.strokes.strokes.map((s) => s.d);
    // With no parts to build from, the stroke animation takes the stage.
    const strokeOnStage = !build && paths.length > 0;
    const hasLinks = data.alsoBuiltOn.length > 0 || data.soundFamily || data.headedFamily || data.sameOn.length > 0 || data.lookAlikes.length > 0;
    const firstReading = layout.main[0];

    return (
        <PageShell className="max-w-6xl" style={{ "--tc": data.themeColor } as CSSProperties}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
            <TrackEvent name="kanji_viewed" properties={{ kanji: kanji.char, jlpt: kanji.jlpt, radical: kanji.radical?.key ?? null }} />
            <LearnLauncher data={data.learn} />

            <Breadcrumbs
                items={[
                    { href: "/", label: "Home" },
                    { href: browsePath({ jlpt: kanji.jlpt }), label: `JLPT ${kanji.jlpt}` },
                    { label: `${kanji.char} ${data.headline}` },
                ]}
            />

            {/* Hero: on phones glyph, meaning and readings come first; on desktop the build (or stroke order) sits on the left. */}
            <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)]">
                <div className="lg:col-start-2">
                    <KanjiHero kanji={kanji} headline={data.headline} meanings={data.meanings} parts={data.parts} />
                </div>

                <div className="lg:col-start-2">
                    <ReadingBlocks char={kanji.char} layout={layout} id="readings" />
                </div>

                <div className="lg:col-start-2">
                    <ActionRow char={kanji.char} />
                </div>

                {(build || strokeOnStage) && (
                    <section aria-labelledby="stage-title" className="lg:col-start-1 lg:row-span-3 lg:row-start-1">
                        {build ? (
                            <BuildPlayer
                                build={build}
                                title={
                                    <h2 id="stage-title" className="flex flex-wrap items-baseline gap-x-3">
                                        <span lang="ja" className="font-jp text-lg text-[var(--c)]">
                                            成り立ち
                                        </span>
                                        <span className="font-disp text-[22px] italic text-ink-2">How {kanji.char} was built</span>
                                    </h2>
                                }
                            />
                        ) : (
                            <>
                                <h2 id="stage-title" className="mb-4 flex flex-wrap items-baseline gap-x-3">
                                    <span lang="ja" className="font-jp text-lg text-[var(--c)]">
                                        筆順
                                    </span>
                                    <span className="font-disp text-[22px] italic text-ink-2">How to write {kanji.char}</span>
                                </h2>
                                <StrokePlayer char={kanji.char} paths={paths} className="lg:[&>div:first-child]:max-w-[420px]" />
                            </>
                        )}
                    </section>
                )}
            </div>

            {/* Etymology (sourced) and Memory story (mnemonic) stay apart. */}
            {(data.etymology || data.memory) && (
                <div className="mt-12 grid gap-4 md:grid-cols-2">
                    <Etymology etymology={data.etymology} char={kanji.char} />
                    {data.memory && <MemoryStory story={data.memory} className={data.etymology ? "" : "md:col-span-2 md:max-w-3xl"} />}
                </div>
            )}

            {/* Stroke order: glowing animation (unless it is already on stage), the static numbered diagram, Try writing. */}
            <section id="stroke-order" aria-labelledby="stroke-title" className="mt-12">
                <h2 id="stroke-title" className={sectionTitle}>
                    Stroke order
                </h2>
                {paths.length ? (
                    <div className="mt-5 grid items-start gap-8 md:grid-cols-2">
                        {!strokeOnStage && <StrokePlayer char={kanji.char} paths={paths} />}
                        {strokeSvg && (
                            <figure className={strokeOnStage ? "md:col-span-2 flex flex-col items-center gap-2 md:flex-row md:items-start md:gap-8" : "flex flex-col items-center gap-2"}>
                                <div
                                    className="aspect-square w-full max-w-[300px] rounded-xl border border-line bg-card p-2 text-ink [&>svg]:h-full [&>svg]:w-full"
                                    dangerouslySetInnerHTML={{ __html: strokeSvg }}
                                />
                                <figcaption className="text-center text-xs text-ink-3 md:max-w-[300px]">
                                    Numbers show the stroke order. Diagram:{" "}
                                    <a href="https://kanjivg.tagaini.net" className="underline underline-offset-2 hover:text-ink" rel="noopener">
                                        KanjiVG
                                    </a>{" "}
                                    (CC BY-SA 3.0)
                                </figcaption>
                            </figure>
                        )}
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-ink-3">No stroke order data is available for this kanji yet.</p>
                )}
            </section>

            {hasLinks && (
                <section aria-labelledby="links-title" className="mt-12 flex flex-col gap-8">
                    <h2 id="links-title" className={sectionTitle}>
                        Kanji connected to {kanji.char}
                    </h2>

                    {data.alsoBuiltOn.length > 0 && <AlsoBuiltOnBlocks groups={data.alsoBuiltOn} />}

                    {(data.soundFamily || data.headedFamily) && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-ink">Same sound part</h3>
                            {data.soundFamily && <SoundFamily char={kanji.char} family={data.soundFamily} />}
                            {data.headedFamily && <SoundFamily char={kanji.char} family={data.headedFamily} heads />}
                        </div>
                    )}

                    {data.sameOn.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-ink">Same on&apos;yomi</h3>
                            <SameOnBlocks groups={data.sameOn} />
                        </div>
                    )}

                    {data.lookAlikes.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-ink">Look-alikes</h3>
                            <LookAlikeCompare
                                char={kanji.char}
                                meaning={data.meanings[0] ?? ""}
                                reading={firstReading ? firstReading.reading.replace(/[.\-]/g, "") : ""}
                                paths={paths}
                                items={data.lookAlikes}
                            />
                        </div>
                    )}
                </section>
            )}

            {data.zh && (
                <div className="mt-12 max-w-3xl">
                    <KanjiZh char={kanji.char} facts={data.zh} />
                </div>
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
