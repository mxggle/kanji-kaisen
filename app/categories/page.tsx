import { getCategories } from "@/lib/atlas";
import { PageShell, Breadcrumbs } from "@/components/Atlas/PageShell";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { themeChars, themeMeta } from "@/components/Theme/data";
import { CategoryGates } from "@/components/Theme/CategoryGates";

export const dynamic = "force-static";

export function generateMetadata() {
    const categories = getCategories();
    return atlasMetadata({
        title: "Kanji themes",
        description: `Explore kanji through ${categories.length} themes, from ${categories[0].name} to ${categories[categories.length - 1].name}: the story behind each theme, its radicals and its kanji.`,
        path: "/categories",
    });
}

export default function CategoriesPage() {
    const categories = getCategories();

    return (
        <PageShell className="max-w-7xl">
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Themes" }]} />

            <header className="mb-8 lg:mb-10">
                <h1 className="font-disp text-4xl font-bold sm:text-5xl">Ten kanji themes</h1>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
                    Every radical belongs to one of {categories.length} themes. They sit side by side with no order, so
                    start anywhere: each theme has its story, its radicals in a suggested order and every kanji built
                    from them.
                </p>
            </header>

            <CategoryGates themes={categories.map(themeMeta)} chars={themeChars()} />
        </PageShell>
    );
}
