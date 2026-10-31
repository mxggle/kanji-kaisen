import type { Metadata } from "next";
import { getAllRadicals, getKanjiByJlpt, getRadicalSummary, JLPT_LEVELS } from "@/lib/atlas";
import { kanjiPath, radicalPath, searchPath } from "@/lib/atlas/paths";
import { SITE_DESCRIPTION } from "@/lib/site";
import { PageShell } from "@/components/Atlas/PageShell";
import { InkPaint } from "@/components/Ink/InkPaint";
import { SearchBox } from "@/components/Search/SearchBox";
import { CategoryGates } from "@/components/Theme/CategoryGates";
import { Chip } from "@/components/ui/Chip";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { ContinueCard } from "@/components/Home/ContinueCard";
import { OtherWaysIn } from "@/components/Home/OtherWaysIn";
import { PartsMethod } from "@/components/Home/PartsMethod";
import { commonRadicals, homeThemes, kanjiCount, soundFamily, STROKE_BANDS } from "@/components/Home/data";

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
                        <KindLabel jp="漢字図鑑">A free kanji atlas</KindLabel>
                        <h1 id="home-title" className="type-title text-balance lg:text-[76px] lg:leading-[.98]">
                            Find a kanji. <br className="hidden sm:inline" />
                            Learn it by its parts.
                        </h1>
                        <p className="hidden max-w-[560px] text-lg leading-relaxed text-ink-2 sm:block">
                            Search {total.toLocaleString("en")} kanji by meaning, reading or the kanji itself. Free, no account, no review queue.
                        </p>
                        <SearchBox variant="hero" placeholder="water, みず, mizu or 水" className="max-w-[640px]" />
                        <div className="hidden flex-wrap items-center gap-2 sm:flex">
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

                    <ContinueCard themes={themes} total={total} />
                </div>

                <section aria-labelledby="themes-title" className={SECTION}>
                    <SectionHeader
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
                    <CategoryGates themes={themes} source="home" layout="rail" className="mt-3 sm:mt-[22px]" />
                </section>

                {family && grows && <PartsMethod family={family} grows={{ key: grows.key, char: grows.char, count: grows.kanjiCount }} className={SECTION} />}

                <OtherWaysIn
                    jlpt={JLPT_LEVELS.map((level) => ({ level, count: getKanjiByJlpt(level).length }))}
                    seals={commonRadicals()}
                    radicalCount={getAllRadicals().length}
                    strokes={STROKE_BANDS}
                    className={SECTION}
                />
            </PageShell>
        </InkPaint>
    );
}
