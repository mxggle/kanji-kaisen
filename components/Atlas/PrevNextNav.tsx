import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PrevNextItem {
    href: string;
    // Big glyph (kanji or radical char).
    char: string;
    // Small caption, e.g. the first meaning.
    label?: string;
}

/** Previous/next links between sibling atlas pages (kanji, radicals…). */
export function PrevNextNav({
    prev,
    next,
    ariaLabel = "Previous and next",
    caption,
    className,
}: {
    prev: PrevNextItem | null;
    next: PrevNextItem | null;
    ariaLabel?: string;
    // Shown above the links, e.g. "More JLPT N4 kanji by frequency".
    caption?: string;
    className?: string;
}) {
    if (!prev && !next) return null;
    const card =
        "flex items-center gap-3 min-w-0 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--accent)] transition-colors";
    return (
        <nav aria-label={ariaLabel} className={cn("mt-12", className)}>
            {caption && <p className="text-sm text-white/50 mb-3">{caption}</p>}
            <div className="grid grid-cols-2 gap-3">
                {prev ? (
                    <Link href={prev.href} rel="prev" className={card}>
                        <ChevronLeft size={18} className="text-white/40 shrink-0" aria-hidden />
                        <span className="text-3xl font-japanese font-bold">{prev.char}</span>
                        {prev.label && <span className="text-sm text-white/60 truncate">{prev.label}</span>}
                        <span className="sr-only">Previous</span>
                    </Link>
                ) : (
                    <span />
                )}
                {next ? (
                    <Link href={next.href} rel="next" className={cn(card, "justify-end text-right")}>
                        {next.label && <span className="text-sm text-white/60 truncate">{next.label}</span>}
                        <span className="text-3xl font-japanese font-bold">{next.char}</span>
                        <ChevronRight size={18} className="text-white/40 shrink-0" aria-hidden />
                        <span className="sr-only">Next</span>
                    </Link>
                ) : (
                    <span />
                )}
            </div>
        </nav>
    );
}
