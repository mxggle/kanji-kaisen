import { notFound } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategories, getCategory } from "@/lib/atlas";
import { getCategorySlug } from "@/lib/atlas/categories";
import { categoryPath, radicalPath } from "@/lib/atlas/paths";
import type { AtlasRadicalSummary } from "@/lib/atlas/types";
import { PageShell } from "@/components/Atlas/PageShell";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { MorphLanding } from "@/components/Atlas/MorphLanding";
import { InkPaint } from "@/components/Ink/InkPaint";
import { AtlasPath } from "@/components/Layout/AtlasPath";
import { Plate } from "@/components/Layout/Plate";
import { Chip } from "@/components/ui/Chip";
import { PaintedBar } from "@/components/ui/PaintedBar";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { ThemeGate } from "@/components/ui/ThemeGate";
import { getThemeOrder, themeChars, themeRadicals } from "@/components/Theme/data";
import { flattenOrder } from "@/components/Theme/order";
import { ThemeImage } from "@/components/Theme/parts";
import { RadicalPreview, ThemeActionBar, ThemeActions, ThemeAtlas, ThemeSeals } from "@/components/Theme/ThemeAtlas";
import { levelCounts } from "@/components/Theme/view";
import { Morph, morphName } from "@/components/Motion/Morph";
import { enterOrder } from "@/components/Motion/tokens";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
    return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params) {
    const category = getCategory((await params).slug);
    if (!category) return {};
    const radicalChars = category.radicals.filter((r) => r.kanjiCount > 0).slice(0, 5).map((r) => r.char).join(" ");
    return atlasMetadata({
        title: `${category.name} kanji – radicals and stories`,
        description: `${category.story?.title ? `${category.story.title}: ` : ""}${category.kanjiCount} kanji built from ${category.radicalCount} ${category.name.toLowerCase()} radicals such as ${radicalChars}. ${category.story?.description ?? ""}`,
        path: categoryPath(category.name),
    });
}

const SideFormLinks = ({ forms }: { forms: AtlasRadicalSummary[] }) =>
    forms.map((form, i) => (
        <span key={form.key}>
            {i > 0 && ", "}
            <Link href={radicalPath(form.key)} className="text-ink-2 underline decoration-line-2 underline-offset-4 transition-colors hover:text-ink">
                <span lang="ja">{form.char}</span> {form.name}
            </Link>
        </span>
    ));

