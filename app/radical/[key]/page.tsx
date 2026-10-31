import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAllRadicals, getRadical, decodeParam } from "@/lib/atlas";
import { getCategoryImage, isCategoryName, THEME_SHORT } from "@/lib/atlas/categories";
import { categoryPath, radicalPath } from "@/lib/atlas/paths";
import { FORMATION_LABELS, getRadicalAncientForms, getRadicalEtymology, STAGE_META } from "@/lib/story";
import { Breadcrumbs } from "@/components/Atlas/PageShell";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { TrackEvent } from "@/components/Atlas/TrackEvent";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { ThemeScroll } from "@/components/Ink/ThemeScroll";
import { JourneyPlayer } from "@/components/Story/JourneyPlayer";
import { shadeGradient, ThemeImage } from "@/components/Theme/parts";
import { getRadicalJourney } from "@/components/Journey/data";
import { GrowsIntoList, MemoryStoryBlock, OriginBlock, RadicalHead } from "@/components/Journey/blocks";
import { RadicalKanjiGrid } from "@/components/Journey/RadicalKanjiGrid";
import { emptyJourneyNote, positionPhrase, radicalHeadline } from "@/components/Journey/radical";

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
    const oldest = getRadicalAncientForms(radical.key, radical.char)?.stages[0]?.stage;
    const formation = getRadicalEtymology(radical.key, radical.char)?.formation;
    const parts = [
        `The ${radical.char} (${radical.name}) radical means ${meaning}.`,
        oldest ? `See it change from ${STAGE_META[oldest].en.toLowerCase()} script to today.` : "",
        formation ? `Origin: ${FORMATION_LABELS[formation].en.toLowerCase()}.` : "",
        count > 0 ? `${count} kanji use it, including ${radical.kanji.slice(0, 4).map((k) => k.char).join(" ")}.` : "",
    ];
    return atlasMetadata({
        title: `${radical.char} ${radical.name} radical – ${meaning}: ${oldest ? "ancient forms, " : ""}story & kanji`,
        description: parts.filter(Boolean).join(" "),
        path: radicalPath(radical.key),
    });
}

