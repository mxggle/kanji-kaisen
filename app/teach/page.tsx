import type { Metadata } from "next";
import { MonitorPlay, Printer, Share2 } from "lucide-react";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { PageShell } from "@/components/Atlas/PageShell";
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
        icon: Printer,
        title: "Printable worksheets",
        text: "A4 or Letter, always in ink. Each kanji gets its meaning and readings, a numbered stroke-order strip, tracing cells and empty 米字格 grids, then a “Read these words” exercise and an optional answer key.",
    },
    {
        icon: MonitorPlay,
        title: "Projector mode",
        text: "One kanji at a time in huge type. Space draws the next stroke, → moves on, and Q quizzes the class with four meanings.",
    },
    {
        icon: Share2,
        title: "Share links",
        text: "Students open the link or scan the QR code and study the set with flashcards or a quiz. No sign-up, nothing stored on a server.",
    },
];

export default function TeachPage() {
    const lists = getTeachLists();
    return (
        <PageShell className="max-w-7xl">
            <header className="mb-8 max-w-3xl">
                <p className="text-sm text-ink-3">Teach</p>
                <h1 className="mt-1 font-disp text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.05]">Kanji worksheet generator</h1>
                <p className="mt-3 text-ink-2 leading-relaxed">
                    Pick the kanji for a lesson, then print stroke-order worksheets, present them on a projector or share a link with
                    your students. Free, with no account.
                </p>
            </header>

            <TeachBuilder lists={lists} siteHost={SITE_URL.replace(/^https?:\/\//, "")} />

            <section aria-labelledby="teach-features" className="mt-16 border-t border-line pt-10">
                <h2 id="teach-features" className="font-disp text-3xl font-bold">Three tools, one set</h2>
                <ul className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FEATURES.map(({ icon: Icon, title, text }) => (
                        <li key={title} className="rounded-xl border border-line bg-card p-5">
                            <Icon size={22} className="text-accent" aria-hidden />
                            <h3 className="mt-3 text-lg font-bold">{title}</h3>
                            <p className="mt-1.5 text-sm text-ink-2 leading-relaxed">{text}</p>
                        </li>
                    ))}
                </ul>
                <p className="mt-6 text-xs text-ink-3">
                    Stroke order from KanjiVG (CC BY-SA 3.0). Example words from Kanji alive (CC BY 4.0).
                </p>
            </section>
        </PageShell>
    );
}
