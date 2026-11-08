import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { categoryPath } from "@/lib/atlas/paths";
import { getCategoryImage, getCategorySlug, getThemeColor, isCategoryName, THEME_JP, THEME_SHORT } from "@/lib/atlas/categories";
import { PaintedBar } from "./PaintedBar";
import { TrackedLink } from "./TrackedLink";
import { Morph, morphName } from "@/components/Motion/Morph";

interface ThemeGateProps {
    /** Theme name, e.g. "Nature & Elements". */
    category: string;
    /** The theme's kanji, for the painted bar (painted by the page's <InkPaint>). */
    chars?: string | readonly string[];
    /** Kanji count line; defaults to the number of `chars`. */
    count?: number;
    /** Shows the full name instead of the one-word name. */
    longName?: boolean;
    /** Where the click came from, for `theme_gate_clicked`. */
    source?: string;
    href?: string;
    /** next/image sizes for the art. */
    sizes?: string;
    preload?: boolean;
    /**
     * The art flies into the theme page on navigation (components/Motion/Morph).
     * Only where this theme's gate appears once per page.
     */
    morph?: boolean;
    className?: string;
}

/**
 * The one way a theme appears: an arch with its art (ink wash in 墨), Japanese
 * name, name, kanji count and one painted bar. Server-safe.
 */
export function ThemeGate({ category, chars, count, longName, source = "gate", href, sizes = "(min-width: 1024px) 220px, 45vw", preload, morph, className }: ThemeGateProps) {
    const known = isCategoryName(category);
    const name = known && !longName ? THEME_SHORT[category] : category;
    const kanjiCount = count ?? (chars === undefined ? undefined : new Set(Array.from(chars)).size);
    return (
        <TrackedLink
            href={href ?? categoryPath(category)}
            event="theme_gate_clicked"
            properties={{ theme: getCategorySlug(category), source }}
            style={{ "--tc": getThemeColor(category) } as CSSProperties}
            className={cn(
                "group relative isolate block aspect-[3/4] min-w-0 overflow-hidden rounded-[999px_999px_14px_14px] border border-line bg-card text-ink",
                "transition-[transform,border-color] duration-400 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[3px] hover:border-c",
                "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                className,
            )}
        >
            <Morph name={morph && known && morphName.theme(getCategorySlug(category))}>
                <span aria-hidden className="absolute inset-0">
                    <Image src={getCategoryImage(category)} alt="" fill sizes={sizes} preload={preload} className="ink-art object-cover" />
                </span>
            </Morph>
            {/* The fade is solid enough behind the text for the small Japanese name to stay readable on busy art. */}
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--shade),0)_28%,rgba(var(--shade),.88)_62%,rgba(var(--shade),.97)_82%)]" />
            {/* The text sits on its own near-solid backing, so the names stay ≥ 4.5:1 on any art at any gate size. */}
            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-[5px] bg-[linear-gradient(180deg,rgba(var(--shade),0)_0%,rgba(var(--shade),.94)_30%)] px-3.5 pt-7 pb-3.5">
                {known && (
                    <span lang="ja" className="font-jp text-xs text-c">
                        {THEME_JP[category]}
                    </span>
                )}
                <span className="font-disp text-[21px] font-bold leading-[1.05]">{name}</span>
                {kanjiCount !== undefined && <span className="text-[11px] text-ink-3">{kanjiCount.toLocaleString("en")} kanji</span>}
                {chars !== undefined && <PaintedBar chars={chars} className="mt-0.5" />}
            </span>
        </TrackedLink>
    );
}
