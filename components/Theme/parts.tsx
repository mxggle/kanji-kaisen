// Hook-free building blocks shared by the home deck, the theme page and
// /categories. They work in server and client components.

import Image from "next/image";
import { cn } from "@/lib/utils";
import { SHADE_NAMES, type Shade } from "@/lib/ink";
import type { SealState } from "./order";
import styles from "./theme.module.css";

/** Class names for a radical seal in the given ink state (size classes come from the caller). */
export function sealClass(state: SealState | null, className?: string): string {
    return cn(styles.seal, styles[state ?? "blank"], className);
}

/** Visible keyboard focus for seals, gates and cells. */
export const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]";

// Kanji cells darken with ink: dashed paper, two greys, then the theme colour.
const CELL: Record<Shade, string> = {
    0: "border-dashed border-line-2 text-ink-3",
    1: "border-transparent bg-ink/10 text-ink",
    2: "border-transparent bg-ink/25 text-ink",
    3: "border-transparent bg-c/45 text-ink",
    4: "border-transparent bg-c text-onacc",
};

export function cellClass(shade: Shade, className?: string): string {
    return cn("border transition-colors duration-500", CELL[shade], className);
}

/** Five swatches for "darker = better known". */
export function InkLegend({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex gap-[3px]", className)} aria-hidden>
            {([0, 1, 2, 3, 4] as const).map((shade) => (
                <i key={shade} title={SHADE_NAMES[shade]} className={cellClass(shade, "block size-2.5 rounded-[3px]")} />
            ))}
        </span>
    );
}

/** The painted% ring. `pct` is null until the ink store hydrates: the ring is empty and the number hidden. */
export function InkRing({ pct, className, numberClassName }: { pct: number | null; className?: string; numberClassName?: string }) {
    const value = pct ?? 0;
    return (
        <div
            className={cn("relative flex-none", className)}
            role={pct === null ? undefined : "img"}
            aria-label={pct === null ? undefined : `${pct}% painted`}
            aria-hidden={pct === null ? true : undefined}
        >
            <svg viewBox="0 0 100 100" aria-hidden className="size-full -rotate-90 fill-none">
                <circle cx="50" cy="50" r="44" strokeWidth="4" className="stroke-line-2" />
                {value > 0 && (
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        strokeWidth="4"
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray={`${value} 100`}
                        className="stroke-c motion-safe:transition-[stroke-dasharray] motion-safe:duration-700"
                    />
                )}
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("font-disp font-bold leading-none", numberClassName, pct === null && "invisible")}>{value}%</span>
                <span className="text-[10px] text-ink-3 lg:text-[11px]">painted</span>
            </span>
        </div>
    );
}

/** A thin progress bar in the theme colour. `pct` 0–100. */
export function InkBar({ pct, className }: { pct: number; className?: string }) {
    return (
        <span aria-hidden className={cn("block h-[3px] rounded-sm bg-line-2", className)}>
            <span
                className="block h-full rounded-sm bg-c motion-safe:transition-[width] motion-safe:duration-700"
                style={{ width: `${pct}%` }}
            />
        </span>
    );
}

/** Theme art filling its positioned parent: full colour in 夜, ink wash in 墨. */
export function ThemeImage({
    src,
    sizes,
    preload,
    className,
}: {
    src: string;
    sizes: string;
    preload?: boolean;
    className?: string;
}) {
    return <Image src={src} alt="" fill sizes={sizes} preload={preload} className={cn("ink-art object-cover", className)} />;
}

/** Drifting mist over theme art. Position and size come from `className`. */
export function Fog({ className }: { className?: string }) {
    return <div aria-hidden className={cn(styles.fog, "-inset-x-[10%]", className)} />;
}

/** "rgba(var(--shade), a)" stops, so gradients fade into the page in both skins. */
export function shadeGradient(angle: string, stops: [number, number][]): string {
    return `linear-gradient(${angle}, ${stops.map(([alpha, at]) => `rgba(var(--shade), ${alpha}) ${at}%`).join(", ")})`;
}
