import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { getAllRadicals, getKanji, getRadical, decodeParam } from "@/lib/atlas";
import { isCategoryName, THEME_SHORT } from "@/lib/atlas/categories";
import { categoryPath, radicalPath } from "@/lib/atlas/paths";
import { FORMATION_LABELS, getRadicalAncientForms, getRadicalEtymology, STAGE_META } from "@/lib/story";
import { setPath } from "@/lib/teach-set";
import { PageShell } from "@/components/Atlas/PageShell";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { TrackEvent } from "@/components/Atlas/TrackEvent";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { InkPaint } from "@/components/Ink/InkPaint";
import { AtlasPath, type PathStep } from "@/components/Layout/AtlasPath";
import { Plate } from "@/components/Layout/Plate";
import { ShareCardButton } from "@/components/ShareCard/ShareCardButton";
import { getShareCardProps } from "@/components/ShareCard/getShareCardProps";
import { JourneyPlayer } from "@/components/Story/JourneyPlayer";
import { ActionBar } from "@/components/ui/ActionBar";
import { Button } from "@/components/ui/Button";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { MemoryStory } from "@/components/ui/MemoryStory";
import { PaintedBar } from "@/components/ui/PaintedBar";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { getRadicalJourney } from "@/components/Journey/data";
import { GrowthList, NeighbourCard, Placements, RadicalOrigin } from "@/components/Journey/blocks";
import { NextKanjiButton } from "@/components/Journey/NextKanjiButton";
import { RadicalKanjiGrid } from "@/components/Journey/RadicalKanjiGrid";
import { emptyJourneyNote, radicalKana, radicalTitle, romajiName, shortMeaning } from "@/components/Journey/radical";

type Params = { params: Promise<{ key: string }> };

export const dynamicParams = false;

/** Kanji on the printed sheet: the radical's most common ones. */
const PRINT_KANJI = 12;

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

/** "き ki" with a lang-tagged kana. */
function KanaName({ name }: { name: string }) {
    return (
        <>
            <span lang="ja" className="font-jp">
                {radicalKana(name)}
            </span>{" "}
            {romajiName(name)}
        </>
    );
}

