"use client";

// "Make a card" button for the kanji page. Only this file is in the page
// bundle: the dialog and the canvas code load when it is first hovered,
// focused or pressed.

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { ImageDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShareCardInput } from "@/lib/share-card";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";

const loadDialog = () => import("./ShareCardDialog");
const ShareCardDialog = dynamic(() => loadDialog().then((m) => m.ShareCardDialog), { ssr: false });

export interface ShareCardButtonProps extends ShareCardInput {
    /** Site printed on the card; defaults to the production site. */
    origin?: string;
    label?: string;
    /** Button look; quiet by default (it sits in a page's "More" row). */
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
}

export function ShareCardButton({ origin, label = "Make a card", variant = "quiet", size = "md", className, ...input }: ShareCardButtonProps) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        buttonRef.current?.focus();
    }, []);

    const prefetch = () => {
        void loadDialog();
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
                onPointerEnter={prefetch}
                onFocus={prefetch}
                className={cn(buttonClass({ variant, size }), className)}
            >
                <ImageDown aria-hidden />
                {label}
            </button>
            {open && <ShareCardDialog input={input} origin={origin} onClose={close} />}
        </>
    );
}