export default async function RadicalPage({ params }: Params) {
    const view = getRadicalJourney(decodeParam((await params).key));
    if (!view) notFound();

    const { radical, stages, captions, shownNote, strokes, origin, grows, kanji, sideForms, theme, neighbors } = view;
    const { char, name, category } = radical;
    const base = radical.variantOf;
    const themeShort = isCategoryName(category) ? THEME_SHORT[category] : category;
    const position = positionPhrase(radical.position);
    const counts = [
        base ? `Side form of ${base.char} ${base.name} · ${kanji.length} kanji` : `Radical in ${kanji.length} kanji`,
        position,
    ]
        .filter(Boolean)
        .join(" · ");

    const title = (
        <>
            <span className="flex items-center lg:hidden">
                {category && (
                    <Link
                        href={categoryPath(category)}
                        aria-label={`Back to ${category}`}
                        className="-ml-3 flex size-11 items-center justify-center text-lg text-ink-2 hover:text-ink"
                    >
                        <span aria-hidden>←</span>
                    </Link>
                )}
                <span className="text-sm text-ink-2">
                    Radical <span lang="ja" className="font-jp text-ink">{char}</span>
                    {themeShort && <> · {themeShort}</>}
                </span>
            </span>
            <span className="hidden items-baseline gap-3.5 lg:flex">
                <span lang="ja" className="font-jp text-lg text-c">字の旅</span>
                <span className="font-disp text-[22px] italic text-ink-2">
                    {stages.length > 0 ? `The journey of ${char}` : `${char} as it is written today`}
                </span>
            </span>
        </>
    );

    return (
        <div style={themeVars(category)} className="relative isolate text-ink">
            <TrackEvent name="radical_viewed" properties={{ radical: radical.key, kanji_count: radical.kanji.length }} />

            {/* Theme art behind the journey: a banner on phones, the top left on desktop (Story-Radical, M-Story). */}
            {category && (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden lg:h-[820px]">
                    <div className="absolute -left-[20%] -top-[2%] h-[64%] w-[140%] opacity-40 blur-[3px] lg:-left-[8%] lg:-top-[14%] lg:h-full lg:w-[70%] lg:opacity-50 lg:blur-[2px]">
                        <ThemeImage src={getCategoryImage(category)} sizes="(min-width: 1024px) 70vw, 140vw" className="object-[50%_30%]" />
                    </div>
                    <div
                        className="absolute inset-0 lg:hidden"
                        style={{ background: shadeGradient("180deg", [[0.4, 0], [0.55, 40], [0.98, 62], [1, 100]]) }}
                    />
                    <div
                        className="absolute inset-0 hidden lg:block"
                        style={{
                            background: `${shadeGradient("0deg", [[1, 0], [0, 40]])}, ${shadeGradient("90deg", [[0.35, 0], [0.6, 45], [0.97, 62], [1, 100]])}`,
                        }}
                    />
                </div>
            )}

            <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-[68px] lg:px-8 lg:pt-24">
                <div className="hidden lg:block">
                    <Breadcrumbs
                        items={[
                            { href: "/", label: "Learn" },
                            ...(category ? [{ href: categoryPath(category), label: category }] : []),
                            { label: `Radical ${char}` },
                        ]}
                    />
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_560px]">
                    {/* The journey: sourced ancient forms, then today's strokes. */}
                    <section
                        aria-label={`How ${char} changed over time`}
                        className="min-w-0 [--kkj-size:280px] sm:[--kkj-size:400px] lg:[--kkj-size:520px]"
                    >
                        <JourneyPlayer
                            char={char}
                            stages={stages}
                            todayStrokes={strokes}
                            captions={captions}
                            title={title}
                            emptyNote={emptyJourneyNote(char)}
                        />
                        {shownNote && <p className="mt-3 text-xs text-ink-3">{shownNote}</p>}
                    </section>

                    {/* The radical. On phones the head and "grows into" share a card (M-Story);
                        on desktop the card dissolves and Origin and Memory story sit above the list. */}
                    <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
                        <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-5 lg:contents">
                            <RadicalHead
                                char={char}
                                headline={radicalHeadline(name, radical.meaning)}
                                counts={counts}
                                uses={radical.transformsMeaning}
                                className="lg:order-1"
                            />
                            <GrowsIntoList char={char} items={grows} total={kanji.length} className="lg:order-4" />
                        </div>
                        {origin && <OriginBlock char={char} origin={origin} className="lg:order-2" />}
                        <MemoryStoryBlock story={radical.story} picture={radical.origin} className="lg:order-3" />
                        {theme && <ThemeScroll theme={theme.name} chars={theme.chars} className="lg:order-5" />}
                    </div>
                </div>

                {/* Below the fold: every kanji, side forms, neighbours. */}
                <section id="kanji" aria-labelledby="kanji-title" className="mt-16 scroll-mt-24 lg:mt-24">
                    <h2 id="kanji-title" className="font-disp text-3xl font-bold lg:text-4xl">
                        Every kanji with <span lang="ja" className="font-jp">{char}</span> {name}
                    </h2>
                    <p className="mb-5 mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">
                        {kanji.length > 0 ? `${kanji.length} kanji, most common first.` : "No kanji here yet."}
                        {base && (
                            <>
                                {" "}
                                {name} is the side form of{" "}
                                <Link href={radicalPath(base.key)} className="text-ink underline decoration-line-2 underline-offset-4 hover:decoration-c">
                                    <span lang="ja" className="font-jp">{base.char}</span> {base.name}
                                </Link>
                                , so these are {base.name}&apos;s kanji.
                            </>
                        )}
                        {sideForms.length > 0 && (
                            <>
                                {" "}
                                Also written as a side form:{" "}
                                {sideForms.map((form, i) => (
                                    <span key={form.key}>
                                        {i > 0 && ", "}
                                        <Link href={radicalPath(form.key)} className="text-ink underline decoration-line-2 underline-offset-4 hover:decoration-c">
                                            {form.name}
                                        </Link>
                                    </span>
                                ))}
                                .
                            </>
                        )}
                    </p>
                    {kanji.length > 0 && (
                        <RadicalKanjiGrid
                            chars={kanji.map((k) => k.char).join("")}
                            meanings={kanji.map((k) => k.meanings[0] ?? "")}
                            studyHref={`/study?radical=${encodeURIComponent(radical.key)}`}
                        />
                    )}
                </section>

                <nav aria-label="Other radicals" className="mt-14 grid grid-cols-2 gap-3">
                    {neighbors.prev ? (
                        <Link
                            href={radicalPath(neighbors.prev.key)}
                            style={themeVars(neighbors.prev.category)}
                            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-c"
                        >
                            <ArrowLeft size={18} className="flex-shrink-0 text-ink-3 group-hover:text-c" aria-hidden />
                            <span lang="ja" className="font-jp text-2xl font-extrabold">{neighbors.prev.char}</span>
                            <span className="min-w-0">
                                <span className="block text-xs text-ink-3">Previous</span>
                                <span className="block truncate">{neighbors.prev.name}</span>
                            </span>
                        </Link>
                    ) : (
                        <span />
                    )}
                    {neighbors.next ? (
                        <Link
                            href={radicalPath(neighbors.next.key)}
                            style={themeVars(neighbors.next.category)}
                            className="group flex min-w-0 items-center justify-end gap-3 rounded-2xl border border-line bg-card p-4 text-right transition-colors hover:border-c"
                        >
                            <span className="min-w-0">
                                <span className="block text-xs text-ink-3">Next</span>
                                <span className="block truncate">{neighbors.next.name}</span>
                            </span>
                            <span lang="ja" className="font-jp text-2xl font-extrabold">{neighbors.next.char}</span>
                            <ArrowRight size={18} className="flex-shrink-0 text-ink-3 group-hover:text-c" aria-hidden />
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            </div>
        </div>
    );
}
