import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, Swords } from "lucide-react";
import { getCategories, getCategory, getRadical, JLPT_LEVELS } from "@/lib/atlas";
import { categoryPath, practiceCategoryPath } from "@/lib/atlas/paths";
import { PageShell, Breadcrumbs, Section } from "@/components/Atlas/PageShell";
import { JlptBadge, StatBadge } from "@/components/Atlas/JlptBadge";
import { KanjiTileGrid } from "@/components/Atlas/KanjiTile";
import { RadicalLinkCard } from "@/components/Atlas/radical/RadicalLinkCard";
import { CategoryStoryContent } from "@/components/Atlas/category/CategoryStoryContent";
import { CategoryCardArt } from "@/components/Atlas/category/CategoryCardArt";
import { getThemeClass, getThemeStyle } from "@/components/Atlas/category/themeStyles";
import { atlasMetadata } from "@/components/Atlas/metadata";

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
    const category = getCategory((await params).slug);
    if (!category) notFound();

    const theme = getThemeStyle(category.name);
    const themeClass = getThemeClass(category.name);
    const Icon = theme.icon;
    const kanjiByLevel = JLPT_LEVELS.map((level) => ({
        level,
        kanji: category.kanji.filter((k) => k.jlpt === level),
    })).filter((g) => g.kanji.length > 0);

    return (
        <PageShell>
            <Breadcrumbs
                items={[
                    { href: "/", label: "Home" },
                    { href: "/categories", label: "Themes" },
                    { label: category.name },
                ]}
            />

            {/* Hero */}
            <header className={`group relative overflow-hidden rounded-3xl border ${theme.border} ${theme.bg} p-6 sm:p-10`}>
                <CategoryCardArt category={category.name} theme={theme} />
                <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-2xl bg-white/10 ${theme.title} backdrop-blur-md border border-white/5 mb-4`}>
                        <Icon size={28} aria-hidden />
                    </div>
                    {category.story?.title && (
                        <p className="text-xs uppercase tracking-widest text-white/50 mb-1">{category.story.title}</p>
                    )}
                    <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${theme.title} drop-shadow-lg`}>{category.name}</h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        <StatBadge>{category.radicalCount} radicals</StatBadge>
                        <StatBadge>{category.kanjiCount} kanji</StatBadge>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={`/study?theme=${category.slug}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold hover:opacity-90 transition-opacity"
                        >
                            <GraduationCap size={18} aria-hidden /> Study this theme
                        </Link>
                        <Link
                            href={practiceCategoryPath(category.name)}
                            prefetch={false}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/40 border border-white/15 hover:bg-white/10 transition-colors"
                        >
                            <Swords size={18} aria-hidden /> Practice this theme (classic)
                        </Link>
                    </div>
                </div>
            </header>

            {category.story && (
                <div className="mt-10">
                    <CategoryStoryContent story={category.story} themeClass={themeClass} headingAs="h2" />
                </div>
            )}

            <Section title={`Radicals in ${category.name}`} id="radicals" className="scroll-mt-24">
                <ul className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.radicals.map((radical) => (
                        <li key={radical.key}>
                            <RadicalLinkCard
                                radical={radical}
                                variantOf={radical.kanjiCount === 0 ? getRadical(radical.key)?.variantOf : null}
                            />
                        </li>
                    ))}
                </ul>
            </Section>

            <Section title={`${category.name} kanji`} id="kanji" className="scroll-mt-24">
                <p className="text-white/50 text-sm mb-4">
                    {category.kanjiCount} kanji whose radical belongs to this theme, by JLPT level and frequency.
                </p>
                <div className="space-y-8">
                    {kanjiByLevel.map(({ level, kanji }) => (
                        <div key={level}>
                            <h3 className="flex items-center gap-2 mb-3">
                                <JlptBadge level={level} />
                                <span className="text-white/40 text-sm">{kanji.length} kanji</span>
                            </h3>
                            <KanjiTileGrid items={kanji} />
                        </div>
                    ))}
                </div>
            </Section>
        </PageShell>
    );
}
