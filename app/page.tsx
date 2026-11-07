import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getAllRadicals, getKanjiByJlpt, getRadicalSummary, JLPT_LEVELS } from "@/lib/atlas";
import { kanjiPath, radicalPath, searchPath } from "@/lib/atlas/paths";
import { SITE_DESCRIPTION } from "@/lib/site";
import { PageShell } from "@/components/Atlas/PageShell";
import { MorphLanding } from "@/components/Atlas/MorphLanding";
import { InkPaint } from "@/components/Ink/InkPaint";
import { SearchBox } from "@/components/Search/SearchBox";
import { CategoryGates } from "@/components/Theme/CategoryGates";
import { Chip } from "@/components/ui/Chip";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { ContinueCard } from "@/components/Home/ContinueCard";
import { OtherWaysIn } from "@/components/Home/OtherWaysIn";
import { PartsMethod } from "@/components/Home/PartsMethod";
import { commonRadicals, homeThemes, kanjiCount, soundFamily, STROKE_BANDS } from "@/components/Home/data";
import { enterOrder } from "@/components/Motion/tokens";

export const metadata: Metadata = {
    alternates: { canonical: "/" },
    openGraph: { title: "Kanji Kaisen – kanji atlas", description: SITE_DESCRIPTION, url: "/", type: "website", siteName: "Kanji Kaisen" },
};

export const dynamic = "force-static";

/** The sound part the method section is built on, and the radical its button opens. */
const FAMILY = "青";
const GROWS = "ki";

const SECTION = "mt-14 sm:mt-28";
const GLYPH = "font-jp font-extrabold";

/**
 * The hero's entrance (ms after the page mounts; with the site intro, after
 * the paper lifts). It reads the page's structure: the kind label, the title
 * line by line, the lede, the search box and its "Try" chips, then the card
 * beside them. Done by ~0.9s; the theme gates follow and unroll.
 */
const ENTER = { title: 40, line: 130, lede: 240, search: 300, chips: 360, card: 340, themes: 480, gates: 560 } as const;

export default function HomePage() {
    const total = kanjiCount();
    const themes = homeThemes();
    const family = soundFamily(FAMILY);
    const grows = getRadicalSummary(GROWS);

    return (
        <InkPaint>
            <PageShell className="pt-6 sm:pt-16">
                <div className="flex flex-wrap items-stretch gap-x-12 gap-y-[18px] sm:gap-y-12">
                    {/* Search first: most visits start with a kanji in mind. The header has no search here. */}
                    <section aria-labelledby="home-title" className="flex min-w-0 flex-[7_1_520px] flex-col justify-center gap-[18px] sm:gap-6">
                        <KindLabel jp="漢字図鑑" data-enter="fade">
                            A free kanji atlas
                        </KindLabel>
                        {/* Each line soaks in on its own; the spans stay inline, so phones wrap the title as before. */}
                        <h1 id="home-title" className="type-title text-balance lg:text-[76px] lg:leading-[.98]">
                            <span data-enter="ink" style={enterOrder(0, ENTER.title)}>
                                Find a kanji.
                            </span>{" "}
                            <br className="hidden sm:inline" />
                            <span data-enter="ink" style={enterOrder(0, ENTER.title + ENTER.line)}>
                                Learn it by its parts.
                            </span>
                        </h1>
                        <p data-enter="rise" style={enterOrder(0, ENTER.lede)} className="hidden max-w-[560px] text-lg leading-relaxed text-ink-2 sm:block">
                            Search {total.toLocaleString("en")} kanji by meaning, reading or the kanji itself. Free, no account, no review queue.
                        </p>
                        <div data-enter="rise" style={enterOrder(0, ENTER.search)}>
                            <SearchBox variant="hero" shortcut="/" placeholder="water, みず, mizu or 水" className="max-w-[640px]" />
                        </div>
                        <div
                            data-enter-group="rise"
                            style={enterOrder(0, ENTER.chips, { "--stagger": "35ms", "--rise": "8px" } as CSSProperties)}
                            className="hidden flex-wrap items-center gap-2 sm:flex"
                        >
                            <span className="text-xs text-ink-3">Try</span>
                            <Chip href={kanjiPath("休")} aria-label="休 rest">
                                <span lang="ja" className={GLYPH}>
                                    休
                                </span>
                            </Chip>
                            <Chip href={searchPath("やすむ")}>
                                <span lang="ja">やすむ</span>
                            </Chip>
                            <Chip href={searchPath("forest")}>forest</Chip>
                            <Chip href={radicalPath(GROWS)}>
                                kanji with{" "}
                                <span lang="ja" className={GLYPH}>
                                    木
                                </span>
                            </Chip>
                        </div>
                    </section>

                    <ContinueCard themes={themes} total={total} enterDelay={ENTER.card} />
                </div>

                <section aria-labelledby="themes-title" className={SECTION}>
                    <SectionHeader
                        data-enter="rise"
                        style={enterOrder(0, ENTER.themes)}
                        id="themes-title"
                        jp="十の主題"
                        title="Ten themes"
                        aside={
                            <>
                                <span className="sm:hidden">start anywhere</span>
                                <span className="hidden sm:inline">Every radical lives in one. No order and no levels, so start anywhere.</span>
                            </>
                        }
                    />
                    <CategoryGates themes={themes} source="home" layout="rail" enterDelay={ENTER.gates} className="mt-3 sm:mt-[22px]" />
                </section>

                {family && grows && <PartsMethod family={family} grows={{ key: grows.key, char: grows.char, count: grows.kanjiCount }} className={SECTION} />}

                <OtherWaysIn
                    jlpt={JLPT_LEVELS.map((level) => ({ level, count: getKanjiByJlpt(level).length }))}
                    seals={commonRadicals()}
                    radicalCount={getAllRadicals().length}
                    strokes={STROKE_BANDS}
                    className={SECTION}
                />
                {/* Gates, seals and the continue tile fly in from their pages: their entrances stand down then. */}
                <MorphLanding />
            </PageShell>
        </InkPaint>
    );
}
