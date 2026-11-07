import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import { plainReading } from "@/lib/atlas/readings";
import { getThemeColor } from "@/lib/atlas/categories";
import type { Shade } from "@/lib/ink";
import { Morph, morphName } from "@/components/Motion/Morph";

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
    /**
     * The glyph flies to the kanji page's hero on navigation (a shared
     * element, components/Motion/Morph). Only on lists where this kanji
     * appears once per page: a duplicate name cancels the transition.
     */
    morph?: boolean;
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
export function KanjiTile({ kanji, size = "md", href, shade, morph, className, style }: KanjiTileProps) {
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
                // Hover lifts 2px and shows the line; a press settles it back and down to .97, fast.
                // The learner's ink (data-ink, painted after hydration) soaks in slowly instead of snapping.
                "[transition:translate_240ms_var(--ease-out),scale_140ms_var(--ease-out),border-color_240ms_var(--ease-out),background-color_700ms_var(--ease-ink),color_700ms_var(--ease-ink)]",
                "hover:-translate-y-0.5 active:translate-y-0 active:scale-[.97]",
                "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
                s.tile,
                className,
            )}
        >
            <Morph name={morph && morphName.kanji(kanji.char)}>
                <span lang="ja" className={cn("font-jp font-extrabold", s.glyph)}>
                    {kanji.char}
                </span>
            </Morph>
            {size === "sq"
                ? meaning && <span className="sr-only">{meaning}</span>
                : meaning && (
                      <span className={cn("max-w-[92%] truncate leading-[1.3] text-[var(--fg-2,var(--ink-2))] [transition:color_700ms_var(--ease-ink)] motion-reduce:transition-none", s.meaning)}>
                          {meaning}
                      </span>
                  )}
            {reading && (
                <span
                    lang="ja"
                    className={cn("max-w-[92%] truncate font-jp leading-[1.3] text-[var(--fg-3,var(--ink-3))] [transition:color_700ms_var(--ease-ink)] motion-reduce:transition-none", s.reading)}
                >
                    {reading}
                </span>
            )}
        </Link>
    );
}
