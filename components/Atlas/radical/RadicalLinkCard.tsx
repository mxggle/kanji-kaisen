import Link from "next/link";
import { cn } from "@/lib/utils";
import { radicalPath } from "@/lib/atlas/paths";
import type { AtlasRadicalSummary } from "@/lib/atlas/types";
import { getThemeStyle } from "@/components/Atlas/category/themeStyles";

interface RadicalLinkCardProps {
    radical: AtlasRadicalSummary;
    /** For story-only side forms (e.g. kihen), the radical whose kanji they share. */
    variantOf?: Pick<AtlasRadicalSummary, "char" | "name"> | null;
    className?: string;
}

/** Server-compatible radical card linking to /radical/[key], tinted by theme. */
export function RadicalLinkCard({ radical, variantOf, className }: RadicalLinkCardProps) {
    const theme = getThemeStyle(radical.category);
    return (
        <Link
            href={radicalPath(radical.key)}
            className={cn(
                "group relative flex items-center gap-4 p-4 rounded-2xl border overflow-hidden transition-colors",
                theme.border,
                theme.tint,
                "hover:bg-white/10 hover:border-[var(--accent)]",
                className,
            )}
        >
            <span
                className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-black/30 border border-white/10",
                    "text-3xl font-japanese font-bold text-white group-hover:scale-105 transition-transform",
                )}
            >
                {radical.char}
            </span>
            <span className="flex-1 min-w-0">
                <span className={cn("block font-bold truncate", theme.title)}>{radical.name}</span>
                <span className="block text-sm text-white/70 truncate">{radical.meaning}</span>
                <span className="block text-xs text-white/40 mt-0.5">
                    {variantOf
                        ? `Side form of ${variantOf.char} ${variantOf.name}`
                        : `${radical.kanjiCount} kanji`}
                </span>
            </span>
        </Link>
    );
}
