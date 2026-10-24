import { getCategories } from "@/lib/atlas";
import { PageShell, Breadcrumbs } from "@/components/Atlas/PageShell";
import { ThemeCard } from "@/components/Atlas/category/ThemeCard";
import { atlasMetadata } from "@/components/Atlas/metadata";

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

            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">Kanji themes</h1>
                <p className="text-white/60 max-w-2xl leading-relaxed">
                    Every radical belongs to one of {categories.length} themes. Pick a theme to read its story, meet its
                    radicals and see every kanji built from them.
                </p>
            </header>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <li key={category.slug}>
                        <ThemeCard category={category} />
                    </li>
                ))}
            </ul>
        </PageShell>
    );
}
