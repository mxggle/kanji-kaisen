"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { categoryPath } from "@/lib/atlas/paths";
import { paintedPercent, themeProgress } from "@/lib/ink";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { FOCUS_RING, InkBar, shadeGradient, ThemeImage } from "./parts";
import { useInkEntries } from "./useInk";
import type { ThemeMeta } from "./types";
import styles from "./theme.module.css";

interface CategoryGatesProps {
    themes: ThemeMeta[];
    /** Each theme's kanji, concatenated, by slug. */
    chars: Record<string, string>;
}

/** /categories: one arched gate per theme, linking to it, with its painted share after hydration. */
export function CategoryGates({ themes, chars }: CategoryGatesProps) {
    const entries = useInkEntries();
    const lists = useMemo(() => Object.fromEntries(Object.entries(chars).map(([slug, text]) => [slug, Array.from(text)])), [chars]);

    return (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
            {themes.map((theme) => {
                const progress = entries ? themeProgress(entries, lists[theme.slug] ?? []) : null;
                const pct = progress ? paintedPercent(progress.painted) : null;
                return (
                    <li key={theme.slug}>
                        <Link
                            href={categoryPath(theme.name)}
                            style={themeVars(theme.name)}
                            onClick={() => trackEvent("theme_gate_clicked", { theme: theme.slug, source: "categories" })}
                            className={cn(styles.gate, "block h-[260px] sm:h-[300px] lg:h-[340px]", FOCUS_RING)}
                        >
                            <ThemeImage src={theme.image} sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw" className="opacity-80" />
                            <span
                                aria-hidden
                                className="absolute inset-0"
                                style={{ background: shadeGradient("180deg", [[0, 25], [0.9, 70], [0.97, 100]]) }}
                            />
                            <span className="absolute inset-x-3.5 bottom-3.5 flex flex-col gap-1.5 lg:inset-x-4 lg:bottom-4">
                                <span lang="ja" className="font-jp text-xs text-c lg:text-[13px]">{theme.jp}</span>
                                <span className="font-disp text-xl font-bold leading-[1.05] lg:text-[22px]">{theme.name}</span>
                                <span className="text-xs text-ink-3">
                                    {theme.radicalCount} radicals · {theme.kanjiCount} kanji
                                    {progress && progress.known > 0 && <> · you know {progress.known}</>}
                                </span>
                                <InkBar pct={pct ?? 0} className="mt-1" />
                                {pct !== null && <span className="sr-only">{pct}% painted</span>}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
