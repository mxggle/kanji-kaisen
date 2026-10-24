import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryPath } from "@/lib/atlas/paths";
import type { AtlasCategorySummary } from "@/lib/atlas/types";
import { getThemeStyle } from "./themeStyles";
import { CategoryCardArt } from "./CategoryCardArt";

/**
 * Atlas version of the practice CategoryCard: same look, no progress bar,
 * links to the server-rendered /category/[slug] page. Server-compatible.
 */
export function ThemeCard({ category }: { category: AtlasCategorySummary }) {
    const theme = getThemeStyle(category.name);
    const Icon = theme.icon;

    return (
        <Link
            href={categoryPath(category.name)}
            className={`
                group relative h-full min-h-56 flex flex-col p-6 rounded-3xl border overflow-hidden
                ${theme.bg} ${theme.border} backdrop-blur-md shadow-lg hover:shadow-2xl
                transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]
                focus-visible:outline-2 focus-visible:outline-[var(--accent)]
            `}
        >
            <CategoryCardArt category={category.name} theme={theme} />

            <div className="relative z-10 flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-white/10 ${theme.title} backdrop-blur-md shadow-inner border border-white/5`}>
                    <Icon size={24} aria-hidden />
                </div>
                <ArrowRight size={22} className={`${theme.title} opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} aria-hidden />
            </div>

            <div className="relative z-10 mt-auto">
                {category.title && (
                    <p className="text-xs uppercase tracking-widest text-white/50 mb-1">{category.title}</p>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${theme.title} tracking-wide drop-shadow-lg`}>{category.name}</h3>
                <p className="text-white/60 text-sm">
                    {category.radicalCount} radicals · {category.kanjiCount} kanji
                </p>
            </div>
        </Link>
    );
}
