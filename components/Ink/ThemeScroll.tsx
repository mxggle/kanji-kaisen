"use client";

import { cn } from "@/lib/utils";
import { getCategoryImage, isCategoryName, THEME_SHORT } from "@/lib/atlas/categories";
import { paintedPercent } from "@/lib/ink";
import { useThemeProgress } from "@/lib/ink-store";
import { themeVars } from "@/components/Atlas/category/themeStyles";

interface ThemeScrollProps {
    /** Theme (category) name, e.g. "Nature & Elements". */
    theme: string;
    /** Every kanji of the theme. */
    chars: readonly string[];
    className?: string;
}

/**
 * "Your Nature scroll · 38% painted": the theme art in grey with a colour layer
 * revealed to painted%, a glowing edge in 夜 and ink wash in 墨. Renders the
 * unpainted scroll on the server and until the ink store hydrates.
 *
 * @deprecated One Atlas: a theme shows its progress as one components/ui/PaintedBar (rule 3).
 */
export function ThemeScroll({ theme, chars, className }: ThemeScrollProps) {
    const progress = useThemeProgress(chars);
    const short = isCategoryName(theme) ? THEME_SHORT[theme] : theme;
    const image = getCategoryImage(theme);
    const pct = progress.hydrated ? paintedPercent(progress.painted) : 0;
    const label = progress.hydrated ? `Your ${short} scroll is ${pct}% painted` : `Your ${short} scroll`;

    return (
        <div
            style={themeVars(theme)}
            className={cn("flex items-center gap-4 rounded-[14px] border border-line bg-card p-3.5", className)}
        >
            <div role="img" aria-label={label} className="relative h-[84px] w-[150px] flex-none overflow-hidden rounded-lg bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" loading="lazy" decoding="async" className="scroll-base absolute inset-0 h-full w-full object-cover" />
                {pct > 0 && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="ink-art absolute inset-0 h-full w-full object-cover motion-safe:transition-[clip-path] motion-safe:duration-700"
                            style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
                        />
                        {pct < 100 && (
                            <span
                                aria-hidden
                                className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-c"
                                style={{ left: `${pct}%`, boxShadow: "var(--glow-off, 0 0 10px var(--c))" }}
                            />
                        )}
                    </>
                )}
            </div>
            <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">
                    Your {short} scroll{progress.hydrated && <> · {pct}% painted</>}
                </p>
                <p className="mt-1 text-[13px] leading-normal text-ink-2">
                    Every kanji you learn brings back a little colour.{" "}
                    {progress.hydrated ? `${progress.met} of ${progress.total} met.` : `${progress.total} kanji.`}
                </p>
            </div>
        </div>
    );
}
