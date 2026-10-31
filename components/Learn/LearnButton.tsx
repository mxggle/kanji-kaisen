"use client";

import { cn } from "@/lib/utils";
import { LEARN_HASH, openLearn } from "./learn-hash";

export const LEARN_BUTTON_ID = "learn-it";

/** "Learn it · 4 steps": opens the #learn layer (a plain #learn link without JS). */
export function LearnButton({ char, className }: { char: string; className?: string }) {
    return (
        <a
            id={LEARN_BUTTON_ID}
            href={LEARN_HASH}
            role="button"
            onClick={(e) => {
                e.preventDefault();
                openLearn(char, e.currentTarget);
            }}
            onKeyDown={(e) => {
                // role="button" answers Space like a button.
                if (e.key === " ") {
                    e.preventDefault();
                    openLearn(char, e.currentTarget);
                }
            }}
            className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink bg-ink px-6 text-[15px] font-bold text-bg transition-colors hover:border-[var(--c)] hover:bg-[var(--c)] hover:text-onacc",
                className,
            )}
        >
            Learn it <span aria-hidden>·</span> 4 steps
        </a>
    );
}
