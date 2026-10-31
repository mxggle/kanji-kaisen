"use client";

// "Make a card" button for the kanji page. Only this file is in the page
// bundle: the dialog and the canvas code load when it is first hovered,
// focused or pressed.

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { ImageDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShareCardInput } from "@/lib/share-card";

const loadDialog = () => import("./ShareCardDialog");
const ShareCardDialog = dynamic(() => loadDialog().then((m) => m.ShareCardDialog), { ssr: false });

export interface ShareCardButtonProps extends ShareCardInput {
    /** Site printed on the card; defaults to the production site. */
    origin?: string;
    label?: string;
    className?: string;
}

export function ShareCardButton({ origin, label = "Make a card", className, ...input }: ShareCardButtonProps) {
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
                className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
                    className,
                )}
            >
                <ImageDown size={16} aria-hidden />
                {label}
            </button>
            {open && <ShareCardDialog input={input} origin={origin} onClose={close} />}
        </>
    );
}
