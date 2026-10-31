"use client";

import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { SKIN_LABELS, SKINS, type Skin } from "./skin";
import { setSkin, useSkin } from "./useSkin";

// The pressed look comes from <html data-skin> in CSS, so it is right before
// hydration. aria-pressed follows once React knows the skin.
const PRESSED: Record<Skin, string> = {
    night: "bg-ink text-bg [[data-skin=ink]_&]:bg-transparent [[data-skin=ink]_&]:text-ink-2 [[data-skin=ink]_&]:hover:text-ink",
    ink: "text-ink-2 hover:text-ink [[data-skin=ink]_&]:bg-ink [[data-skin=ink]_&]:text-bg [[data-skin=ink]_&]:hover:text-bg",
};

const SIZES = {
    sm: "h-[30px] px-2.5 text-sm",
    md: "h-[34px] px-3 text-[15px]",
    // Phone size below lg, desktop size from lg (the header).
    responsive: "h-[30px] px-2.5 text-sm lg:h-[34px] lg:px-3 lg:text-[15px]",
};

/** 夜/墨 segmented control. Persists the choice and fires `skin_changed`. */
export function SkinToggle({ size = "responsive", className }: { size?: keyof typeof SIZES; className?: string }) {
    const skin = useSkin();

    const choose = (next: Skin) => {
        if (next === skin) return;
        setSkin(next);
        trackEvent("skin_changed", { skin: next });
    };

    return (
        <div role="group" aria-label="Skin" className={cn("inline-flex shrink-0 overflow-hidden rounded-full border border-line-2", className)}>
            {SKINS.map((value) => (
                <button
                    key={value}
                    type="button"
                    aria-pressed={skin === value}
                    title={`${SKIN_LABELS[value].name} skin`}
                    onClick={() => choose(value)}
                    className={cn(
                        "flex items-center font-jp transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]",
                        SIZES[size],
                        PRESSED[value],
                    )}
                >
                    <span lang="ja" aria-hidden>{SKIN_LABELS[value].jp}</span>
                    <span className="sr-only">{SKIN_LABELS[value].name}</span>
                </button>
            ))}
        </div>
    );
}
