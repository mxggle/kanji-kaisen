import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getThemeColor } from "@/lib/atlas/categories";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { HeaderPath } from "./HeaderPath";

/** What sits before a step's label: the theme's dot, the radical's seal, or the kanji. */
export type PathMark =
    | { kind: "dot"; category: string }
    | { kind: "seal"; char: string; category?: string | null; chars?: string }
    | { kind: "glyph"; char: string };

export interface PathStep {
    label: string;
    /** Shorter label for the phone header ("Body" for "Human Body & People"). */
    short?: string;
    /** Omitted on the last step (the current page). */
    href?: string;
    mark?: PathMark;
}

export interface PathNeighbour {
    href: string;
    /** The glyph shown (体). */
    glyph: string;
    /** Accessible name, e.g. "Previous in 亻: 体 body". */
    label: string;
}

interface AtlasPathProps {
    /** The steps after "Learn": theme › radical › kanji, the last one current. */
    steps: PathStep[];
    /** The previous and next item in the same parent. */
    prev?: PathNeighbour | null;
    next?: PathNeighbour | null;
    /** Phones show the path in the header; false keeps it out (demos). */
    inHeader?: boolean;
    className?: string;
}

function Mark({ mark, compact }: { mark: PathMark; compact?: boolean }) {
    if (mark.kind === "dot") {
        return <span aria-hidden className="size-2 flex-none rounded-full bg-c" style={{ "--tc": getThemeColor(mark.category) } as CSSProperties} />;
    }
    if (mark.kind === "seal") {
        return <RadicalSeal char={mark.char} size="sm" category={mark.category} chars={mark.chars} orbClassName={compact ? "size-[22px] text-xs" : undefined} className="flex-none" />;
    }
    return (
        <span lang="ja" className="font-jp font-extrabold text-ink">
            {mark.char}
        </span>
    );
}

function Step({ step, compact }: { step: PathStep; compact?: boolean }) {
    const label = compact ? (step.short ?? step.label) : step.label;
    // On phones the current kanji shows as its glyph alone.
    const glyphOnly = compact && !step.href && step.mark?.kind === "glyph";
    const body: ReactNode = (
        <>
            {step.mark && <Mark mark={step.mark} compact={compact} />}
            {!glyphOnly && <span className="min-w-0 truncate">{label}</span>}
        </>
    );
    const cls = cn("inline-flex min-w-0 items-center", compact ? "gap-[5px]" : "gap-1.5");
    if (step.href) {
        return (
            <Link href={step.href} className={cn(cls, "transition-colors hover:text-ink")}>
                {body}
            </Link>
        );
    }
    return (
        <span aria-current="page" className={cn(cls, "flex-none text-ink", glyphOnly && "shrink-0")}>
            {body}
        </span>
    );
}

const SEP = (
    <span aria-hidden className="flex-none opacity-55">
        ›
    </span>
);

/**
 * Learn › theme › radical › kanji, with ‹ › neighbours on the right. Every
 * atlas page (theme, radical, kanji) shows it; on phones it moves into the
 * header. Server-safe.
 */
export function AtlasPath({ steps, prev, next, inHeader = true, className }: AtlasPathProps) {
    return (
        <>
            <nav aria-label="Atlas path" className={cn("hidden min-h-14 flex-wrap items-center gap-2.5 py-3 text-sm text-ink-3 lg:flex", className)}>
                <Link href="/" className="transition-colors hover:text-ink">
                    Learn
                </Link>
                {steps.map((step, i) => (
                    <span key={i} className="contents">
                        {SEP}
                        <Step step={step} />
                    </span>
                ))}
                {(prev || next) && (
                    <span className="ml-auto flex items-center gap-1">
                        {prev && (
                            <Link href={prev.href} aria-label={prev.label} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-ink-2 transition-colors hover:bg-card hover:text-ink">
                                <span aria-hidden>‹</span>
                                <span lang="ja" aria-hidden className="font-jp font-extrabold">
                                    {prev.glyph}
                                </span>
                            </Link>
                        )}
                        {next && (
                            <Link href={next.href} aria-label={next.label} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-ink-2 transition-colors hover:bg-card hover:text-ink">
                                <span lang="ja" aria-hidden className="font-jp font-extrabold">
                                    {next.glyph}
                                </span>
                                <span aria-hidden>›</span>
                            </Link>
                        )}
                    </span>
                )}
            </nav>
            {inHeader && (
                <HeaderPath>
                    <nav aria-label="Atlas path" className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[13px] text-ink-3">
                        {steps.map((step, i) => (
                            <span key={i} className="contents">
                                {i > 0 && SEP}
                                <Step step={step} compact />
                            </span>
                        ))}
                    </nav>
                </HeaderPath>
            )}
        </>
    );
}
