"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/Button";

const INTEREST_KEY = "kanji-zh-interest";

function readInterest(): boolean {
    try {
        return window.localStorage.getItem(INTEREST_KEY) === "1";
    } catch {
        return false;
    }
}

/**
 * The collapsed "In Chinese" row. Its content is server-rendered (children);
 * this wrapper fires `zh_note_opened` on the first open and runs the
 * "Want a Chinese edition?" fake door (`zh_edition_interest`).
 */
export function ZhNote({ char, relation, summary, children, className }: { char: string; relation: string; summary: string; children: ReactNode; className?: string }) {
    const opened = useRef(false);
    const [asked, setAsked] = useState(false);

    const onToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
        if (!e.currentTarget.open || opened.current) return;
        opened.current = true;
        trackEvent("zh_note_opened", { kanji: char, relation });
        if (readInterest()) setAsked(true);
    };

    const ask = () => {
        if (asked) return;
        trackEvent("zh_edition_interest", { kanji: char });
        try {
            window.localStorage.setItem(INTEREST_KEY, "1");
        } catch {
            // Storage blocked: the thank-you still shows for this page.
        }
        setAsked(true);
    };

    return (
        <details onToggle={onToggle} className={cn("group border-y border-line", className)}>
            <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-3.5 gap-y-1 py-3 text-[15px] text-ink [&::-webkit-details-marker]:hidden">
                <span lang="ja" aria-hidden className="font-jp text-lg font-extrabold">
                    中
                </span>
                <span className="font-bold">In Chinese</span>
                <span className="min-w-0 text-sm text-ink-2 max-sm:order-last max-sm:basis-full">{summary}</span>
                <span aria-hidden className="ml-auto text-sm text-ink-3">
                    <span className="group-open:hidden">Show</span>
                    <span className="hidden group-open:inline">Hide</span>
                </span>
            </summary>
            <div className="flex max-w-3xl flex-col gap-4 pb-5 text-sm leading-relaxed text-ink-2">
                {children}
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    {asked ? (
                        <p role="status" className="text-ink">
                            Thanks, noted. Interest like yours decides whether a Chinese edition gets built.
                        </p>
                    ) : (
                        <>
                            <Button size="sm" onClick={ask}>
                                Want a Chinese edition?
                            </Button>
                            <span className="text-xs text-ink-3">One click tells us. No sign-up.</span>
                        </>
                    )}
                </div>
            </div>
        </details>
    );
}
