"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { Menu, Search, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBox } from "@/components/Search/SearchBox";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

const NAV_ITEMS = [
    { href: "/browse", label: "Browse", match: ["/browse", "/kanji"] },
    { href: "/radicals", label: "Radicals", match: ["/radicals", "/radical/"] },
    { href: "/categories", label: "Themes", match: ["/categories", "/category/"] },
    { href: "/study", label: "Study", match: ["/study"] },
    { href: "/my-list", label: "My List", match: ["/my-list"] },
];

// Practice pages bundle the full Kanji alive/kanji-db JSON (~1.4 MB), so links
// to them are not prefetched from every atlas page.
const PRACTICE_ITEM = { href: "/practice", label: "Practice (classic)", match: ["/practice"] };

function isActive(pathname: string, match: string[]) {
    return match.some((m) => pathname === m || pathname.startsWith(m.endsWith("/") ? m : `${m}/`));
}

export function Header() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [lastPathname, setLastPathname] = useState(pathname);

    // Close the mobile menu after navigating.
    if (pathname !== lastPathname) {
        setLastPathname(pathname);
        setMenuOpen(false);
    }

    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [menuOpen]);

    const navLinkClass = (active: boolean) =>
        cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
        );

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-16 max-w-7xl mx-auto">
                <Link href="/" className="font-bold text-2xl tracking-tight text-white flex items-center gap-3 shrink-0" aria-label="Kanji Kaisen home">
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

                <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href} className={navLinkClass(isActive(pathname, item.match))} aria-current={isActive(pathname, item.match) ? "page" : undefined}>
                            {item.label}
                        </Link>
                    ))}
                    <span className="mx-1 h-4 w-px bg-white/15" aria-hidden />
                    <Link href={PRACTICE_ITEM.href} prefetch={false} className={cn(navLinkClass(isActive(pathname, PRACTICE_ITEM.match)), "text-white/50")}>
                        {PRACTICE_ITEM.label}
                    </Link>
                </nav>

                <div className="flex items-center gap-1">
                    <SearchBox variant="compact" className="hidden xl:block w-56" />
                    <Link href="/search" aria-label="Search kanji" className="xl:hidden p-2 rounded-full text-white/75 hover:bg-white/10 hover:text-white transition-colors">
                        <Search size={18} />
                    </Link>
                    <Link
                        href="/settings"
                        aria-label="Settings"
                        className={cn("hidden lg:inline-flex p-2 rounded-full transition-colors", pathname === "/settings" ? "bg-white/15 text-cyan-300" : "text-white/75 hover:bg-white/10 hover:text-white")}
                    >
                        <Settings size={17} />
                    </Link>
                    <button
                        type="button"
                        className="lg:hidden p-2 rounded-full text-white/80 hover:bg-white/10"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-nav"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <nav id="mobile-nav" aria-label="Main" className="lg:hidden border-t border-white/10 bg-black/95 px-4 py-3">
                    <SearchBox variant="compact" className="mb-3" onNavigate={() => setMenuOpen(false)} />
                    <ul className="flex flex-col gap-1">
                        {[...NAV_ITEMS, PRACTICE_ITEM, { href: "/settings", label: "Settings", match: ["/settings"] }].map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    prefetch={item.href === PRACTICE_ITEM.href ? false : undefined}
                                    className={cn("block px-3 py-2.5 rounded-lg text-base", isActive(pathname, item.match) ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10")}
                                    aria-current={isActive(pathname, item.match) ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </header>
    );
}
