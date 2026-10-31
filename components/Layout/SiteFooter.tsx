"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { Logo } from "./Logo";

const LINK = "transition-colors hover:text-ink";

/** One row: logo, About & credits, Settings, Send feedback, GitHub, and the data credits. */
export function SiteFooter() {
    return (
        <footer data-chrome className="mx-auto mt-12 w-full max-w-[1200px] px-4 sm:px-10 print:hidden">
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-line pt-8 pb-12 text-sm text-ink-3">
                <Logo size="sm" />
                <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-7 gap-y-3">
                    <Link href="/about" className={LINK}>
                        About &amp; credits
                    </Link>
                    <Link href="/settings" className={LINK}>
                        Settings
                    </Link>
                    <a
                        href="https://kanjikaisen.featurebase.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("feedback_clicked", { source: "footer" })}
                        className={LINK}
                    >
                        Send feedback
                    </a>
                    <a href="https://github.com/mxggle/kanji-kaisen" target="_blank" rel="noopener noreferrer" className={LINK}>
                        GitHub
                    </a>
                </nav>
                <p className="lg:ml-auto">Strokes: KanjiVG, CC BY-SA 3.0 · Words: Kanji alive, CC BY 4.0</p>
            </div>
        </footer>
    );
}
