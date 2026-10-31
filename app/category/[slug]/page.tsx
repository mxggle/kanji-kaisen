import { notFound } from "next/navigation";
import { getCategories, getCategory } from "@/lib/atlas";
import { categoryPath } from "@/lib/atlas/paths";
import { Breadcrumbs } from "@/components/Atlas/PageShell";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { getThemeOrder, panelRadicals } from "@/components/Theme/data";
import { Fog, shadeGradient, ThemeImage } from "@/components/Theme/parts";
import { ThemeExplorer, ThemeKnown, ThemeProvider } from "@/components/Theme/ThemeExplorer";
import { ThemeKanjiIndex } from "@/components/Theme/ThemeKanjiIndex";
import { ThemeStory } from "@/components/Theme/ThemeStory";

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

export default async function CategoryPage({ params }: Params) {
    const slug = (await params).slug;
    const order = getThemeOrder(slug);
    const story = getCategory(slug)?.story ?? null;
    if (!order) notFound();

    const { meta, groups, sideForms, otherSideForms } = order;

    return (
        <ThemeProvider theme={meta} radicals={panelRadicals(groups)}>
            <div style={themeVars(meta.name)} className="relative isolate text-ink">
                {/* Theme art: a banner on phones (M-Theme), the right of a wide hero on desktop (Theme). */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] overflow-hidden sm:h-[460px] lg:h-[860px]">
                    <div className="absolute inset-0 bg-bg lg:left-auto lg:w-[78%]">
                        <ThemeImage src={meta.image} sizes="(min-width: 1024px) 78vw, 100vw" preload className="object-[50%_30%]" />
                    </div>
                    <div
                        className="absolute inset-0 lg:hidden"
                        style={{ background: shadeGradient("180deg", [[0.55, 0], [0.05, 30], [0.75, 70], [1, 100]]) }}
                    />
                    <div
                        className="absolute inset-0 hidden lg:block"
                        style={{
                            background: `${shadeGradient("0deg", [[1, 0], [0, 45]])}, ${shadeGradient("90deg", [[0.97, 0], [0.85, 34], [0.25, 70], [0.55, 100]])}`,
                        }}
                    />
                    <Fog className="top-[48%] h-[160px] lg:left-[20%] lg:top-[40%] lg:h-[200px]" />
                    <span
                        lang="ja"
                        className="absolute -right-3.5 top-16 select-none font-jp text-[220px] font-extrabold leading-none text-c opacity-[.14] lg:right-[30%] lg:top-20 lg:text-[440px] lg:opacity-[.11]"
                    >
                        {meta.mark}
                    </span>
                </div>

                <div className="mx-auto w-full max-w-7xl px-4 pb-16 lg:px-8">
                    <header className="flex min-h-[340px] flex-col justify-between pt-3 sm:min-h-[420px] lg:block lg:min-h-0 lg:pt-8">
                        <Breadcrumbs
                            items={[
                                { href: "/", label: "Home" },
                                { href: "/categories", label: "Themes" },
                                { label: meta.name },
                            ]}
                        />
                        <div className="max-w-[640px] lg:pt-8">
                            <p className="flex items-center gap-3.5">
                                <span lang="ja" className="font-jp text-sm text-c lg:text-lg">{meta.jp}</span>
                                <span aria-hidden className="h-px w-12 bg-c opacity-60" />
                                <span className="font-disp text-base italic text-ink-2 lg:text-[19px]">{meta.sub}</span>
                            </p>
                            <h1 className="glow mt-2 text-balance font-disp text-[46px] font-bold leading-[.95] text-c lg:mt-[18px] lg:text-[88px] lg:leading-[.92]">
                                {meta.name}
                            </h1>
                        </div>
                    </header>
                    <div className="max-w-[640px]">
                        <p className="mt-4 text-[15px] leading-relaxed text-ink-2 lg:mt-[22px] lg:text-[17px]">{meta.lore}</p>
                        <p className="mt-2.5 text-sm text-ink-3 lg:mt-3.5">
                            {meta.radicalCount} radicals · {meta.kanjiCount} kanji
                            <ThemeKnown />
                        </p>
                    </div>

                    <div className="mt-8 lg:mt-14">
                        <ThemeExplorer />
                    </div>

                    <div className="mt-16 lg:mt-24">
                        <ThemeKanjiIndex
                            name={meta.name}
                            kanjiCount={meta.kanjiCount}
                            groups={groups}
                            sideForms={sideForms}
                            otherSideForms={otherSideForms}
                        />
                    </div>

                    {story && (
                        <div className="mt-16 lg:mt-24">
                            <ThemeStory story={story} name={meta.name} />
                        </div>
                    )}
                </div>
            </div>
        </ThemeProvider>
    );
}
