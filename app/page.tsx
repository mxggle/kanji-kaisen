import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllKanji, getKanjiByJlpt, getKanjiOfTheDay, JLPT_LEVELS } from "@/lib/atlas";
import { formatReading, readingToRomaji } from "@/lib/atlas/readings";
import { browsePath, kanjiPath } from "@/lib/atlas/paths";
import { SearchBox } from "@/components/Search/SearchBox";
import { JlptBadge, jlptColor } from "@/components/Atlas/JlptBadge";
import { getDeckThemes } from "@/components/Theme/data";
import { ThemeDeck } from "@/components/Home/ThemeDeck";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
    alternates: { canonical: "/" },
    openGraph: { title: "Kanji Kaisen – kanji atlas", description: SITE_DESCRIPTION, url: "/", type: "website", siteName: "Kanji Kaisen" },
};

// Kanji of the day is picked from the date; rebuild the page hourly so it rolls over.
export const revalidate = 3600;

/** Featured on the server and for learners with no ink yet. */
const DEFAULT_THEME = "nature-elements";

const STROKE_BANDS = [
    { label: "1–3", min: 1, max: 3 },
    { label: "4–5", min: 4, max: 5 },
    { label: "6–7", min: 6, max: 7 },
    { label: "8–9", min: 8, max: 9 },
    { label: "10–12", min: 10, max: 12 },
    { label: "13–15", min: 13, max: 15 },
    { label: "16+", min: 16, max: 30 },
];

