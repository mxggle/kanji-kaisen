import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageShell, Section } from "@/components/Atlas/PageShell";
import { getAllKanji, getAllRadicals } from "@/lib/atlas";

export const metadata: Metadata = {
    title: "About & credits",
    description: "What Kanji Kaisen is, how it explains kanji through radicals, and the open data it is built on: KanjiVG, Kanji Alive and KANJIDIC2.",
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

// Licenses checked against each project's own README/licence files (2026-10-24).
const SOURCES: Source[] = [
    {
        name: "KanjiVG",
        href: "https://kanjivg.tagaini.net",
        author: "Ulrich Apel and contributors",
        usedFor: "Stroke order diagrams and animations, and radical positions for kanji outside Kanji Alive.",
        license: "Creative Commons Attribution-ShareAlike 3.0",
        licenseHref: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
    {
        name: "Kanji alive",
        href: "https://kanjialive.com",
        author: "The Kanji alive team",
        usedFor: "Radical groups and the example words shown on kanji pages.",
        license: "Creative Commons Attribution 4.0 International",
        licenseHref: "https://creativecommons.org/licenses/by/4.0/",
    },
    {
        name: "KANJIDIC2",
        href: "https://www.edrdg.org/wiki/index.php/KANJIDIC_Project",
        author: "The Electronic Dictionary Research and Development Group (EDRDG)",
        usedFor: "Meanings, on/kun readings, stroke counts, school grades and newspaper frequency ranks, fetched through kanjiapi.dev.",
        license: "EDRDG licence (Creative Commons Attribution-ShareAlike)",
        licenseHref: "https://www.edrdg.org/edrdg/licence.html",
    },
];

export default function AboutPage() {
    const kanjiCount = getAllKanji().length;
    const radicalCount = getAllRadicals().length;

    return (
        <PageShell className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">About Kanji Kaisen</h1>
            <p className="text-lg text-white/70 leading-relaxed">
                Kanji Kaisen is a free kanji atlas. Every one of its {kanjiCount.toLocaleString("en")} kanji has its own page with
                stroke order, readings, example words and the radical it is built from. Kanji are grouped by JLPT level, by
                radical ({radicalCount} of them, each with a short story) and by ten themes such as nature, the body and tools.
            </p>

            <Section title="Logic, not magic">
                <p className="text-white/70 leading-relaxed">
                    Most kanji are made of smaller parts, and the radical usually hints at the meaning: 海 (sea), 泳 (swim) and
                    池 (pond) all carry 氵, the water radical. Learning the radical first turns a wall of strokes into a few
                    familiar pieces. Radical stories are memory aids written for this site; where they touch on history, they
                    follow the commonly given explanations, but they are mnemonics, not etymology papers.
                </p>
            </Section>

            <Section title="Studying">
                <p className="text-white/70 leading-relaxed">
                    You can save kanji to <Link href="/my-list" className="text-[var(--accent)] hover:underline">My list</Link>,
                    mark them as still learning or known, and review them with flashcards or a quick quiz on the{" "}
                    <Link href="/study" className="text-[var(--accent)] hover:underline">Study</Link> page. Your list stays in
                    this browser. The older step-by-step path is still available as{" "}
                    <Link href="/practice" prefetch={false} className="text-[var(--accent)] hover:underline">classic practice</Link>.
                </p>
            </Section>

            <Section title="Data sources and licenses">
                <ul className="space-y-4">
                    {SOURCES.map((source) => (
                        <li key={source.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <a href={source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-white hover:text-[var(--accent)]">
                                {source.name} <ExternalLink size={14} aria-hidden />
                            </a>
                            <p className="text-sm text-white/50">{source.author}</p>
                            <p className="mt-2 text-sm text-white/70">{source.usedFor}</p>
                            <p className="mt-2 text-sm">
                                License:{" "}
                                <a href={source.licenseHref} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                                    {source.license}
                                </a>
                            </p>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm text-white/50 leading-relaxed">
                    Data for a few kanji (分, 誰, 的 and others) was taken from{" "}
                    <a href="https://github.com/davidluzgouveia/kanji-data" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                        davidluzgouveia/kanji-data
                    </a>
                    , which is also derived from KANJIDIC. JLPT levels are unofficial: the JLPT has not published kanji lists since
                    2010, so levels follow the community lists used by kanjiapi.dev. Stroke diagrams adapted from KanjiVG are shared
                    under the same CC BY-SA 3.0 license.
                </p>
            </Section>

            <Section title="Source code and feedback">
                <p className="text-white/70 leading-relaxed">
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
