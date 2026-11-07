import type { Metadata } from "next";
import Link from "next/link";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { PageShell } from "@/components/Atlas/PageShell";
import { PROSE_LINK } from "@/components/Layout/Document";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTeachLists } from "@/components/Teach/server";
import { TeachBuilder } from "@/components/Teach/TeachBuilder";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = atlasMetadata({
    title: "Kanji worksheet generator – printable stroke order practice sheets",
    description:
        "Free kanji worksheet generator: pick kanji by theme, radical, JLPT level or pasted text, then print stroke-order practice sheets, present them or share a link.",
    path: "/teach",
});

const FEATURES = [
    {
        jp: "刷",
        title: "Printable worksheets",
        text: "A4 or Letter, always in ink. Each kanji gets its meaning and readings, a numbered stroke-order strip, tracing cells and empty 米字格 grids, then a “Read these words” exercise and an optional answer key.",
    },
    {
        jp: "映",
        title: "Projector mode",
        text: "One kanji at a time in huge type. Space draws the next stroke, → moves on, and Q quizzes the class with four meanings.",
    },
    {
        jp: "送",
        title: "Share links",
        text: "Students open the link or scan the QR code and study the set with flashcards or a quiz. No sign-up, nothing stored on a server.",
    },
];

export default function TeachPage() {
    const lists = getTeachLists();
    return (
        <PageShell>
            <TeachBuilder lists={lists} siteHost={SITE_URL.replace(/^https?:\/\//, "")} />

            <section aria-labelledby="teach-features" className="mt-20 flex flex-col gap-6 border-t border-line pt-12">
                <SectionHeader jp="三つ" title="Three tools, one set" id="teach-features" aside="A free kanji worksheet generator, with no account" />
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Same card as My list's study modes: a kanji in a ring, then the title. */}
                    {FEATURES.map(({ jp, title, text }) => (
                        <li key={title} className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-[22px] py-5">
                            <div className="flex items-center gap-3">
                                <span
                                    aria-hidden
                                    lang="ja"
                                    className="flex size-11 flex-none items-center justify-center rounded-full border border-line-2 font-jp text-[21px] font-extrabold leading-none"
                                >
                                    {jp}
                                </span>
                                <h3 className="text-[17px] font-bold leading-snug">{title}</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-ink-2">{text}</p>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-ink-3">
                    Stroke order from KanjiVG (CC BY-SA 3.0). Readings and example words: see{" "}
                    <Link href="/about" className={PROSE_LINK}>
                        About &amp; credits
                    </Link>
                    .
                </p>
            </section>
        </PageShell>
    );
}