export default async function RadicalPage({ params }: Params) {
    const view = getRadicalJourney(decodeParam((await params).key));
    if (!view) notFound();

    const { radical, stages, refs, shownNote, strokes, origin, growth, placements, kanji, insideCount, sideForms, neighbors } = view;
    const { char, category } = radical;
    const base = radical.variantOf;
    const theme = category ?? "";
    const themeShort = isCategoryName(category) ? THEME_SHORT[category] : theme;
    const title = radicalTitle(radical.meaning);
    const chars = kanji.map((k) => k.char).join("");
    const studyHref = `/study?radical=${encodeURIComponent(radical.key)}`;
    const studyLabel = kanji.length > 1 ? `Study all ${kanji.length}` : "Study it";
    const printHref = setPath("print", { chars: kanji.slice(0, PRINT_KANJI).map((k) => k.char), title: `${char} ${title}` });
    const cardKanji = getKanji(char);

    const steps: PathStep[] = [
        ...(category ? [{ label: category, short: themeShort, href: categoryPath(category), mark: { kind: "dot", category } } satisfies PathStep] : []),
        { label: shortMeaning(radical.meaning), mark: { kind: "seal", char, category, chars } },
    ];
    const neighbour = (r: typeof neighbors.prev, dir: "Previous" | "Next") =>
        r ? { href: radicalPath(r.key), glyph: r.char, label: `${dir} radical in ${themeShort}: ${r.char} ${shortMeaning(r.meaning)}` } : null;

    const specimen = (
        <div className="flex flex-col gap-3">
            <JourneyPlayer char={char} stages={stages} todayStrokes={strokes} refs={refs} emptyNote={emptyJourneyNote(char)} analyticsId={radical.key} />
            {shownNote && <p className="px-1 text-xs leading-normal text-ink-3">{shownNote}</p>}
        </div>
    );

    const reading = (
        <div className="flex flex-col gap-[22px]">
            <KindLabel jp="部首">Radical{category && <> · in {category}</>}</KindLabel>
            <div className="flex items-center gap-3.5 sm:gap-[22px]">
                <RadicalSeal char={char} size="lg" chars={chars} className="flex-none" orbClassName="max-sm:size-16 max-sm:text-[34px] min-[960px]:size-[120px] min-[960px]:text-[64px]" />
                <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
                    <h1 className="type-title text-balance">
                        <span lang="ja" className="sr-only">
                            {char}{" "}
                        </span>
                        {title}
                    </h1>
                    <p className="text-sm leading-snug text-ink-2">
                        <KanaName name={radical.name} />
                        {base && (
                            <>
                                {" "}
                                · side form of{" "}
                                <Link href={radicalPath(base.key)} className="text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-ink">
                                    <span lang="ja" className="font-jp">
                                        {base.char}
                                    </span>{" "}
                                    <KanaName name={base.name} />
                                </Link>
                            </>
                        )}
                        {sideForms.map((form) => (
                            <span key={form.key}>
                                {" "}
                                · as a side part{" "}
                                <Link href={radicalPath(form.key)} className="text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-ink">
                                    <KanaName name={form.name} />
                                </Link>
                            </span>
                        ))}
                    </p>
                </div>
            </div>
            <p className="flex flex-wrap gap-2">
                {strokes.length > 0 && <Tag>{strokes.length === 1 ? "1 stroke" : `${strokes.length} strokes`}</Tag>}
                {kanji.length > 0 && <Tag>Radical of {kanji.length} kanji</Tag>}
                {insideCount > 0 && <Tag>Part of {insideCount}</Tag>}
            </p>
            {kanji.length > 0 && (
                <PaintedBar
                    chars={chars}
                    caption
                    label={
                        <>
                            Your ink in{" "}
                            <span lang="ja" className="font-jp">
                                {char}
                            </span>
                        </>
                    }
                    className="max-w-[520px]"
                />
            )}
            {origin && <RadicalOrigin char={char} origin={origin} />}
            {radical.story && <MemoryStory>{radical.story}</MemoryStory>}
            <Placements char={char} items={placements} lead={radical.transformsMeaning || undefined} />
            <div className="flex flex-wrap items-center gap-2.5">
                {kanji.length > 0 && (
                    <>
                        <NextKanjiButton chars={chars} className="max-lg:hidden" />
                        <Button size="lg" href={studyHref} className="max-lg:hidden">
                            {studyLabel}
                        </Button>
                    </>
                )}
                <span aria-hidden className="flex-1 max-lg:hidden" />
                {kanji.length > 0 && (
                    <Button variant="quiet" href={printHref} prefetch={false} rel="nofollow" className="max-lg:-ml-2.5">
                        <Printer aria-hidden />
                        Print sheet
                    </Button>
                )}
                {cardKanji && (
                    <ShareCardButton {...getShareCardProps(cardKanji)} />
                )}
            </div>
        </div>
    );

    return (
        <InkPaint>
            <PageShell style={themeVars(category)}>
                <TrackEvent name="radical_viewed" properties={{ radical: radical.key, kanji_count: radical.kanji.length }} />
                <AtlasPath steps={steps} prev={neighbour(neighbors.prev, "Previous")} next={neighbour(neighbors.next, "Next")} />

                <Plate specimen={specimen} reading={reading} specimenLabel={`The journey of ${char}`} />

                {growth.length > 0 && (
                    <section aria-labelledby="grows-title" className="mt-16 flex flex-col gap-[22px] sm:mt-24">
                        <SectionHeader
                            jp="育つ"
                            id="grows-title"
                            title="What it grows into"
                            aside={
                                <>
                                    Built from{" "}
                                    <span lang="ja" className="font-jp">
                                        {char}
                                    </span>
                                    , with sourced origins
                                </>
                            }
                        />
                        <GrowthList radicalChar={char} items={growth} />
                    </section>
                )}

                {kanji.length > 0 && (
                    <section id="kanji" aria-labelledby="kanji-title" className="mt-16 flex scroll-mt-24 flex-col gap-[22px] sm:mt-24">
                        <SectionHeader
                            jp="一覧"
                            id="kanji-title"
                            title={
                                <>
                                    Every kanji with{" "}
                                    <span lang="ja" className="font-jp">
                                        {base?.char ?? char}
                                    </span>{" "}
                                    as its radical
                                </>
                            }
                            aside="Most used first"
                        />
                        <RadicalKanjiGrid tiles={kanji.map((k) => ({ char: k.char, jlpt: k.jlpt, tile: <KanjiTile kanji={k} /> }))} />
                    </section>
                )}

                {(neighbors.prev || neighbors.next) && (
                    <nav aria-label={`Other radicals in ${themeShort}`} className="mt-14 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-4">
                        <NeighbourCard radical={neighbors.prev} dir="prev" theme={themeShort} />
                        <NeighbourCard radical={neighbors.next} dir="next" theme={themeShort} />
                    </nav>
                )}

                {kanji.length > 0 && (
                    <ActionBar label={`Learn the ${char} radical`}>
                        <NextKanjiButton chars={chars} size="md" />
                        <Button href={studyHref}>{kanji.length > 1 ? `All ${kanji.length}` : "Study"}</Button>
                    </ActionBar>
                )}
            </PageShell>
        </InkPaint>
    );
}
