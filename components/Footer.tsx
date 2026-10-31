"use client";

import Link from "next/link";
import { Globe, Mail, Heart, Github, MessageSquare } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const FOOTER_LINKS = [
    { href: "/", label: "Learn" },
    { href: "/browse", label: "Browse" },
    { href: "/categories", label: "Themes" },
    { href: "/radicals", label: "Radicals" },
    { href: "/my-list", label: "My list" },
    { href: "/study", label: "Study" },
    { href: "/teach", label: "Teach" },
    // Practice pages bundle ~1.4 MB of JSON, so this link is never prefetched.
    { href: "/practice", label: "Practice (classic)" },
    { href: "/about", label: "About & credits" },
];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer data-chrome className="w-full border-t border-line bg-bg mt-auto print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col items-center justify-center space-y-5">
                    {/* Feedback */}
                    <div className="w-full max-w-sm bg-card border border-line rounded-2xl p-6 mb-2 text-center">
                        <div className="flex justify-center mb-3">
                            <div className="p-3 rounded-full border border-line-2 text-[var(--accent)]">
                                <MessageSquare size={22} aria-hidden />
                            </div>
                        </div>
                        <h3 className="font-disp text-2xl font-semibold text-ink mb-1">Help us improve Kanji Kaisen</h3>
                        <p className="text-sm text-ink-2 mb-5 leading-relaxed">
                            Spotted a bug? Have a feature idea? <br />
                            Let us know on our feedback board.
                        </p>
                        <a
                            href="https://kanjikaisen.featurebase.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent("feedback_clicked", { source: "footer_card" })}
                            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full bg-[var(--accent)] text-onacc font-bold transition-colors hover:bg-ink hover:text-bg"
                        >
                            Give feedback
                        </a>
                    </div>

                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label="Kanji Kaisen home">
                        <span lang="ja" aria-hidden className="flex items-center justify-center w-7 h-7 border border-ink-2 font-jp font-extrabold text-base leading-none">解</span>
                        <span className="font-disp text-lg font-semibold tracking-[.04em]">Kanji Kaisen</span>
                    </Link>

                    {/* Site links */}
                    <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        {FOOTER_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                prefetch={link.href === "/practice" ? false : undefined}
                                className="text-sm text-ink-2 hover:text-ink transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Secondary links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2">
                        <a
                            href="https://github.com/mxggle/kanji-kaisen"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-ink-3 hover:text-ink transition-colors duration-200"
                        >
                            <Github className="w-4 h-4" aria-hidden />
                            <span className="text-sm">GitHub</span>
                        </a>
                        <a
                            href="https://harrysui.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-ink-3 hover:text-ink transition-colors duration-200"
                        >
                            <Globe className="w-4 h-4" aria-hidden />
                            <span className="text-sm">Personal Site</span>
                        </a>
                        <a
                            href="mailto:muggle6594@gmail.com"
                            className="flex items-center space-x-2 text-ink-3 hover:text-ink transition-colors duration-200"
                        >
                            <Mail className="w-4 h-4" aria-hidden />
                            <span className="text-sm">Contact</span>
                        </a>
                    </div>

                    {/* Creator */}
                    <div className="flex items-center space-x-2 text-ink-3 pt-2">
                        <span className="text-xs italic">Crafted with</span>
                        <Heart className="w-3 h-3 text-[var(--accent)] fill-current opacity-70" aria-label="love" />
                        <span className="text-xs">by</span>
                        <span className="text-ink-2 text-xs font-medium uppercase tracking-widest">HARRY SUI</span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col items-center space-y-1 pt-1 text-center">
                        <div className="text-[11px] text-ink-3">
                            © {currentYear} Kanji Kaisen • Version 2.0.0
                        </div>
                        <div className="text-[11px] text-ink-3">
                            Stroke data © KanjiVG (CC BY-SA 3.0) • Examples © Kanji alive (CC BY 4.0) •{" "}
                            <Link href="/about" className="underline hover:text-ink">Credits</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
