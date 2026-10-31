import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageShell, Section } from "@/components/Atlas/PageShell";
import { getAllKanji, getAllRadicals } from "@/lib/atlas";

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

export default function AboutPage() {
    const kanjiCount = getAllKanji().length;
    const radicalCount = getAllRadicals().length;

    return (
        <PageShell className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">About Kanji Kaisen</h1>
            <p className="text-lg text-ink-2 leading-relaxed">
                Kanji Kaisen is a free kanji atlas. Every one of its {kanjiCount.toLocaleString("en")} kanji has its own page with
                stroke order, readings, example words and the radical it is built from. Kanji are grouped by JLPT level, by
                radical ({radicalCount} of them, each with a short story) and by ten themes such as nature, the body and tools.
            </p>

            <Section title="Logic, not magic">
                <p className="text-ink-2 leading-relaxed">
                    Most kanji are made of smaller parts. One part usually hints at the meaning and, in most kanji, another
                    hints at the sound: 海 (sea), 泳 (swim) and 池 (pond) all carry 氵, the water radical, while 毎 gives 海
                    its カイ reading, as it does in 悔 and 梅. Learning the parts first turns a wall of strokes into a few
                    familiar pieces.
                </p>
                <p className="mt-3 text-ink-2 leading-relaxed">
                    We keep two kinds of explanation apart. <strong className="text-ink">Origin</strong> is what the sources
                    say about how a character was formed, with a link to each source, and the ancient forms come only from
                    public-domain or CC0 files. A <strong className="text-ink">memory story</strong> is a mnemonic written
                    for this site. It can help you remember a kanji, but it isn&apos;t history.
                </p>
            </Section>

            <Section title="Studying">
                <p className="text-ink-2 leading-relaxed">
                    There are no hearts, streaks or review queues. Each kanji darkens through five shades of ink as you meet,
                    recall, trace and write it, and you can set the shade yourself at any time. Save kanji to{" "}
                    <Link href="/my-list" className="text-[var(--accent)] hover:underline">My list</Link> and review them with
                    flashcards or a quick quiz on the{" "}
                    <Link href="/study" className="text-[var(--accent)] hover:underline">Study</Link> page. Teachers can print
                    worksheets, present on a projector and share sets from{" "}
                    <Link href="/teach" className="text-[var(--accent)] hover:underline">Teach</Link>, with no student accounts.
                    Everything stays in this browser. The older step-by-step path is still available as{" "}
                    <Link href="/practice" prefetch={false} className="text-[var(--accent)] hover:underline">classic practice</Link>.
                </p>
            </Section>

            <Section title="Data sources and licenses">
                <ul className="space-y-4">
                    {SOURCES.map((source) => (
                        <li key={source.name} className="rounded-xl border border-line bg-card p-4">
                            <a href={source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-ink hover:text-[var(--accent)]">
                                {source.name} <ExternalLink size={14} aria-hidden />
                            </a>
                            <p className="text-sm text-ink-3">{source.author}</p>
                            <p className="mt-2 text-sm text-ink-2">{source.usedFor}</p>
                            <p className="mt-2 text-sm">
                                License:{" "}
                                {source.licenseHref.startsWith("/") ? (
                                    <Link href={source.licenseHref} className="text-[var(--accent)] hover:underline">
                                        {source.license}
                                    </Link>
                                ) : (
                                    <a href={source.licenseHref} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                                        {source.license}
                                    </a>
                                )}
                            </p>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm text-ink-3 leading-relaxed">
                    Data for a few kanji (分, 誰, 的 and others) was first taken from{" "}
                    <a href="https://github.com/davidluzgouveia/kanji-data" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                        davidluzgouveia/kanji-data
                    </a>
                    , which is also derived from KANJIDIC. JLPT levels are unofficial: the JLPT has not published kanji lists since
                    2010, so levels follow the community lists used by{" "}
                    <a href="https://kanjiapi.dev" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">kanjiapi.dev</a>,
                    and jōyō kanji missing from those lists are shown as N1. Material adapted from the share-alike sources above
                    (stroke diagrams, part roles, example words, glyph origins) is shared under the same licence as its source.
                </p>
            </Section>

            <Section title="Source code and feedback">
                <p className="text-ink-2 leading-relaxed">
                    The site is open source on{" "}
                    <a href="https://github.com/mxggle/kanji-kaisen" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">GitHub</a>{" "}
                    under the MIT license (the data keeps its own licenses above). Found a wrong reading or a story that doesn&apos;t
                    hold up? Tell us on the{" "}
                    <a href="https://kanjikaisen.featurebase.app/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">feedback board</a>.
                </p>
            </Section>
        </PageShell>
    );
}
