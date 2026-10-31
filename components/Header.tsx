"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBox } from "@/components/Search/SearchBox";
import { SkinToggle } from "@/components/Skin/SkinToggle";

interface NavItem {
    href: string;
    label: string;
    match: string[];
    prefetch?: false;
}

// Main nav per the Today board. "/" only matches itself.
const NAV_ITEMS: NavItem[] = [
    { href: "/", label: "Learn", match: ["/", "/categories", "/category/", "/radicals", "/radical/"] },
    { href: "/browse", label: "Browse", match: ["/browse", "/kanji", "/search"] },
    { href: "/my-list", label: "My list", match: ["/my-list", "/study"] },
    { href: "/teach", label: "Teach", match: ["/teach", "/set"] },
];

// Practice pages bundle the full Kanji alive/kanji-db JSON (~1.4 MB), so links
// to them are not prefetched from every atlas page.
const PRACTICE_ITEM: NavItem = { href: "/practice", label: "Practice (classic)", match: ["/practice"], prefetch: false };

// The phone menu also lists the pages the desktop header leaves to the footer.
const MENU_ITEMS: NavItem[] = [
    NAV_ITEMS[0],
    { href: "/categories", label: "Themes", match: ["/categories", "/category/"] },
    { href: "/radicals", label: "Radicals", match: ["/radicals", "/radical/"] },
    NAV_ITEMS[1],
    NAV_ITEMS[2],
    { href: "/study", label: "Study", match: ["/study"] },
    NAV_ITEMS[3],
    PRACTICE_ITEM,
    { href: "/settings", label: "Settings", match: ["/settings"] },
];

function isActive(pathname: string, match: string[]) {
    return match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m.endsWith("/") ? m : `${m}/`)));
}

/** Learn is only "current" on its own pages, not on the theme/radical pages it also matches for the phone menu. */
function currentItem(pathname: string, items: NavItem[]) {
    return items.find((item) => item.href !== "/" && isActive(pathname, item.match))?.href
        ?? (isActive(pathname, items[0].match) ? items[0].href : undefined);
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

    const navCurrent = currentItem(pathname, NAV_ITEMS);
    const menuCurrent = currentItem(pathname, MENU_ITEMS);

    return (
        <header data-chrome className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-line print:hidden">
            <div className="flex items-center gap-2 lg:gap-9 px-4 lg:px-8 h-[60px] lg:h-16 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2.5 lg:gap-3 shrink-0 text-ink" aria-label="Kanji Kaisen home">
                    <span
                        lang="ja"
                        aria-hidden
                        className="flex items-center justify-center w-[30px] h-[30px] lg:w-8 lg:h-8 border border-ink-2 font-jp font-extrabold text-[17px] lg:text-[19px] leading-none"
                    >
                        解
                    </span>
                    <span className="font-disp text-xl lg:text-[22px] font-semibold tracking-[.04em] leading-none">Kanji Kaisen</span>
                </Link>

                <nav aria-label="Main" className="hidden lg:flex items-center gap-[26px] text-sm text-ink-2">
                    {NAV_ITEMS.map((item) => {
                        const current = item.href === navCurrent;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={current ? "page" : undefined}
                                className={cn(
                                    "py-1 transition-colors hover:text-ink",
                                    current && "text-ink underline decoration-[var(--accent)] decoration-2 underline-offset-8",
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex-1" />

                <div className="flex items-center gap-1 lg:gap-2">
                    <SearchBox variant="compact" className="hidden xl:block w-56" />
                    <Link href="/search" aria-label="Search kanji" className="xl:hidden p-2 rounded-full text-ink-2 hover:bg-ink/10 hover:text-ink transition-colors">
                        <Search size={18} />
                    </Link>
                    <Link
                        href="/settings"
                        aria-label="Settings"
                        aria-current={pathname === "/settings" ? "page" : undefined}
                        className={cn(
                            "hidden lg:inline-flex p-2 rounded-full transition-colors",
                            pathname === "/settings" ? "bg-ink/10 text-ink" : "text-ink-2 hover:bg-ink/10 hover:text-ink",
                        )}
                    >
                        <Settings size={17} />
                    </Link>
                    <SkinToggle className="max-[359px]:hidden ml-1" />
                    <button
                        type="button"
                        className="lg:hidden p-2 rounded-full text-ink-2 hover:bg-ink/10 hover:text-ink"
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
                <nav id="mobile-nav" aria-label="Main" className="lg:hidden border-t border-line bg-bg/95 px-4 py-3 max-h-[calc(100dvh-60px)] overflow-y-auto">
                    <SearchBox variant="compact" className="mb-3" onNavigate={() => setMenuOpen(false)} />
                    <ul className="flex flex-col gap-1">
                        {MENU_ITEMS.map((item) => {
                            const current = item.href === menuCurrent;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        prefetch={item.prefetch}
                                        className={cn(
                                            "block px-3 py-2.5 rounded-lg text-base",
                                            current ? "bg-ink/10 text-ink" : "text-ink-2 hover:bg-ink/5 hover:text-ink",
                                        )}
                                        aria-current={current ? "page" : undefined}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line px-3 pt-3">
                        <span className="text-sm text-ink-2">Skin: 夜 night or 墨 ink</span>
                        <SkinToggle size="sm" />
                    </div>
                </nav>
            )}
        </header>
    );
}
