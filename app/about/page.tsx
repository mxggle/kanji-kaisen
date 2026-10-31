import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAllKanji, getAllRadicals } from "@/lib/atlas";
import { CATEGORIES, THEME_SHORT, getThemeColor } from "@/lib/atlas/categories";
import { DocumentPage, DocumentSection, PROSE_LINK } from "@/components/Layout/Document";
import { InkLegend } from "@/components/ui/InkLegend";
import { MemoryStory } from "@/components/ui/MemoryStory";
import { OriginCard } from "@/components/ui/OriginCard";
import { PartChip, PartPlus } from "@/components/ui/PartChip";

export const metadata: Metadata = {
    title: "About & credits",
    description: "What Kanji Kaisen is, how it explains kanji through radicals, and the open data it is built on: KanjiVG, Kanji alive, KANJIDIC2, JMdict, Unihan, Wiktionary, Wikimedia Commons and Academia Sinica 小學堂.",
    alternates: { canonical: "/about" },
};

interface Source {
    name: string;
    href: string;
    author: string;
    usedFor: string;
    license: string;
    licenseHref: string;
}

// Licenses checked against each project's own README/licence files (2026-10-24,
// 2026-10-31). Share-alike data stays in its own files under lib/core and lib/ja.
const SOURCES: Source[] = [
    {
        name: "KanjiVG",
        href: "https://kanjivg.tagaini.net",
        author: "Ulrich Apel and contributors",
        usedFor: "Stroke order diagrams and animations, worksheets, share cards, radical positions, and which part of a kanji gives its meaning or its sound.",
        license: "Creative Commons Attribution-ShareAlike 3.0",
        licenseHref: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
    {
        name: "Kanji alive",
        href: "https://kanjialive.com",
        author: "The Kanji alive team",
        usedFor: "Radical groups and the hand-picked example words shown first on kanji pages.",
        license: "Creative Commons Attribution 4.0 International",
        licenseHref: "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        name: "KANJIDIC2",
        href: "https://www.edrdg.org/wiki/index.php/KANJIDIC_Project",
        author: "The Electronic Dictionary Research and Development Group (EDRDG)",
        usedFor: "Meanings in their dictionary order, on/kun readings, stroke counts, school grades and newspaper frequency ranks.",
        license: "Creative Commons Attribution-ShareAlike 4.0 (EDRDG licence)",
        licenseHref: "https://www.edrdg.org/edrdg/licence.html",
    },
    {
        name: "JMdict",
        href: "https://www.edrdg.org/jmdict/j_jmdict.html",
        author: "The Electronic Dictionary Research and Development Group (EDRDG)",
        usedFor: "Common example words for kanji that Kanji alive doesn't cover.",
        license: "Creative Commons Attribution-ShareAlike 4.0 (EDRDG licence)",
        licenseHref: "https://www.edrdg.org/edrdg/licence.html",
    },
    {
        name: "JmdictFurigana",
        href: "https://github.com/Doublevil/JmdictFurigana",
        author: "Doublevil",
        usedFor: "Which reading of a kanji each example word uses, so words can be grouped by reading.",
        license: "Creative Commons Attribution-ShareAlike 4.0",
        licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    {
        name: "Unihan database",
        href: "https://www.unicode.org/charts/unihan.html",
        author: "Unicode, Inc.",
        usedFor: "The \"In Chinese\" note (simplified and traditional forms, pinyin), old character forms, and which kanji are jōyō or name kanji.",
        license: "Unicode License v3",
        licenseHref: "https://www.unicode.org/license.txt",
    },
    {
        name: "Wiktionary",
        href: "https://en.wiktionary.org",
        author: "Wiktionary contributors",
        usedFor: "Glyph origins shown under \"Origin\" and \"How it was built\". Each one links to the page revision it was taken from.",
        license: "Creative Commons Attribution-ShareAlike 4.0",
        licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    {
        name: "Wikimedia Commons: Ancient Chinese characters project",
        href: "https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters_project",
        author: "Commons contributors; tracings from Academia Sinica 小學堂",
        usedFor: "Oracle bone, bronze and seal forms in the journeys. Only public-domain files and CC0 tracings from Academia Sinica are used; files sourced from Richard Sears are excluded.",
        license: "Public domain / CC0 (per file)",
        licenseHref: "/about/ancient-forms",
    },
    {
        name: "Academia Sinica 小學堂 字形演變",
        href: "https://xiaoxue.iis.sinica.edu.tw/yanbian",
        author: "Academia Sinica (Institute of History and Philology, Institute of Information Science, ASCDC)",
        usedFor: "Oracle bone, bronze and seal forms for journey stages that Commons can't fill. Glyphs are used as served: cropped, made transparent and recoloured, never redrawn. Each one is listed on the ancient form credits page.",
        license: "CC0 1.0 (glyph images and glyph data)",
        licenseHref: "https://xiaoxue.iis.sinica.edu.tw/License/License",
    },
];

function Rule({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
    return (
        <li className="flex flex-col gap-3">
            <h3 className="text-[17px] font-bold leading-snug text-ink">
                <span className="mr-2 text-ink-3">{n}</span>
                {title}
            </h3>
            {children}
        </li>
    );
}

export default function AboutPage() {
    const kanjiCount = getAllKanji().length;
    const radicalCount = getAllRadicals().length;
    const nature = { "--tc": getThemeColor("Nature & Elements") } as CSSProperties;

    return (
        <DocumentPage
            jp="解説"
            kind="About & credits"
            title="About Kanji Kaisen"
            lede={
                <p>
                    Kanji Kaisen is a free kanji atlas. Every one of its {kanjiCount.toLocaleString("en")} kanji has its own page with
                    stroke order, readings, example words and the radical it is built from. Kanji are grouped by JLPT level, by
                    radical ({radicalCount} of them, each with a short story) and by ten themes such as nature, the body and tools.
                </p>
            }
        >
            <DocumentSection jp="読み方" title="How to read this atlas" id="how-to-read">
                <p>Every page uses the same five signs, so once you can read one page you can read them all.</p>
                <ol className="flex flex-col gap-8">
                    <Rule n={1} title="Colour tells you the theme">
                        <p>
                            Each of the ten themes has a colour, and a page takes the colour of the theme it belongs to. Nothing else is
                            coloured: buttons are ink, and JLPT levels are plain labels. In 墨 every theme turns the same vermilion.
                        </p>
                        <ul aria-label="Theme colours" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                            {CATEGORIES.map((name) => (
                                <li key={name} className="flex items-center gap-1.5" style={{ "--tc": getThemeColor(name) } as CSSProperties}>
                                    <span aria-hidden className="size-2 rounded-full bg-c" />
                                    {THEME_SHORT[name]}
                                </li>
                            ))}
                        </ul>
                    </Rule>
                    <Rule n={2} title="Lines tell you what a part does">
                        <p>
                            A solid line marks the part that carries the meaning, a dashed line the part that gives the sound, and a grey
                            line a part that is only drawn in. In 海 (sea), 氵 says “water” and 毎 lends its sound,{" "}
                            <span className="whitespace-nowrap">マイ,</span> which 海 reads <span className="whitespace-nowrap">カイ.</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5" style={nature}>
                            <PartChip char="氵" role="meaning" label="water" />
                            <PartPlus />
                            <PartChip char="毎" role="sound" label="マイ→カイ" />
                        </div>
                    </Rule>
                    <Rule n={3} title="Fill shows your ink">
                        <p>
                            Each kanji darkens through five shades as you meet, recall, trace and write it: 白 Not met, 淡 Met, 中 Learning,
                            濃 Familiar and 印 Mastered. You can also set a shade yourself. A wrong answer never lowers one. A theme, a radical
                            or a study deck shows one painted bar, and that is the only progress mark.
                        </p>
                        <InkLegend className="self-start" />
                    </Rule>
                    <Rule n={4} title="Stories are labelled">
                        <p>
                            An origin is what the sources say about how a character was formed. It is set upright and always names its
                            source. A memory story is a mnemonic written for this site. It is set in a slanted serif and labelled “made
                            up”, so you never mistake it for history.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <OriginCard
                                source={
                                    <>
                                        Ideogrammic compound · <a href="https://en.wiktionary.org/wiki/%E4%BC%91">Wiktionary</a>, CC BY-SA 4.0
                                    </>
                                }
                            >
                                <span lang="ja">休</span>: a man leaning against a tree, resting.
                            </OriginCard>
                            <MemoryStory>A person leans on a tree to take a break.</MemoryStory>
                        </div>
                    </Rule>
                    <Rule n={5} title="Only what moves lights up">
                        <p>
                            In 夜, the stroke being drawn and the learn step you are on light up. Headings, buttons and cards never do, and in
                            墨 nothing lights up at all.
                        </p>
                    </Rule>
                </ol>
            </DocumentSection>

            <DocumentSection jp="方法" title="Logic, not magic">
                <p>
                    Most kanji are made of smaller parts. One part usually hints at the meaning and, in most kanji, another hints at the
                    sound: 海 (sea), 泳 (swim) and 池 (pond) all carry 氵, the water radical, while 毎 gives 海 its カイ reading, as it does
                    in 悔 and 梅. Learning the parts first turns a wall of strokes into a few familiar pieces.
                </p>
                <p>
                    We keep two kinds of explanation apart. <strong className="text-ink">Origin</strong> is what the sources say about how
                    a character was formed, with a link to each source, and the ancient forms come only from public-domain or CC0 files.
                    A <strong className="text-ink">memory story</strong> is a mnemonic written for this site. It can help you remember a
                    kanji, but it isn&apos;t history.
                </p>
            </DocumentSection>

            <DocumentSection jp="学び方" title="Studying">
                <p>
                    There are no hearts, streaks or review queues. Each kanji darkens through five shades of ink as you meet, recall,
                    trace and write it, and you can set the shade yourself at any time. Save kanji to{" "}
                    <Link href="/my-list" className={PROSE_LINK}>
                        My list
                    </Link>{" "}
                    and review them with flashcards or a quick quiz on the{" "}
                    <Link href="/study" className={PROSE_LINK}>
                        Study
                    </Link>{" "}
                    page. Teachers can print worksheets, present on a projector and share sets from{" "}
                    <Link href="/teach" className={PROSE_LINK}>
                        Teach
                    </Link>
                    , with no student accounts. Everything stays in this browser. The older step-by-step path is still available as{" "}
                    <Link href="/practice" prefetch={false} className={PROSE_LINK}>
                        classic practice
                    </Link>
                    .
                </p>
            </DocumentSection>

            <DocumentSection jp="出典" title="Data sources and licences">
                <ul className="flex flex-col gap-3">
                    {SOURCES.map((source) => (
                        <li key={source.name} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card px-5 py-4">
                            <a href={source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start font-bold text-ink hover:underline">
                                {source.name} <ExternalLink size={14} aria-hidden />
                            </a>
                            <p className="text-sm text-ink-3">{source.author}</p>
                            <p className="text-sm text-ink-2">{source.usedFor}</p>
                            <p className="text-sm text-ink-2">
                                Licence:{" "}
                                {source.licenseHref.startsWith("/") ? (
                                    <Link href={source.licenseHref} className={PROSE_LINK}>
                                        {source.license}
                                    </Link>
                                ) : (
                                    <a href={source.licenseHref} target="_blank" rel="noopener noreferrer" className={PROSE_LINK}>
                                        {source.license}
                                    </a>
                                )}
                            </p>
                        </li>
                    ))}
                </ul>
                <p className="text-sm text-ink-3">
                    Data for a few kanji (分, 誰, 的 and others) was first taken from{" "}
                    <a href="https://github.com/davidluzgouveia/kanji-data" target="_blank" rel="noopener noreferrer" className={PROSE_LINK}>
                        davidluzgouveia/kanji-data
                    </a>
                    , which is also derived from KANJIDIC. JLPT levels are unofficial: the JLPT has not published kanji lists since 2010, so
                    levels follow the community lists used by{" "}
                    <a href="https://kanjiapi.dev" target="_blank" rel="noopener noreferrer" className={PROSE_LINK}>
                        kanjiapi.dev
                    </a>
                    , and jōyō kanji missing from those lists are shown as N1. Material adapted from the share-alike sources above (stroke
                    diagrams, part roles, example words, glyph origins) is shared under the same licence as its source.
                </p>
            </DocumentSection>

            <DocumentSection jp="公開" title="Source code and feedback">
                <p>
                    The site is open source on{" "}
                    <a href="https://github.com/mxggle/kanji-kaisen" target="_blank" rel="noopener noreferrer" className={PROSE_LINK}>
                        GitHub
                    </a>{" "}
                    under the MIT license (the data keeps its own licences above). Found a wrong reading or a story that doesn&apos;t hold
                    up? Tell us on the{" "}
                    <a href="https://kanjikaisen.featurebase.app/" target="_blank" rel="noopener noreferrer" className={PROSE_LINK}>
                        feedback board
                    </a>
                    .
                </p>
                <p>
                    Kanji Kaisen is made by Harry Sui. Find more at{" "}
                    <a href="https://harrysui.me" target="_blank" rel="noopener noreferrer" className={PROSE_LINK}>
                        harrysui.me
                    </a>{" "}
                    or write to{" "}
                    <a href="mailto:muggle6594@gmail.com" className={PROSE_LINK}>
                        muggle6594@gmail.com
                    </a>
                    .
                </p>
            </DocumentSection>
        </DocumentPage>
    );
}
