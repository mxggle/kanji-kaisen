"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const INTEREST_KEY = "kanji-zh-interest";

function readInterest(): boolean {
    try {
        return window.localStorage.getItem(INTEREST_KEY) === "1";
    } catch {
        return false;
    }
}

/**
 * The collapsed "In Chinese" note. Its content is server-rendered (children);
 * this wrapper fires `zh_note_opened` on the first open and runs the
 * "Want a Chinese edition?" fake door (`zh_edition_interest`).
 */
export function ZhNote({ char, relation, children }: { char: string; relation: string; children: ReactNode }) {
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
        <details onToggle={onToggle} className="group rounded-xl border border-line bg-card">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-ink [&::-webkit-details-marker]:hidden">
                <span>
                    <span className="font-bold">In Chinese</span>
                    <span className="ml-2 text-sm text-ink-3">simplified, traditional and pinyin</span>
                </span>
                <ChevronDown size={18} aria-hidden className="shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-4 border-t border-line px-4 py-4 text-sm leading-relaxed text-ink-2">
                {children}
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    {asked ? (
                        <p role="status" className="text-ink">
                            Thanks, noted. Interest like yours decides whether a Chinese edition gets built.
                        </p>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={ask}
                                className="inline-flex h-10 items-center rounded-full border border-line-2 px-4 text-sm text-ink transition-colors hover:border-[var(--c)] hover:text-[var(--c)]"
                            >
                                Want a Chinese edition?
                            </button>
                            <span className="text-xs text-ink-3">One click tells us. No sign-up.</span>
                        </>
                    )}
                </div>
            </div>
        </details>
    );
}