export default async function CategoryPage({ params }: Params) {
    const slug = (await params).slug;
    const theme = getThemeOrder(slug);
    const category = getCategory(slug);
    if (!theme || !category) notFound();

    const { meta, groups, sideForms, otherSideForms } = theme;
    const radicals = themeRadicals(groups);
    const order = flattenOrder(groups).join("");
    const levels = levelCounts(category.kanji.map((k) => k.jlpt));
    const n5 = levels.find((l) => l.level === "N5")?.count ?? 0;
    const folded = [...sideForms.values()].flat();
    const chars = themeChars();
    const others = getCategories().filter((c) => c.slug !== slug);
    const browse = `/browse?theme=${meta.slug}`;

    const specimen = (
        <div className="relative isolate mx-auto h-[440px] w-full max-w-[460px] overflow-hidden rounded-[999px_999px_14px_14px] border border-line bg-card sm:h-[540px] min-[60rem]:h-[620px] min-[60rem]:max-w-none">
            {/* The landing end of the theme gate's art (ThemeGate morph): it flies in from the gate. */}
            <Morph name={morphName.theme(getCategorySlug(meta.name))}>
                <span aria-hidden className="absolute inset-0 overflow-hidden rounded-[inherit]">
                    <ThemeImage src={meta.image} sizes="(min-width: 960px) 460px, (min-width: 500px) 460px, 100vw" preload />
                </span>
            </Morph>
            {/* The caption sits on its own near-solid backing so it stays ≥ 4.5:1 over any art. */}
            <div
                data-enter="fade"
                style={enterOrder(0, 420)}
                className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-[linear-gradient(180deg,rgba(var(--shade),0)_0%,rgba(var(--shade),.95)_38%)] px-5 pt-12 pb-5 sm:px-6 sm:pb-[22px]"
            >
                <PaintedBar chars={order} caption label={`Your ink in ${meta.short}`} />
                <p className="text-xs text-ink-2">The bar fills as this theme&apos;s kanji darken.</p>
            </div>
        </div>
    );

    const reading = (
        <div className="flex flex-col gap-[22px]">
            <div className="flex flex-col gap-3.5">
                <KindLabel jp={meta.jp} data-enter="fade" style={enterOrder(1)}>
                    Theme · one of ten
                </KindLabel>
                <h1 data-enter="ink" style={enterOrder(2)} className="type-title text-balance min-[60rem]:text-[72px] min-[60rem]:leading-[.98]">
                    {meta.name}
                </h1>
            </div>
            <p data-enter style={enterOrder(3)} className="max-w-[600px] text-base leading-[1.65] text-ink-2 sm:text-lg sm:leading-[1.65]">
                {meta.lore}
            </p>
            <div data-enter-group="rise" style={{ "--delay": "220ms" } as CSSProperties} className="flex flex-wrap items-center gap-2">
                <Tag>{radicals.length} radicals</Tag>
                <Tag>{meta.kanjiCount.toLocaleString("en")} kanji</Tag>
                {n5 > 0 && <Tag>{n5} at N5</Tag>}
            </div>
            <RadicalPreview />
            <ThemeActions />
        </div>
    );

    return (
        <InkPaint>
            <PageShell style={themeVars(meta.name)}>
                <ThemeAtlas theme={{ name: meta.name, slug: meta.slug }} radicals={radicals} order={order}>
                    <MorphLanding />
                    <AtlasPath
                        steps={[{ label: meta.name, short: meta.short, mark: { kind: "dot", category: meta.name } }]}
                        more={{ href: "/categories", label: "All ten themes" }}
                    />
                    <Plate specimen={specimen} specimenLabel="Theme art" reading={reading} specimenEnter="unroll" />

                    <section aria-labelledby="theme-radicals" className="mt-16 flex flex-col gap-[22px] lg:mt-24">
                        <SectionHeader
                            data-reveal="rise"
                            id="theme-radicals"
                            jp="部首"
                            title={`${radicals.length} radicals, most useful first`}
                            aside="Pick one to preview it above. The order is a suggestion; start anywhere."
                        />
                        <ThemeSeals />
                        {(folded.length > 0 || otherSideForms.length > 0) && (
                            <p data-reveal="fade" className="text-xs leading-relaxed text-ink-3">
                                {folded.length > 0 && (
                                    <>
                                        Side forms with no kanji of their own (<SideFormLinks forms={folded} />) are folded into their main radical.
                                    </>
                                )}
                                {folded.length > 0 && otherSideForms.length > 0 && " "}
                                {otherSideForms.length > 0 && (
                                    <>
                                        Also filed under {meta.short}: <SideFormLinks forms={otherSideForms} />.
                                    </>
                                )}
                            </p>
                        )}
                    </section>

                    <section aria-labelledby="theme-levels" className="mt-14 flex flex-col gap-[18px] lg:mt-20">
                        <SectionHeader
                            data-reveal="rise"
                            id="theme-levels"
                            jp="全部"
                            title={`All ${meta.kanjiCount.toLocaleString("en")} kanji`}
                            aside="Opens Browse with this theme already filtered"
                        />
                        <div data-reveal-group="rise" className="flex flex-wrap items-center gap-2">
                            {levels.map(({ level, count }) => (
                                <Chip key={level} href={`${browse}&jlpt=${level}`} count={count.toLocaleString("en")}>
                                    {level}
                                </Chip>
                            ))}
                            <Chip href={browse} count={meta.kanjiCount.toLocaleString("en")}>
                                All levels
                            </Chip>
                        </div>
                    </section>

                    <section aria-labelledby="other-themes" className="mt-16 flex flex-col gap-[22px] lg:mt-24">
                        <SectionHeader data-reveal="rise" id="other-themes" jp="他の主題" title={`The other ${others.length === 9 ? "nine" : others.length} themes`} aside="No order, no levels" />
                        {/* Gates unroll like hanging scrolls; each theme shows once here, so its art flies into its page. */}
                        <ul data-reveal-group="unroll" className="grid grid-cols-3 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(112px,1fr))] sm:gap-3.5">
                            {others.map((other) => (
                                <li key={other.slug} className="min-w-0">
                                    <ThemeGate
                                        category={other.name}
                                        chars={chars[other.slug] ?? ""}
                                        source="theme"
                                        sizes="(min-width: 640px) 120px, 33vw"
                                        morph
                                        className="w-full"
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                    <ThemeActionBar />
                </ThemeAtlas>
            </PageShell>
        </InkPaint>
    );
}
