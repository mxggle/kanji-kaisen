"use client";

import { Menu, Search, Settings, Type } from "lucide-react";
import Link from "next/link";

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center justify-between px-4 h-14">
                {/* Left: Branding / Nav */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="font-bold text-xl tracking-tighter text-white flex items-center gap-2">
                        <span className="text-[var(--n2)]">Kanji</span>
                        <span className="text-[var(--accent)]">Heatmap</span>
                    </Link>

                    <button className="hidden md:flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/5">
                        Explore Kanji
                    </button>
                </div>

                {/* Center: Search Bar (Desktop) */}
                <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
                    <div className="relative w-full group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[var(--accent)] transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by reading, meaning..."
                            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[var(--accent)] focus:bg-white/10 transition-all placeholder:text-white/20"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Presentation Settings">
                        <Type className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Filter Settings">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Mobile Search Bar (visible on small screens) */}
            <div className="md:hidden px-4 pb-3 pt-1">
                <div className="relative w-full">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
            </div>
        </header>
    );
}
