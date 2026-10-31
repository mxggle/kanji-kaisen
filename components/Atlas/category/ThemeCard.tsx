import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryPath } from "@/lib/atlas/paths";
import type { AtlasCategorySummary } from "@/lib/atlas/types";
import { getThemeStyle, themeVars } from "./themeStyles";
import { CategoryCardArt } from "./CategoryCardArt";

/**
 * Atlas version of the practice CategoryCard: same layout, no progress bar,
 * links to the server-rendered /category/[slug] page. Coloured by --c, so it
 * follows the theme in 夜 and turns vermilion in 墨. Server-compatible.
 */
export function ThemeCard({ category }: { category: AtlasCategorySummary }) {
    const theme = getThemeStyle(category.name);
    const Icon = theme.icon;

    return (
        <Link
            href={categoryPath(category.name)}
            style={themeVars(category.name)}
            className={`
                group relative h-full min-h-56 flex flex-col p-6 rounded-3xl border overflow-hidden
                bg-card border-c/30 hover:border-c/70 shadow-lg hover:shadow-2xl
                transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]
                focus-visible:outline-2 focus-visible:outline-[var(--accent)]
            `}
        >
            <CategoryCardArt category={category.name} theme={theme} />

            <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-ink/10 text-c backdrop-blur-md shadow-inner border border-line">
                    <Icon size={24} aria-hidden />
                </div>
                <ArrowRight size={22} className={`text-c opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} aria-hidden />
            </div>

            <div className="relative z-10 mt-auto">
                {category.title && (
                    <p className="text-xs uppercase tracking-widest text-ink-3 mb-1">{category.title}</p>
                )}
                <h3 className="text-2xl font-bold mb-2 text-c tracking-wide">{category.name}</h3>
                <p className="text-ink-2 text-sm">
                    {category.radicalCount} radicals · {category.kanjiCount} kanji
                </p>
            </div>
        </Link>
    );
}
