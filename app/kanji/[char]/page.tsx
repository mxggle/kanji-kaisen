import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllKanji } from "@/lib/atlas";
import { browsePath, kanjiPath } from "@/lib/atlas/paths";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { PageShell } from "@/components/Atlas/PageShell";
import { TrackEvent } from "@/components/Atlas/TrackEvent";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { InkPaint } from "@/components/Ink/InkPaint";
import { AtlasPath, type PathStep } from "@/components/Layout/AtlasPath";
import { Plate } from "@/components/Layout/Plate";
import { kanjiTitle, layoutReadings } from "@/components/Kanji/readings";
import { KanjiHero } from "@/components/Kanji/KanjiHero";
import { KanjiReadings } from "@/components/Kanji/ReadingBlocks";
import { KanjiActionBar, KanjiActions } from "@/components/Kanji/KanjiActions";
import { KanjiView, KanjiViewPanel, KanjiViewTabs, type KanjiViewValue } from "@/components/Kanji/KanjiView";
import { BuildPlayer } from "@/components/Kanji/BuildPlayer";
import { StrokePlayer } from "@/components/Kanji/StrokePlayer";
import { AncientTab } from "@/components/Kanji/AncientTab";
import { KanjiOrigin } from "@/components/Kanji/KanjiOrigin";
import { KanjiConnections } from "@/components/Kanji/KanjiLinks";
import { KanjiZh } from "@/components/Kanji/KanjiZh";
import { KanjiNeighbours } from "@/components/Kanji/KanjiNeighbours";
import { LearnLauncher } from "@/components/Learn/LearnLauncher";
import { getShareCardProps } from "@/components/ShareCard/getShareCardProps";
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

export default async function KanjiPage({ params }: PageProps) {
    const data = getKanjiPageData((await params).char);
    if (!data) notFound();

    const { kanji, build, journey, path, siblings } = data;
    const layout = layoutReadings(kanji.wordsByReading);
    const paths = data.strokes.strokes.map((s) => s.d);
    const card = getShareCardProps(kanji);
    const meaning = data.meanings[0] ?? data.headline;

    // Specimen tabs: Parts · Strokes · Ancient on desktop, Readings · Strokes · Ancient on phones.
    const deskTabs = [build && "parts", paths.length > 0 && "strokes", journey && "ancient"].filter((v): v is KanjiViewValue => Boolean(v));
    const phoneCount = deskTabs.filter((v) => v !== "parts").length + 1;
    const tabs: KanjiViewValue[] = deskTabs[0] === "parts" ? ["parts", "readings", ...deskTabs.slice(1)] : ["readings", ...deskTabs];

    const steps: PathStep[] = [];
    if (path.theme) steps.push({ label: path.theme.name, short: path.theme.short, href: path.theme.href, mark: { kind: "dot", category: path.theme.name } });
    if (path.radical) {
        steps.push({
            label: path.radical.label,
            href: path.radical.href,
            mark: { kind: "seal", char: path.radical.char, category: path.radical.category, chars: path.radical.chars },
        });
    }
    steps.push({ label: meaning, mark: { kind: "glyph", char: kanji.char } });
    const within = path.radical ? ` in ${path.radical.char}` : "";
    const neighbour = (s: typeof siblings.prev, dir: string) =>
        s && { href: s.href, glyph: s.char, label: `${dir}${within}: ${s.char} ${s.meaning}` };

    return (
        <InkPaint>
            <PageShell style={themeVars(kanji.category)}>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
                <TrackEvent name="kanji_viewed" properties={{ kanji: kanji.char, jlpt: kanji.jlpt, radical: kanji.radical?.key ?? null }} />
                <LearnLauncher data={data.learn} />

                <AtlasPath steps={steps} prev={neighbour(siblings.prev, "Previous")} next={neighbour(siblings.next, "Next")} />

                <KanjiView desk={deskTabs[0] ?? "strokes"}>
                    <Plate
                        phoneOrder="after-hero"
                        hero={<KanjiHero kanji={kanji} headline={data.headline} meanings={data.meanings} parts={data.parts} />}
                        specimen={
                            deskTabs.length ? (
                                // Entrance: beside the hero on desktop (the parts inside then assemble);
                                // on phones it is the tab row under the hero's parts, so it waits for them.
                                <div
                                    data-enter
                                    className="flex flex-col gap-4 [--delay:60ms] [--rise:12px] max-[959px]:[--delay:340ms] min-[960px]:rounded-2xl min-[960px]:border min-[960px]:border-line min-[960px]:bg-card min-[960px]:p-5"
                                >
                                    <KanjiViewTabs
                                        values={tabs}
                                        className={[deskTabs.length < 2 && "min-[960px]:hidden", phoneCount < 2 && "max-[959px]:hidden"].filter(Boolean).join(" ")}
                                    />
                                    {build && (
                                        <KanjiViewPanel value="parts">
                                            <BuildPlayer build={build} />
                                        </KanjiViewPanel>
                                    )}
                                    {paths.length > 0 && (
                                        <KanjiViewPanel value="strokes">
                                            <StrokePlayer char={kanji.char} paths={paths} numbers={data.strokes.numbers} />
                                        </KanjiViewPanel>
                                    )}
                                    {journey && (
                                        <KanjiViewPanel value="ancient">
                                            <AncientTab char={kanji.char} journey={journey} todayStrokes={paths} />
                                        </KanjiViewPanel>
                                    )}
                                </div>
                            ) : null
                        }
                        reading={
                            <div className="flex flex-col gap-[22px]">
                                <KanjiViewPanel value="readings">
                                    <KanjiReadings char={kanji.char} layout={layout} />
                                </KanjiViewPanel>
                                <KanjiActions char={kanji.char} card={card} />
                            </div>
                        }
                    />
                </KanjiView>
                <KanjiActionBar char={kanji.char} card={card} />

                <KanjiOrigin etymology={data.etymology} memory={data.memory} className="mt-16 min-[960px]:mt-24" />

                <KanjiConnections
                    char={kanji.char}
                    meaning={meaning}
                    paths={paths}
                    alsoBuiltOn={data.alsoBuiltOn}
                    soundFamily={data.soundFamily}
                    headedFamily={data.headedFamily}
                    sameOn={data.sameOn}
                    lookAlikes={data.lookAlikes}
                    className="mt-16 min-[960px]:mt-24"
                />

                {data.zh && <KanjiZh char={kanji.char} facts={data.zh} className="mt-16" />}

                {path.radical && <KanjiNeighbours prev={siblings.prev} next={siblings.next} radical={path.radical} className="mt-10" />}
            </PageShell>
        </InkPaint>
    );
}
