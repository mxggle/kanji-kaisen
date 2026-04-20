"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { Heart, Flame, Settings } from "lucide-react";
import { useProgressStore } from "@/lib/store";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

export function Header() {
    const { hearts, streak } = useProgressStore();
    const pathname = usePathname();

    const isHomePage = pathname === "/";
    const isSettingsPage = pathname === "/settings";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
            <div className="flex items-center justify-between px-4 md:px-6 h-16">
                <div className="pointer-events-auto">
                    <Link href="/" className="font-bold text-2xl tracking-tight text-white flex items-center gap-3">
                        <span
                            className={`${bebasNeue.className} text-[var(--n2)] tracking-wider`}
                            style={{ textShadow: "0 0 8px rgba(244, 114, 182, 0.4), 0 1px 2px rgba(0,0,0,0.9)" }}
                        >
                            Kanji
                        </span>
                        <span
                            className={`${bebasNeue.className} text-[var(--accent)] tracking-wider`}
                            style={{ textShadow: "0 0 10px rgba(46, 255, 255, 0.5), 0 1px 2px rgba(0,0,0,0.9)" }}
                        >
                            Kaisen
                        </span>
                    </Link>
                </div>

                {!isHomePage && (
                    <div className="pointer-events-auto flex items-center gap-1.5 md:gap-2 bg-black/55 backdrop-blur-md px-2.5 md:px-3 py-1.5 rounded-full border border-white/10">
                        <div className="flex items-center gap-1.5 md:gap-2 text-rose-500 px-1.5">
                            <Heart size={16} fill="currentColor" className={hearts === 0 ? "text-gray-600" : ""} />
                            <span className="font-bold text-sm md:text-base leading-none">{hearts}</span>
                        </div>

                        <div className="h-4 w-px bg-white/15" />

                        <div className="flex items-center gap-1.5 md:gap-2 text-orange-500 px-1.5">
                            <Flame size={16} fill="currentColor" />
                            <span className="font-bold text-sm md:text-base leading-none">{streak}</span>
                        </div>

                        <div className="h-4 w-px bg-white/15" />

                        <Link
                            href="/settings"
                            aria-label="Open settings"
                            className={`p-1.5 rounded-full transition-colors ${isSettingsPage ? "bg-white/15 text-cyan-300" : "text-white/75 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <Settings size={15} />
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
