import Link from "next/link";
import { cn } from "@/lib/utils";
import { radicalPath } from "@/lib/atlas/paths";
import type { AtlasRadicalSummary } from "@/lib/atlas/types";
import { themeVars } from "@/components/Atlas/category/themeStyles";

interface RadicalLinkCardProps {
    radical: AtlasRadicalSummary;
    /** For story-only side forms (e.g. kihen), the radical whose kanji they share. */
    variantOf?: Pick<AtlasRadicalSummary, "char" | "name"> | null;
    className?: string;
}

/** Server-compatible radical card linking to /radical/[key], accented by its theme (--c). */
export function RadicalLinkCard({ radical, variantOf, className }: RadicalLinkCardProps) {
    return (
        <Link
            href={radicalPath(radical.key)}
            style={themeVars(radical.category)}
            className={cn(
                "group relative flex items-center gap-4 p-4 rounded-2xl border overflow-hidden transition-colors",
                "border-c/30 bg-card hover:bg-ink/5 hover:border-c",
                className,
            )}
        >
            <span
                className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-bg/30 border border-line",
                    "text-3xl font-japanese font-bold text-ink group-hover:scale-105 transition-transform",
                )}
            >
                {radical.char}
            </span>
            <span className="flex-1 min-w-0">
                <span className="block font-bold truncate text-c">{radical.name}</span>
                <span className="block text-sm text-ink-2 truncate">{radical.meaning}</span>
                <span className="block text-xs text-ink-3 mt-0.5">
                    {variantOf
                        ? `Side form of ${variantOf.char} ${variantOf.name}`
                        : `${radical.kanjiCount} kanji`}
                </span>
            </span>
        </Link>
    );
}
