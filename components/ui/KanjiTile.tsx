import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import { plainReading } from "@/lib/atlas/readings";
import { getThemeColor } from "@/lib/atlas/categories";
import type { Shade } from "@/lib/ink";

export type TileSize = "sq" | "md" | "lg";

export interface KanjiTileData {
    char: string;
    meanings?: readonly string[];
    onyomi?: readonly string[];
    kunyomi?: readonly string[];
    /** The kanji's theme. The tile takes its colour; without one it inherits the page's. */
    category?: string | null;
}

interface KanjiTileProps {
    kanji: KanjiTileData;
    /** sq: glyph only · md: glyph, meaning, reading (default) · lg: a big glyph with on · kun. */
    size?: TileSize;
    /** Defaults to the kanji's page. */
    href?: string;
    /**
     * A fixed shade, for legends and demos. Without it the tile carries
     * data-kanji and the page's <InkPaint> fills it with the learner's ink.
     */
    shade?: Shade;
    className?: string;
    style?: CSSProperties;
}

const SIZES: Record<TileSize, { tile: string; glyph: string; meaning: string; reading: string }> = {
    sq: { tile: "aspect-square", glyph: "text-[28px] leading-[1.15]", meaning: "", reading: "" },
    md: { tile: "aspect-[1/1.12]", glyph: "text-[34px] leading-[1.15]", meaning: "text-xs", reading: "text-[11px]" },
    lg: { tile: "gap-1.5 px-4 pt-[22px] pb-[18px]", glyph: "text-[64px] leading-[1.05]", meaning: "text-sm", reading: "text-[13px]" },
};

/** First on'yomi, or first kun'yomi without notation; lg shows both ("カイ · うみ"). */
function tileReading(kanji: KanjiTileData, size: TileSize): string {
    const on = kanji.onyomi?.[0];
    const kun = kanji.kunyomi?.[0];
    const parts = size === "lg" ? [on, kun] : [on ?? kun];
    return parts.filter((r): r is string => !!r).map(plainReading).join(" · ");
}

/**
 * The one way a kanji appears in a list (rule 3: fill = your ink). A link with
 * the glyph, its first meaning and first reading. Server-safe.
 */
export function KanjiTile({ kanji, size = "md", href, shade, className, style }: KanjiTileProps) {
    const s = SIZES[size];
    const meaning = kanji.meanings?.[0];
    const reading = size === "sq" ? "" : tileReading(kanji, size);
    const themeStyle = kanji.category ? ({ "--tc": getThemeColor(kanji.category) } as CSSProperties) : undefined;
    return (
        <Link
            href={href ?? kanjiPath(kanji.char)}
            data-tile=""
            data-kanji={shade === undefined ? kanji.char : undefined}
            data-ink={shade ?? 0}
            title={meaning ? `${kanji.char} – ${meaning}` : undefined}
            style={themeStyle || style ? { ...themeStyle, ...style } : undefined}
            className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-px rounded-xl border border-line bg-card text-center text-ink",
                "transition-[transform,border-color] duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                s.tile,
                className,
            )}
        >
            <span lang="ja" className={cn("font-jp font-extrabold", s.glyph)}>
                {kanji.char}
            </span>
            {size === "sq"
                ? meaning && <span className="sr-only">{meaning}</span>
                : meaning && (
                      <span className={cn("max-w-[92%] truncate leading-[1.3] text-[var(--fg-2,var(--ink-2))]", s.meaning)}>{meaning}</span>
                  )}
            {reading && (
                <span lang="ja" className={cn("max-w-[92%] truncate font-jp leading-[1.3] text-[var(--fg-3,var(--ink-3))]", s.reading)}>
                    {reading}
                </span>
            )}
        </Link>
    );
}
