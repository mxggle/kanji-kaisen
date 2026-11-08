import { cn } from "@/lib/utils";
import { SHADES, SHADE_NAMES, shadeLabel, type Shade } from "@/lib/ink";

/** One shade's fill as a small square (16px unless sized by className). */
export function InkSwatch({ shade, className }: { shade: Shade; className?: string }) {
    return <i aria-hidden data-ink={shade} className={cn("inline-block size-4 flex-none rounded", className)} />;
}

/** The five fills, "Not met … Mastered". Inherits the page's theme colour. */
export function InkLegend({ labels = true, className }: { labels?: boolean; className?: string }) {
    return (
        <div className={cn("inline-flex items-center gap-1.5 text-xs text-ink-3", className)}>
            {labels && <span aria-hidden>{SHADE_NAMES[0]}</span>}
            {SHADES.map((shade) => (
                <InkSwatch key={shade} shade={shade} />
            ))}
            {labels && <span aria-hidden>{SHADE_NAMES[4]}</span>}
            <span className="sr-only">Ink shades, lightest to darkest: {SHADES.map(shadeLabel).join(", ")}</span>
        </div>
    );
}
