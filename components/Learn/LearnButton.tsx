"use client";

import { cn } from "@/lib/utils";
import { buttonClass, type ButtonSize } from "@/components/ui/Button";
import { LEARN_HASH, openLearn } from "./learn-hash";

// Hovering or focusing the button fetches the layer's code, so it usually
// opens straight away with its own entrance instead of over a blank paper.
const prefetch = () => {
    void import("./LearnLayer");
};

interface LearnButtonProps {
    char: string;
    className?: string;
    /** Button size; lg by default (md for a phone action bar). */
    size?: ButtonSize;
    /** Optional element id. None by default, so two buttons on a page don't clash. */
    id?: string;
}

/** "Learn it · 4 steps", the page's primary (ink, rule 1): opens the #learn layer (a plain #learn link without JS). */
export function LearnButton({ char, className, size = "lg", id }: LearnButtonProps) {
    return (
        <a
            id={id}
            data-learn-button=""
            href={LEARN_HASH}
            role="button"
            onPointerEnter={prefetch}
            onFocus={prefetch}
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
            className={cn(buttonClass({ variant: "primary", size }), className)}
        >
            Learn it <span aria-hidden>·</span> 4 steps
        </a>
    );
}
