import { getCategories, getKanjiByCategory } from "@/lib/atlas";
import { PageShell } from "@/components/Atlas/PageShell";
import { MorphLanding } from "@/components/Atlas/MorphLanding";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { InkPaint } from "@/components/Ink/InkPaint";
import { CategoryGates } from "@/components/Theme/CategoryGates";
import { KindLabel } from "@/components/ui/SectionHeader";
import { enterOrder } from "@/components/Motion/tokens";

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
    const themes = categories.map((c) => ({ name: c.name, chars: getKanjiByCategory(c.name).map((k) => k.char).join("") }));
    const radicals = categories.reduce((n, c) => n + c.radicalCount, 0);

    return (
        <InkPaint>
            <PageShell className="pt-8 sm:pt-10">
                <header className="flex max-w-3xl flex-col gap-3 pb-8">
                    <KindLabel jp="十の主題" data-enter="fade">
                        Learn · {categories.length} themes · {radicals} radicals
                    </KindLabel>
                    <h1 data-enter="ink" style={enterOrder(1)} className="type-title">
                        Ten kanji themes
                    </h1>
                    <p data-enter="rise" style={enterOrder(3)} className="max-w-[60ch] text-base leading-relaxed text-ink-2">
                        Every radical belongs to one of {categories.length} themes. They sit side by side with no order, so start anywhere: each theme has its story, its
                        radicals in a suggested order and every kanji built from them.
                    </p>
                </header>

                {/* The gates unroll one by one after the title, like hanging scrolls. */}
                <CategoryGates themes={themes} source="categories" enterDelay={240} />
                {/* A gate's art flying back from its theme page lands on a still gate. */}
                <MorphLanding />
            </PageShell>
        </InkPaint>
    );
}
