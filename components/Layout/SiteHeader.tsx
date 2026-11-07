"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBox } from "@/components/Search/SearchBox";
import { SkinToggle } from "@/components/Skin/SkinToggle";
import { HEADER_PATH_ID } from "./HeaderPath";
import { Logo } from "./Logo";
import { PLACES, isAtlasPage, placeFor } from "./places";
import { usePlaceMarker } from "./usePlaceMarker";

const ICON_BUTTON =
    "inline-flex size-10 flex-none items-center justify-center rounded-full border border-transparent text-ink-2 transition-[color,border-color,scale] duration-(--dur-ui) ease-(--ease-out) hover:border-line-2 hover:text-ink active:scale-[.94] active:duration-(--dur-micro) motion-reduce:transition-none [&_svg]:size-[18px]";

/** "/" focuses the header search, unless the learner is typing somewhere. */
function useSlashToSearch() {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
            const input = document.querySelector<HTMLInputElement>("[data-header-search] input");
            if (!input || input.offsetParent === null) return;
            e.preventDefault();
            input.focus();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
}

/**
 * Desktop: logo, Learn · Browse · My list · Teach, search, 夜/墨, settings.
 * Phone: logo, the compact atlas path (on atlas pages), search, 夜/墨,
 * settings; the four places move to the <TabBar>. Not sticky: the page owns
 * the whole viewport below it.
 */
export function SiteHeader() {
    const pathname = usePathname();
    const place = placeFor(pathname);
    const atlas = isAtlasPage(pathname);
    const home = pathname === "/";
    const nav = useRef<HTMLElement>(null);
    useSlashToSearch();
    usePlaceMarker(nav, place);

    return (
        <header data-chrome className="relative z-30 border-b border-line bg-bg print:hidden">
            <div className="flex h-14 items-center gap-2 px-4 lg:h-16 lg:gap-7 lg:px-8">
                {/* Phones keep only the mark on atlas pages, to make room for the path. */}
                <Logo wordmarkClassName={atlas ? "max-lg:hidden" : "max-[359px]:hidden"} />

                {/* The underline on the current place slides to the next one (usePlaceMarker). */}
                <nav ref={nav} aria-label="Main" className="hidden gap-0.5 self-stretch lg:flex">
                    {PLACES.map((item) => (
                        <Link
                            key={item.place}
                            href={item.href}
                            data-place={item.place}
                            aria-current={item.place === place ? "page" : undefined}
                            className="group relative -mb-px flex items-center whitespace-nowrap border-b-2 border-transparent px-3 text-[15px] text-ink-2 transition-colors duration-(--dur-ui) hover:text-ink aria-[current=page]:text-ink"
                        >
                            {item.label}
                            <span
                                aria-hidden
                                data-place-marker=""
                                className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-ink opacity-0 group-aria-[current=page]:opacity-100"
                            />
                        </Link>
                    ))}
                </nav>

                {/* Phone: the atlas path lands here (see AtlasPath). */}
                <div id={HEADER_PATH_ID} className="flex min-w-0 flex-1 items-center lg:hidden" />

                {home ? (
                    <span className="hidden flex-1 lg:block" />
                ) : (
                    <div data-header-search className="ml-auto hidden max-w-[400px] flex-1 lg:block">
                        <SearchBox variant="compact" shortcut="/" />
                    </div>
                )}

                <div className="flex flex-none items-center gap-1 lg:gap-7">
                    {!home && (
                        <Link href="/search" aria-label="Search kanji" className={cn(ICON_BUTTON, "lg:hidden")}>
                            <Search aria-hidden />
                        </Link>
                    )}
                    <SkinToggle />
                    <Link href="/settings" aria-label="Settings" aria-current={pathname === "/settings" ? "page" : undefined} className={cn(ICON_BUTTON, "aria-[current=page]:border-line-2 aria-[current=page]:text-ink")}>
                        <SlidersHorizontal aria-hidden />
                    </Link>
                </div>
            </div>
        </header>
    );
}
