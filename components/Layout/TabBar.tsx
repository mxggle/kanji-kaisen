"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLACES, placeFor } from "./places";

/** Phones: the four places at the bottom (学 Learn · 探 Browse · 墨 My list · 教 Teach). */
export function TabBar() {
    const place = placeFor(usePathname());
    return (
        <nav
            aria-label="Main"
            data-chrome
            className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(76px+env(safe-area-inset-bottom))] grid-cols-4 border-t border-line bg-[rgba(var(--shade),.94)] px-2 pt-1.5 pb-[calc(18px+env(safe-area-inset-bottom))] backdrop-blur-[10px] lg:hidden print:hidden"
        >
            {PLACES.map((item) => (
                <Link
                    key={item.place}
                    href={item.href}
                    aria-current={item.place === place ? "page" : undefined}
                    className="flex flex-col items-center justify-center gap-[3px] rounded-xl text-[11px] text-ink-3 transition-colors hover:text-ink aria-[current=page]:text-ink"
                >
                    <span lang="ja" aria-hidden className="font-jp text-xl font-extrabold leading-none">
                        {item.jp}
                    </span>
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