const CARD = "rounded-2xl border border-line bg-card";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export default function HomePage() {
    const allKanji = getAllKanji();
    const today = getKanjiOfTheDay();
    const themes = getDeckThemes();
    const strokeCounts = STROKE_BANDS.map((band) => ({
        ...band,
        count: allKanji.filter((k) => k.strokeCount >= band.min && k.strokeCount <= band.max).length,
    }));
    const todayReadings = [...today.onyomi.slice(0, 2), ...today.kunyomi.slice(0, 2)];

    return (
        <div className="mx-auto w-full max-w-7xl px-4 pt-[84px] pb-16 text-ink lg:px-8 lg:pt-24">
            {/* Search first: most visits start with a kanji in mind. */}
            <section aria-labelledby="home-title" className="mx-auto max-w-3xl pt-2 pb-8 text-center lg:pt-6 lg:pb-12">
                <h1 id="home-title" className="text-balance font-disp text-[38px] font-bold leading-[1.02] sm:text-5xl lg:text-[60px]">
                    Find a kanji. Learn it by its parts.
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2 lg:mt-4 lg:text-lg">
                    Search {allKanji.length.toLocaleString("en")} kanji by meaning, reading or the kanji itself. Free, no
                    account, no review queue.
                </p>
                <SearchBox
                    variant="hero"
                    placeholder="water, みず, mizu or 水"
                    className="mx-auto mt-5 max-w-2xl text-left lg:mt-8 [&_input]:rounded-2xl [&_input]:py-[18px] lg:[&_input]:py-5 lg:[&_input]:text-xl"
                />
            </section>

            <ThemeDeck themes={themes} defaultSlug={DEFAULT_THEME} />

            <div className="mt-16 space-y-16 lg:mt-24 lg:space-y-20">
                {/* Kanji of the day + JLPT */}
                <section aria-label="Kanji of the day and JLPT levels" className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
                    <Link href={kanjiPath(today.char)} className={`group flex items-center gap-5 p-6 transition-colors hover:border-line-2 ${CARD} ${FOCUS}`}>
                        <span lang="ja" className="shrink-0 font-jp text-7xl font-extrabold leading-none">{today.char}</span>
                        <div className="min-w-0">
                            <p className="mb-1 text-xs uppercase tracking-[.14em] text-ink-3">Kanji of the day</p>
                            <p className="truncate font-disp text-2xl font-bold">{today.meanings.slice(0, 3).join(", ")}</p>
                            <p lang="ja" className="mt-1 truncate font-jp text-sm text-ink-2">{todayReadings.map(formatReading).join("・")}</p>
                            <p className="mt-0.5 truncate text-xs text-ink-3">{todayReadings.map(readingToRomaji).join(", ")}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <JlptBadge level={today.jlpt} />
                                <span className="text-sm text-ink-2 group-hover:text-ink group-hover:underline group-hover:underline-offset-4">Stroke order & examples →</span>
                            </div>
                        </div>
                    </Link>

                    <div className={`p-6 ${CARD}`}>
                        <h2 className="font-disp text-2xl font-bold">Browse by JLPT level</h2>
                        <p className="mb-4 text-sm text-ink-3">Levels are unofficial; they follow the community lists most learners use.</p>
                        <ul className="grid grid-cols-5 gap-2">
                            {JLPT_LEVELS.map((level) => (
                                <li key={level}>
                                    <Link
                                        href={browsePath({ jlpt: level })}
                                        className={`flex flex-col items-center rounded-xl border border-line border-b-4 py-3 transition-colors hover:bg-ink/5 ${FOCUS}`}
                                        style={{ borderBottomColor: jlptColor(level) }}
                                    >
                                        <span className="text-lg font-bold" style={{ color: jlptColor(level) }}>{level}</span>
                                        <span className="text-xs text-ink-3">{getKanjiByJlpt(level).length}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Stroke count */}
                <section aria-labelledby="strokes-title">
                    <h2 id="strokes-title" className="font-disp text-3xl font-bold">Browse by stroke count</h2>
                    <p className="mt-1 mb-5 text-ink-2">Handy when you can count a kanji&apos;s strokes but can&apos;t read it yet.</p>
                    <ul className="flex flex-wrap gap-2">
                        {strokeCounts.map((band) => (
                            <li key={band.label}>
                                <Link
                                    href={`/browse?min=${band.min}&max=${band.max}&sort=strokes`}
                                    className={`inline-flex items-baseline gap-2 rounded-full border border-line px-4 py-2 transition-colors hover:border-ink-2 ${FOCUS}`}
                                >
                                    <span className="font-bold">{band.label} strokes</span>
                                    <span className="text-xs text-ink-3">{band.count}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* How it works */}
                <section aria-labelledby="how-title" className="border-t border-line pt-10">
                    <h2 id="how-title" className="font-disp text-3xl font-bold lg:text-4xl">How Kanji Kaisen works</h2>
                    <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div>
                            <p lang="ja" aria-hidden className="font-jp text-3xl font-extrabold text-[var(--accent)]">部</p>
                            <h3 className="mt-2 text-lg font-bold">Radicals first</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                                Most kanji are built from a few hundred parts. In 海, 氵 says &ldquo;water&rdquo; and 毎 hints at
                                the sound. Each theme lists its radicals with the most useful first.
                            </p>
                        </div>
                        <div>
                            <p lang="ja" aria-hidden className="font-jp text-3xl font-extrabold text-[var(--accent)]">墨</p>
                            <h3 className="mt-2 text-lg font-bold">Five shades of ink</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                                Each kanji darkens from 白 Not met to 印 Mastered as you learn it, and each theme&apos;s
                                picture regains its colour. No hearts, no streaks, no lock-outs.
                            </p>
                        </div>
                        <div>
                            <p lang="ja" aria-hidden className="font-jp text-3xl font-extrabold text-[var(--accent)]">話</p>
                            <h3 className="mt-2 text-lg font-bold">Stories, labelled</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                                Every radical has a short memory story to help it stick. It is marked as a mnemonic, so you
                                always know what is history and what is a memory aid.
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/study" className={`inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-bg transition-colors hover:bg-ink-2 ${FOCUS}`}>
                            Study your list <ArrowRight className="size-4" aria-hidden />
                        </Link>
                        <Link
                            href="/practice"
                            prefetch={false}
                            className={`inline-flex items-center gap-2 rounded-full border border-line-2 px-6 py-3 font-bold transition-colors hover:bg-ink/10 ${FOCUS}`}
                        >
                            Classic practice
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
