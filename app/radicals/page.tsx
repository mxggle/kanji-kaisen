import Link from "next/link";
import { getAllRadicals, getRadical } from "@/lib/atlas";
import { CATEGORIES, getCategorySlug, THEME_JP, THEME_SHORT } from "@/lib/atlas/categories";
import { categoryPath } from "@/lib/atlas/paths";
import { PageShell } from "@/components/Atlas/PageShell";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { InkPaint } from "@/components/Ink/InkPaint";
import { compareByFrequency } from "@/components/Theme/order";
import { ancientStageCount } from "@/components/Journey/data";
import { RadicalSealGrid, type SealRadical } from "@/components/Journey/RadicalSealGrid";
import { gloss } from "@/components/Home/family";
import { Chip } from "@/components/ui/Chip";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";

export const dynamic = "force-static";

export function generateMetadata() {
    const radicals = getAllRadicals();
    return atlasMetadata({
        title: "Radicals",
        description: `All ${radicals.length} kanji radicals grouped into ${CATEGORIES.length} themes, each with its journey from ancient forms to today, its sourced origin, a memory story and every kanji that uses it.`,
        path: "/radicals",
    });
}

function sealRadical(key: string): SealRadical | null {
    const radical = getRadical(key);
    if (!radical) return null;
    const base = radical.variantOf;
    return {
        key: radical.key,
        char: radical.char,
        name: radical.name,
        meaning: radical.meaning,
        gloss: gloss(radical.meaning),
        chars: [...radical.kanji].sort(compareByFrequency).map((k) => k.char).join(""),
        ancient: ancientStageCount(radical),
        ...(base ? { sideOf: `${base.char} ${base.name}` } : {}),
    };
}

export default function RadicalsPage() {
    const radicals = getAllRadicals();
    // Index order: theme, then most kanji first. Every radical has a theme
    // (lib/radical-category-map.json), so none are dropped here.
    const groups = CATEGORIES.map((category) => ({
        category,
        slug: getCategorySlug(category),
        radicals: radicals
            .filter((r) => r.category === category)
            .map((r) => sealRadical(r.key))
            .filter((r): r is SealRadical => r !== null),
    })).filter((g) => g.radicals.length > 0);
    const withAncient = groups.reduce((n, g) => n + g.radicals.filter((r) => r.ancient > 0).length, 0);

    return (
        <InkPaint>
            <PageShell className="pt-8 sm:pt-10">
                <header className="flex max-w-3xl flex-col gap-3 pb-8">
                    <KindLabel jp="部首">
                        Learn · {radicals.length} radicals · {CATEGORIES.length} themes
                    </KindLabel>
                    <h1 className="type-title">Radicals</h1>
                    <p className="max-w-[60ch] text-base leading-relaxed text-ink-2">
                        Radicals are the building blocks of kanji. Learn what each one means and where it comes from, and you can make an educated guess about
                        thousands of characters. Each opens its journey from the oldest sourced form to today, with every kanji that uses it.
                    </p>
                    <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-3">
                        <span className="inline-flex items-center gap-2">
                            <Tag className="h-[18px] px-1.5 text-[11px]">
                                <span lang="ja">古</span>
                            </Tag>
                            Sourced ancient forms ({withAncient} radicals)
                        </span>
                        <span>Seals fill with ink as you learn their kanji</span>
                    </p>
                </header>

                <nav aria-label="Themes" className="flex flex-wrap gap-2">
                    {groups.map((g) => (
                        <Chip key={g.category} href={`#${g.slug}`} theme={g.category} count={g.radicals.length}>
                            {THEME_SHORT[g.category]}
                        </Chip>
                    ))}
                </nav>

                {groups.map((g) => (
                    <section
                        key={g.category}
                        id={g.slug}
                        aria-labelledby={`${g.slug}-title`}
                        style={themeVars(g.category)}
                        className="mt-12 flex scroll-mt-24 flex-col gap-6 border-t border-line pt-8 sm:mt-16"
                    >
                        <SectionHeader
                            id={`${g.slug}-title`}
                            jp={THEME_JP[g.category]}
                            title={g.category}
                            aside={
                                <span className="flex items-baseline gap-4">
                                    <span>{g.radicals.length} radicals</span>
                                    <Link href={categoryPath(g.category)} className="text-ink-2 transition-colors hover:text-ink">
                                        Open the theme <span aria-hidden>→</span>
                                    </Link>
                                </span>
                            }
                        />
                        <RadicalSealGrid radicals={g.radicals} />
                    </section>
                ))}
            </PageShell>
        </InkPaint>
    );
}
