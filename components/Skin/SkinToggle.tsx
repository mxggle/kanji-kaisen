"use client";

import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { SKIN_LABELS, SKINS, type Skin } from "./skin";
import { spreadSkin } from "./spreadSkin";
import { useSkin } from "./useSkin";
import "./skin.css";

const SIZES = {
    sm: "h-[30px] w-[34px] text-sm",
    md: "h-[34px] w-10 text-[15px]",
    // Phone size below lg, desktop size from lg (the header).
    responsive: "h-[30px] w-[34px] text-sm lg:h-[34px] lg:w-10 lg:text-[15px]",
};

/**
 * 夜/墨 segmented control. Persists the choice and fires `skin_changed`; the
 * new skin spreads from the button pressed (spreadSkin).
 *
 * The pressed look comes from <html data-skin> in CSS, so it is right before
 * hydration: one ink pill (.kk-skin-pill, skin.css) lies over the buttons and
 * slides between the halves, carrying the labels in --bg, so a label turns
 * exactly where the pill covers it. aria-pressed follows once React knows the skin.
 */
export function SkinToggle({ size = "responsive", className }: { size?: keyof typeof SIZES; className?: string }) {
    const skin = useSkin();

    const choose = (next: Skin, from: HTMLElement) => {
        if (next === skin) return;
        spreadSkin(next, from);
        trackEvent("skin_changed", { skin: next });
    };

    return (
        <div role="group" aria-label="Skin" className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full border border-line-2", className)}>
            {SKINS.map((value) => (
                <button
                    key={value}
                    type="button"
                    aria-pressed={skin === value}
                    title={`${SKIN_LABELS[value].name} skin`}
                    onClick={(e) => choose(value, e.currentTarget)}
                    className={cn(
                        "flex items-center justify-center font-jp text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
                        SIZES[size],
                    )}
                >
                    <span lang="ja" aria-hidden>{SKIN_LABELS[value].jp}</span>
                    <span className="sr-only">{SKIN_LABELS[value].name}</span>
                </button>
            ))}
            <span aria-hidden data-skin-pill="" className="kk-skin-pill pointer-events-none absolute inset-0 flex bg-ink text-bg">
                {SKINS.map((value) => (
                    <span key={value} lang="ja" className={cn("flex items-center justify-center font-jp", SIZES[size])}>
                        {SKIN_LABELS[value].jp}
                    </span>
                ))}
            </span>
        </div>
    );
}
