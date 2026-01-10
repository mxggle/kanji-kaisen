"use client";

import Link from "next/link";

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
            <div className="flex items-center justify-between px-6 h-16">
                <div className="pointer-events-auto">
                    <Link href="/" className="font-bold text-xl tracking-tighter text-white flex items-center gap-2">
                        <span className="text-[var(--n2)]">Kanji</span>
                        <span className="text-[var(--accent)]">Kaisen</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
