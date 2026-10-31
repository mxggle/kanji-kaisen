import { cn } from "@/lib/utils";
import { ThemeGate } from "@/components/ui/ThemeGate";

export interface GateTheme {
    /** Theme name, e.g. "Nature & Elements". */
    name: string;
    /** The theme's kanji, concatenated, for the painted bar. */
    chars: string;
}

interface CategoryGatesProps {
    themes: GateTheme[];
    /** For `theme_gate_clicked`. */
    source: string;
    /**
     * grid: two columns on phones up to five on desktop (/categories).
     * rail: a swipeable row of small gates on phones, a grid from 640px (home).
     */
    layout?: "grid" | "rail";
    className?: string;
}

const LAYOUT = {
    grid: {
        list: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5",
        item: "",
        sizes: "(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw",
    },
    rail: {
        // The row bleeds to the screen edges on phones; the vertical padding keeps focus rings unclipped.
        list: "-mx-4 flex gap-2.5 overflow-x-auto px-4 py-1.5 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-x-4 sm:gap-y-[18px] sm:overflow-visible sm:p-0",
        item: "w-[118px] flex-none sm:w-auto",
        sizes: "(min-width: 640px) 220px, 118px",
    },
} as const;

/** The ten themes as gates, each with its painted bar (painted by the page's <InkPaint>). Server-safe. */
export function CategoryGates({ themes, source, layout = "grid", className }: CategoryGatesProps) {
    const l = LAYOUT[layout];
    return (
        <ul className={cn(l.list, className)}>
            {themes.map((theme) => (
                <li key={theme.name} className={l.item}>
                    <ThemeGate category={theme.name} chars={theme.chars} source={source} sizes={l.sizes} />
                </li>
            ))}
        </ul>
    );
}
