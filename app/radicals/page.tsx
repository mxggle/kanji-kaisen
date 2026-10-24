import { getAllRadicals, getRadical } from "@/lib/atlas";
import { CATEGORIES, getCategorySlug } from "@/lib/atlas/categories";
import { categoryPath } from "@/lib/atlas/paths";
import { PageShell, Breadcrumbs } from "@/components/Atlas/PageShell";
import { RadicalLinkCard } from "@/components/Atlas/radical/RadicalLinkCard";
import { getThemeStyle } from "@/components/Atlas/category/themeStyles";
import { atlasMetadata } from "@/components/Atlas/metadata";
import Link from "next/link";

export const dynamic = "force-static";

export function generateMetadata() {
    const radicals = getAllRadicals();
    return atlasMetadata({
        title: "Radicals",
        description: `All ${radicals.length} kanji radicals grouped into ${CATEGORIES.length} themes, each with its origin, a memorable story and every kanji that uses it.`,
        path: "/radicals",
    });
}

export default function RadicalsPage() {
    const radicals = getAllRadicals();
    const groups = CATEGORIES.map((category) => ({
        category,
        radicals: radicals.filter((r) => r.category === category),
    })).filter((g) => g.radicals.length > 0);
    // Every radical has a theme (lib/radical-category-map.json), so none are dropped here.

    // Story-only side forms (e.g. kihen) share the kanji of their base radical.
    const variantOf = new Map(
        radicals.filter((r) => r.kanjiCount === 0).map((r) => [r.key, getRadical(r.key)?.variantOf ?? null]),
    );

    return (
        <PageShell>
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Radicals" }]} />

            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">Radicals</h1>
                <p className="text-white/60 max-w-2xl leading-relaxed">
                    Radicals are the building blocks of kanji. Learn what each one means and where it comes from,
                    and you can make an educated guess about thousands of characters. {radicals.length} radicals,
                    grouped into {CATEGORIES.length} themes.
                </p>
            </header>

            <nav aria-label="Themes" className="mb-4 flex flex-wrap gap-2">
                {groups.map(({ category, radicals: list }) => {
                    const theme = getThemeStyle(category);
                    return (
                        <a
                            key={category}
                            href={`#${getCategorySlug(category)}`}
                            className={`px-3 py-1.5 rounded-full text-sm border ${theme.border} ${theme.tint} ${theme.title} hover:bg-white/10 transition-colors`}
                        >
                            {category} <span className="text-white/40">{list.length}</span>
                        </a>
                    );
                })}
            </nav>

            {groups.map(({ category, radicals: list }) => {
                const theme = getThemeStyle(category);
                const Icon = theme.icon;
                return (
                    <section key={category} id={getCategorySlug(category)} className="mt-10 scroll-mt-24">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
                            <Icon size={20} className={theme.title} aria-hidden />
                            <h2 className={`text-xl font-bold ${theme.title}`}>{category}</h2>
                            <span className="text-white/40 text-sm">{list.length} radicals</span>
                            {(
                                <Link href={categoryPath(category)} className="ml-auto text-sm text-white/50 hover:text-[var(--accent)] transition-colors">
                                    About this theme →
                                </Link>
                            )}
                        </div>
                        <ul className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3">
                            {list.map((radical) => (
                                <li key={radical.key}>
                                    <RadicalLinkCard radical={radical} variantOf={variantOf.get(radical.key)} />
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </PageShell>
    );
}
